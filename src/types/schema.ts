// โครงสร้างข้อมูลตาม dashboard-spec.md ส่วนที่ 3
// เก็บเป็น Gregorian Date (ค.ศ.) เสมอหลังผ่าน normalizeThaiDate แล้ว

export interface ParseWarning {
  sheet: string;
  rowIndex: number;
  message: string;
}

/** ชีต "นับเงิน" — ยอดขายและช่องทางรับเงินระดับวัน (ไม่ผูกกับบิล) */
export interface DailyCashRow {
  date: Date;
  posSales: number;
  onlineTotal: number;
  wechatAlipay: number;
  wechatAlipayNet: number;
  qrCode: number;
  lineMan: number;
  lineManNet: number;
  promo1: number; // คนละครึ่ง1_นิค
  promo2: number; // คนละครึ่ง2_แม่
  miscAdj: number; // รวม จิปาถะ (ส่วนต่างเงินสดที่นับได้จริง)
}

/** ชีต "บช รับ-จ่าย" — สมุดรายวันรับ-จ่าย */
export interface ExpenseRow {
  date: Date;
  category: string; // รายการ เช่น ค่าเช่า, เงินเดือน, ซื้อสินค้า, ขายสินค้า, ค่าไฟ, จิปาถะ
  income: number;
  expensePurchase: number; // รายจ่าย: ซื้อสินค้า
  expenseOther: number; // รายจ่าย: ค่าใช้จ่ายอื่น ๆ
  note: string;
}

/** ชีต "ของหมด" — รายการเฝ้าระวัง/สั่งซื้อ (โครงสร้างหลวม กรอกไม่ครบทุกแถว) */
export interface WatchlistRow {
  itemName: string;
  qty: number | null;
  note: string | null;
}

/** ชีต "ของหมด" — แถวที่มีข้อมูลตรวจนับสต็อกจริงครบ (เช็คสต็อก/จริง/คอม/ขาด-หาย) */
export interface StockTakeRow {
  itemName: string;
  countedQty: number;
  systemQty: number;
  diff: number;
}

/** ชีต "จ่ายค่าของ" — เฉพาะคอลัมน์บัญชีเจ้าหนี้ (คอลัมน์ชื่อ/เบอร์โทรลูกค้าถูกตัดออกโดยเจตนา) */
export interface PayableRow {
  date: Date | null;
  vendor: string;
  debit: number;
  credit: number;
  note: string;
  invoiceNo: string;
  dueDate: Date | null;
  paymentStatus: string;
}

export interface DailyCashWorkbookResult {
  dailyCash: DailyCashRow[];
  expenses: ExpenseRow[];
  watchlist: WatchlistRow[];
  stockTakes: StockTakeRow[];
  payables: PayableRow[];
  warnings: ParseWarning[];
}
