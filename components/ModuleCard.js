"use client";

/* Kept for compatibility — Dashboard.js renders modules inline now */
export default function ModuleCard({ mod, progress, onClick }) {
  const total  = mod.lessons.length;
  const done   = mod.lessons.filter(l => progress.completed[l.id]).length;
  const pct    = Math.round((done / total) * 100);
  const allDone = done === total;

  return (
    <button onClick={onClick} className="card card-btn"
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", width: "100%", textAlign: "left" }}>
      <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.color}18`, border: `1px solid ${mod.color}30`, fontSize: 18 }}>
        {mod.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{mod.title}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%`, background: allDone ? "var(--green)" : mod.color }} />
        </div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--text-3)" }}>{done}/{total} lessons</div>
      </div>
    </button>
  );
}
