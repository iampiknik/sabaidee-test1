import { useRef, useState } from "react";

export function FileDrop({
  label,
  accept = ".xlsx,.xls",
  onFile,
}: {
  label: string;
  accept?: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${dragOver ? "var(--navy)" : "var(--line)"}`,
        background: dragOver ? "var(--navy-tint)" : "var(--surface)",
        borderRadius: 8,
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        color: "var(--ink-soft)",
        fontSize: 14,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <div style={{ marginBottom: 4, color: "var(--ink)", fontWeight: 600 }}>{label}</div>
      <div>ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์ ({accept})</div>
    </div>
  );
}
