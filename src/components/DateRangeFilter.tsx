export type RangePreset = "7d" | "30d" | "month" | "all";

const OPTIONS: { key: RangePreset; label: string }[] = [
  { key: "7d", label: "7 วันล่าสุด" },
  { key: "30d", label: "30 วันล่าสุด" },
  { key: "month", label: "เดือนนี้" },
  { key: "all", label: "ทั้งหมด" },
];

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              padding: "6px 12px",
              fontSize: 13.5,
              borderRadius: 5,
              border: `1px solid ${active ? "var(--navy)" : "var(--line)"}`,
              background: active ? "var(--navy)" : "var(--surface)",
              color: active ? "#fff" : "var(--ink)",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
