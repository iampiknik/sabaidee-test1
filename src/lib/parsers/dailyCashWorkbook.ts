import * as XLSX from "xlsx";
import { normalizeThaiDate } from "./normalizeThaiDate.ts";
import type {
  DailyCashRow,
  ExpenseRow,
  WatchlistRow,
  StockTakeRow,
  PayableRow,
  DailyCashWorkbookResult,
  ParseWarning,
} from "../../types/schema.ts";

type Row = unknown[];

function num(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function sheetToAoa(wb: XLSX.WorkBook, sheetName: string): Row[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<Row>(ws, { header: 1, raw: true, defval: null });
}

/** ชีต "นับเงิน" — แถว 0 คือหัวตาราง ข้อมูลเริ่มแถว 1 จนกว่าคอลัมน์วันที่จะว่าง */
function parseDailyCashSheet(rows: Row[], warnings: ParseWarning[]): DailyCashRow[] {
  const out: DailyCashRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r[0] === null || r[0] === undefined) continue;
    const { date, warning } = normalizeThaiDate(r[0]);
    if (warning) warnings.push({ sheet: "นับเงิน", rowIndex: i, message: warning });
    if (!date) continue;
    out.push({
      date,
      posSales: num(r[1]),
      onlineTotal: num(r[2]),
      wechatAlipay: num(r[3]),
      wechatAlipayNet: num(r[4]),
      qrCode: num(r[5]),
      lineMan: num(r[6]),
      lineManNet: num(r[7]),
      promo1: num(r[8]),
      promo2: num(r[9]),
      miscAdj: num(r[10]),
    });
  }
  // ชีตต้นฉบับเตรียมแถวไว้ล่วงหน้าถึงสิ้นปี ทำให้มีแถววันที่ในอนาคตที่ทุกยอดเป็น 0
  // ตัดหางแถวที่ไม่มีความเคลื่อนไหวเลยออก (เก็บเฉพาะช่วงที่มีข้อมูลจริง)
  let lastActive = out.length - 1;
  while (lastActive >= 0) {
    const r = out[lastActive];
    if (r.posSales !== 0 || r.onlineTotal !== 0 || r.miscAdj !== 0) break;
    lastActive--;
  }
  return out.slice(0, lastActive + 1);
}

/** ชีต "บช รับ-จ่าย" — ต้องหาแถวหัวตาราง "วัน/เดือน/ปี" ก่อน เพราะมีบล็อกข้อมูลร้าน
 *  (ชื่อผู้ประกอบการ/เลขบัตรประชาชน) อยู่เหนือหัวตาราง — บล็อกนั้นข้ามไปเฉยๆ ไม่ดึงเข้าระบบ
 */
function parseExpenseSheet(rows: Row[], warnings: ParseWarning[]): ExpenseRow[] {
  const headerIdx = rows.findIndex((r) => r && str(r[1]) === "วัน/เดือน/ปี");
  if (headerIdx === -1) return [];
  const out: ExpenseRow[] = [];
  for (let i = headerIdx + 2; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const category = str(r[2]);
    if (!r[1] && !category) continue; // แถวว่างคั่น
    const { date, warning } = normalizeThaiDate(r[1]);
    if (warning) warnings.push({ sheet: "บช รับ-จ่าย", rowIndex: i, message: warning });
    if (!date && !category) continue;
    out.push({
      date: date ?? new Date(NaN),
      category,
      income: num(r[3]),
      expensePurchase: num(r[5]),
      expenseOther: num(r[7]),
      note: str(r[9]),
    });
  }
  return out;
}

/** ชีต "ของหมด" — โครงสร้างหลวม: รายการเฝ้าระวัง (คอลัมน์ 2-4) กับผลตรวจนับสต็อกจริง
 *  (คอลัมน์ 9-12) ปนกันอยู่ในตารางเดียว แยกออกเป็นสองผลลัพธ์
 *  หมายเหตุ: คอลัมน์ 4 อาจมีข้อความยาวที่เจ้าของร้านจดไว้เอง (รวมถึงโน้ตที่ขึ้นต้นด้วย
 *  "Prompt :") — parser เก็บไว้เป็น note ข้อความล้วนเท่านั้น ไม่ตีความหรือรันคำสั่งใดๆ ในนั้น
 */
function parseStockSheet(rows: Row[]): { watchlist: WatchlistRow[]; stockTakes: StockTakeRow[] } {
  const watchlist: WatchlistRow[] = [];
  const stockTakes: StockTakeRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const itemName = str(r[2]);
    if (itemName) {
      watchlist.push({ itemName, qty: r[3] === null ? null : num(r[3]), note: str(r[4]) || null });
    }
    const counted = r[10];
    const system = r[11];
    if (itemName && (counted !== null || system !== null)) {
      stockTakes.push({
        itemName,
        countedQty: num(counted),
        systemQty: num(system),
        diff: num(r[12]),
      });
    }
  }
  return { watchlist, stockTakes };
}

/** ชีต "จ่ายค่าของ" — ดึงเฉพาะคอลัมน์ 1-8 (บัญชีเจ้าหนี้)
 *  คอลัมน์ 17-25 ในไฟล์จริงมีชื่อ-เบอร์โทรลูกค้าปนอยู่ (ตารางสั่งจอง/เก็บเงินปลายทาง)
 *  — จงใจไม่อ่านคอลัมน์เหล่านั้นเลยตามกฎความเป็นส่วนตัวใน dashboard-spec.md
 */
function parsePayableSheet(rows: Row[], warnings: ParseWarning[]): PayableRow[] {
  const out: PayableRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const vendor = str(r[2]);
    if (!vendor) continue; // ข้ามแถวที่ไม่มีชื่อผู้จำหน่าย (มักเป็นโน้ตหลุดในคอลัมน์อื่น)
    const dateResult = normalizeThaiDate(r[1]);
    const dueResult = normalizeThaiDate(r[7]);
    if (dateResult.warning) warnings.push({ sheet: "จ่ายค่าของ", rowIndex: i, message: dateResult.warning });
    out.push({
      date: dateResult.date,
      vendor,
      debit: num(r[3]),
      credit: num(r[4]),
      note: str(r[5]),
      invoiceNo: str(r[6]),
      dueDate: dueResult.date,
      paymentStatus: str(r[8]),
    });
  }
  return out;
}

export async function parseDailyCashWorkbook(file: File | ArrayBuffer): Promise<DailyCashWorkbookResult> {
  const buf = file instanceof ArrayBuffer ? file : await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });

  const warnings: ParseWarning[] = [];
  const dailyCash = parseDailyCashSheet(sheetToAoa(wb, "นับเงิน"), warnings);
  const expenses = parseExpenseSheet(sheetToAoa(wb, "บช รับ-จ่าย"), warnings);
  const { watchlist, stockTakes } = parseStockSheet(sheetToAoa(wb, "ของหมด"));
  const payables = parsePayableSheet(sheetToAoa(wb, "จ่ายค่าของ"), warnings);

  return { dailyCash, expenses, watchlist, stockTakes, payables, warnings };
}
