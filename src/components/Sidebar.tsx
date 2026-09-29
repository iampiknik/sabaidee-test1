const MENU = [
  { key: "overview", label: "ภาพรวมกิจการ", ready: false },
  { key: "finance", label: "การเงิน", ready: false },
  { key: "sales", label: "ยอดขาย", ready: true },
  { key: "inventory", label: "สินค้าและคลัง", ready: false },
  { key: "suppliers", label: "ผู้จำหน่าย", ready: false },
  { key: "risk", label: "ความเสี่ยงและการแจ้งเตือน", ready: false },
  { key: "trends", label: "แนวโน้มและการคาดการณ์", ready: false },
  { key: "import", label: "นำเข้าข้อมูลและสำรองข้อมูล", ready: false },
  { key: "settings", label: "ตั้งค่า", ready: false },
] as const;

export type PageKey = (typeof MENU)[number]["key"];

export function Sidebar({ active }: { active: PageKey }) {
  return (
    <nav
      style={{
        background: "var(--navy)",
        color: "#fff",
        width: 236,
        flexShrink: 0,
        padding: "20px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <div style={{ padding: "0 12px 20px", fontFamily: "var(--font-heading)", fontSize: 17, fontWeight: 700 }}>
        สบายดีฟาร์มาซี
      </div>
      {MENU.map((item) => {
        const isActive = item.key === active;
        return (
          <div
            key={item.key}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              fontSize: 14.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
              color: item.ready ? "#fff" : "rgba(255,255,255,0.45)",
              cursor: item.ready ? "pointer" : "default",
            }}
          >
            <span>{item.label}</span>
            {!item.ready && <span style={{ fontSize: 11.5 }}>เร็วๆ นี้</span>}
          </div>
        );
      })}
    </nav>
  );
}
