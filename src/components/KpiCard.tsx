type Tone = "neutral" | "positive" | "watch" | "risk";

const TONE_COLOR: Record<Tone, string> = {
  neutral: "var(--navy)",
  positive: "var(--positive)",
  watch: "var(--watch)",
  risk: "var(--risk)",
};

export function KpiCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        borderLeft: `3px solid ${TONE_COLOR[tone]}`,
        padding: "14px 16px",
        minWidth: 180,
        flex: 1,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
