/**
 * ไฟล์ต้นทางพิมพ์วันที่แบบปี พ.ศ. (เช่น 2568, 2569) แต่ Excel เก็บตัวเลขปีนั้นตรงๆ
 * ราวกับเป็นปี ค.ศ. — ต้องลบ 543 เพื่อแปลงเป็น ค.ศ. ที่ถูกต้อง
 *
 * พบอีกกรณีหนึ่งในไฟล์จริง: บางแถวถูกพิมพ์ปีแบบย่อ 2 หลัก (เช่น "64") แล้ว Excel
 * ขยายเป็น ค.ศ. 1964 เอง (ไม่ใช่ พ.ศ.) — กรณีนี้เดาปีที่ถูกต้องไม่ได้อย่างปลอดภัย
 * จึงต้อง flag เป็น warning ให้ผู้ใช้ตรวจสอบเอง ไม่เดาให้
 */
export interface NormalizedDate {
  date: Date | null;
  original: Date | null;
  warning?: string;
}

const PLAUSIBLE_BE_MIN = 2400; // ปี พ.ศ. ที่ถูกเก็บเป็นเลขปี ค.ศ. ตรงๆ
const PLAUSIBLE_BE_MAX = 2700;
const PLAUSIBLE_CE_MIN = 2015;
const PLAUSIBLE_CE_MAX = 2035;

export function normalizeThaiDate(raw: unknown): NormalizedDate {
  if (!raw) return { date: null, original: null };
  const d = raw instanceof Date ? raw : new Date(String(raw));
  if (Number.isNaN(d.getTime())) return { date: null, original: null };

  const year = d.getFullYear();

  if (year >= PLAUSIBLE_BE_MIN && year <= PLAUSIBLE_BE_MAX) {
    const fixed = new Date(d);
    fixed.setFullYear(year - 543);
    return { date: fixed, original: d };
  }

  if (year >= PLAUSIBLE_CE_MIN && year <= PLAUSIBLE_CE_MAX) {
    return { date: d, original: d };
  }

  return {
    date: null,
    original: d,
    warning: `ปีวันที่ผิดปกติ (${year}) — น่าจะเกิดจากการพิมพ์ปีแบบย่อแล้ว Excel ตีความผิด ต้องตรวจสอบด้วยมือ`,
  };
}
