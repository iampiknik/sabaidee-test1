import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { parseDailyCashWorkbook } from "../lib/parsers/dailyCashWorkbook";
import type { DailyCashRow, ParseWarning } from "../types/schema";
import { KpiCard } from "../components/KpiCard";
import { DateRangeFilter, type RangePreset } from "../components/DateRangeFilter";
import { FileDrop } from "../components/FileDrop";
import { formatBaht, formatNumber, formatDateShort, formatDateFull } from "../lib/format";

function filterByRange(rows: DailyCashRow[], preset: RangePreset): DailyCashRow[] {
  if (rows.length === 0) return rows;
  if (preset === "all") return rows;
  const last = rows[rows.length - 1].date;
  if (preset === "month") {
    return rows.filter((r) => r.date.getMonth() === last.getMonth() && r.date.getFullYear() === last.getFullYear());
  }
  const days = preset === "7d" ? 7 : 30;
  const cutoff = new Date(last);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return rows.filter((r) => r.date >= cutoff);
}

export function SalesPage() {
  const [allRows, setAllRows] = useState<DailyCashRow[] | null>(null);
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);
  const [range, setRange] = useState<RangePreset>("30d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => (allRows ? filterByRange(allRows, range) : []), [allRows, range]);

  const totals = useMemo(() => {
    const posSales = rows.reduce((s, r) => s + r.posSales, 0);
    const online = rows.reduce((s, r) => s + r.onlineTotal, 0);
    const qr = rows.reduce((s, r) => s + r.qrCode, 0);
    const promo = rows.reduce((s, r) => s + r.promo1 + r.promo2, 0);
    const avgPerDay = rows.length > 0 ? posSales / rows.length : 0;
    return { posSales, online, qr, promo, avgPerDay, days: rows.length };
  }, [rows]);

  const channelBars = useMemo(
    () => [
      { name: "QR Code", value: totals.qr },
      { name: "ออนไลน์", value: totals.online },
      { name: "โครงการรัฐ", value: totals.promo },
    ],
    [totals]
  );

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const result = await parseDailyCashWorkbook(file);
      if (result.dailyCash.length === 0) {
        setError('ไม่พบข้อมูลในชีต "นับเงิน" — ตรวจสอบว่าไฟล์นี้เป็นไฟล์นับเงินรายวันที่ถูกต้อง');
      } else {
        setAllRows(result.dailyCash);
        setWarnings(result.warnings);
      }
    } catch (e) {
      setError("อ่านไฟล์ไม่สำเร็จ: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "28px 32px", flex: 1, overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22 }}>ยอดขาย</h1>
        {allRows && <DateRangeFilter value={range} onChange={setRange} />}
      </div>

      {!allRows && (
        <div style={{ maxWidth: 480 }}>
          <FileDrop label="นำเข้าไฟล์นับเงินรายวัน.xlsx" onFile={handleFile} />
          {loading && <p style={{ color: "var(--ink-soft)", marginTop: 10 }}>กำลังอ่านไฟล์…</p>}
          {error && <p style={{ color: "var(--risk)", marginTop: 10 }}>{error}</p>}
        </div>
      )}

      {allRows && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            <KpiCard label="ยอดขายรวม (ตามช่วงที่เลือก)" value={formatBaht(totals.posSales)} tone="neutral" />
            <KpiCard
              label="เฉลี่ยต่อวัน"
              value={formatBaht(Math.round(totals.avgPerDay))}
              sub={`${formatNumber(totals.days)} วันที่มีข้อมูล`}
              tone="neutral"
            />
            <KpiCard label="ยอดชำระออนไลน์รวม" value={formatBaht(totals.online)} tone="positive" />
            <KpiCard label="ยอดโครงการรัฐรวม" value={formatBaht(totals.promo)} tone="watch" />
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "18px 20px",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 15, marginBottom: 14 }}>ยอดขายรายวัน (ยอดขาย(คอม))</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={rows}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: Date) => formatDateShort(d)}
                  tick={{ fontSize: 11.5, fill: "var(--ink-soft)" }}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={(v: number) => formatNumber(v)}
                  tick={{ fontSize: 11.5, fill: "var(--ink-soft)" }}
                  width={64}
                />
                <Tooltip
                  labelFormatter={(d) => formatDateFull(d as unknown as Date)}
                  formatter={(v) => formatBaht(v as number)}
                />
                <Line type="monotone" dataKey="posSales" stroke="var(--navy)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              padding: "18px 20px",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 15, marginBottom: 14 }}>ยอดขายแยกช่องทางรับเงิน (ระดับวัน)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={channelBars} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--line)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => formatNumber(v)} tick={{ fontSize: 11.5 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 13 }} width={90} />
                <Tooltip formatter={(v) => formatBaht(v as number)} />
                <Bar dataKey="value" fill="var(--navy)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 10 }}>
              ข้อมูลนี้มาจากไฟล์นับเงินรายวัน เป็นยอดรวมระดับวันเท่านั้น ไม่ผูกกับบิลหรือสินค้ารายตัว
            </p>
          </div>

          <div
            style={{
              background: "var(--watch-tint)",
              border: "1px solid var(--watch)",
              borderRadius: 8,
              padding: "14px 18px",
              marginBottom: 20,
              fontSize: 13.5,
            }}
          >
            <strong>ข้อมูลไม่เพียงพอ:</strong> จำนวนบิล สินค้าขายดี และยอดขายแยกตามช่องทาง/สินค้า
            ยังคำนวณไม่ได้ ต้องนำเข้ารายงาน "ขายแยกตามบิลขาย" เพิ่มก่อน (ยังไม่ได้ทำ parser ส่วนนี้)
          </div>

          {warnings.length > 0 && (
            <details style={{ marginBottom: 20, fontSize: 13 }}>
              <summary style={{ cursor: "pointer", color: "var(--ink-soft)" }}>
                คำเตือนจากการนำเข้า ({formatNumber(warnings.length)} รายการ)
              </summary>
              <ul style={{ maxHeight: 160, overflow: "auto", paddingLeft: 18 }}>
                {warnings.slice(0, 50).map((w, i) => (
                  <li key={i}>
                    [{w.sheet}] แถว {w.rowIndex}: {w.message}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8 }}>
            <table>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "right" }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>
                    วันที่
                  </th>
                  <th style={{ padding: "10px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>ยอดขาย(คอม)</th>
                  <th style={{ padding: "10px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>ออนไลน์</th>
                  <th style={{ padding: "10px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>QR Code</th>
                  <th style={{ padding: "10px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>โครงการรัฐ</th>
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.date.toISOString()} style={{ borderBottom: "1px solid var(--line)", textAlign: "right" }}>
                    <td style={{ textAlign: "left", padding: "8px 16px", fontSize: 13.5 }}>{formatDateFull(r.date)}</td>
                    <td style={{ padding: "8px 16px", fontSize: 13.5 }}>{formatNumber(r.posSales)}</td>
                    <td style={{ padding: "8px 16px", fontSize: 13.5 }}>{formatNumber(r.onlineTotal)}</td>
                    <td style={{ padding: "8px 16px", fontSize: 13.5 }}>{formatNumber(r.qrCode)}</td>
                    <td style={{ padding: "8px 16px", fontSize: 13.5 }}>{formatNumber(r.promo1 + r.promo2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={() => setAllRows(null)}
            style={{
              marginTop: 16,
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            นำเข้าไฟล์ใหม่
          </button>
        </>
      )}
    </div>
  );
}
