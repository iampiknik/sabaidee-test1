import { readFileSync } from "node:fs";
import { parseDailyCashWorkbook } from "../src/lib/parsers/dailyCashWorkbook.ts";
import type { DailyCashWorkbookResult, DailyCashRow } from "../src/types/schema.ts";

// หมายเหตุ: path นี้ชี้ไปที่ไฟล์ตัวอย่างจริงของผู้ใช้เพื่อทดสอบเท่านั้น
// ห้าม commit ไฟล์นี้หรือ path นี้เข้า repo — ดู .gitignore / README
const SAMPLE_PATH = process.argv[2];
if (!SAMPLE_PATH) {
  console.error("ใช้งาน: tsx scripts/test-parse-daily-cash.ts <path-to-xlsx>");
  process.exit(1);
}

const buf = readFileSync(SAMPLE_PATH);
const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

parseDailyCashWorkbook(arrayBuffer as ArrayBuffer).then((result: DailyCashWorkbookResult) => {
  console.log("=== นับเงิน (daily_cash) ===");
  console.log("จำนวนแถว:", result.dailyCash.length);
  console.log("ตัวอย่าง 3 แถวแรก:", result.dailyCash.slice(0, 3));
  console.log("ตัวอย่าง 3 แถวสุดท้าย:", result.dailyCash.slice(-3));

  console.log("\n=== บช รับ-จ่าย (expenses) ===");
  console.log("จำนวนแถว:", result.expenses.length);
  console.log("ตัวอย่าง 5 แถวแรก:", result.expenses.slice(0, 5));

  console.log("\n=== ของหมด: watchlist ===");
  console.log("จำนวนแถว:", result.watchlist.length);
  console.log("ตัวอย่าง 3 แถวแรก:", result.watchlist.slice(0, 3));

  console.log("\n=== ของหมด: stock_takes ===");
  console.log("จำนวนแถว:", result.stockTakes.length);
  console.log(result.stockTakes.slice(0, 10));

  console.log("\n=== จ่ายค่าของ (payables, ไม่รวมคอลัมน์ลูกค้า) ===");
  console.log("จำนวนแถว:", result.payables.length);
  console.log("ตัวอย่าง 5 แถวแรก:", result.payables.slice(0, 5));

  console.log("\n=== Warnings ===");
  console.log("จำนวน warning ทั้งหมด:", result.warnings.length);
  console.log("ตัวอย่าง 10 รายการแรก:");
  for (const w of result.warnings.slice(0, 10)) {
    console.log(`  [${w.sheet}] row ${w.rowIndex}: ${w.message}`);
  }

  // เช็ค sanity: ยอดรวม POS sales ทั้งหมด
  const totalPos = result.dailyCash.reduce((s: number, r: DailyCashRow) => s + r.posSales, 0);
  console.log("\n=== Sanity check ===");
  console.log("ยอดขาย(คอม) รวมทั้งหมดจากชีตนับเงิน:", totalPos.toLocaleString("th-TH"), "บาท");
  console.log(
    "ช่วงวันที่:",
    result.dailyCash[0]?.date.toISOString().slice(0, 10),
    "ถึง",
    result.dailyCash[result.dailyCash.length - 1]?.date.toISOString().slice(0, 10)
  );
});
