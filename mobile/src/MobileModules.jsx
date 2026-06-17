import { MODULES } from "@/data/curriculum";
import { useProgress } from "@/components/ProgressContext";
import { ChevronRight, ChevronLeft, Lock, CheckCircle2 } from "lucide-react";

export default function MobileModules({ activeModule, onOpenModule, onOpenLesson, onBack }) {
  const { progress } = useProgress();

  if (!activeModule) {
    return (
      <div className="fadein">
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>Modules</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODULES.map(mod => {
            const total = mod.lessons.length;
            const done = mod.lessons.filter(l => progress.completed[l.id]).length;
            const pct = Math.round((done / total) * 100);
            const allDone = done === total;
            return (
              <button key={mod.id} onClick={() => onOpenModule(mod)} className="card card-btn"
                style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, textAlign: "left", width: "100%" }}>
                <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.color}18`, border: `1px solid ${mod.color}30`, fontSize: 18 }}>{mod.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{mod.title}</span>
                    {allDone && <span className="badge badge-green">Done</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${pct}%`, background: allDone ? "var(--green)" : mod.color }} /></div>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)", flexShrink: 0 }}>{done}/{total}</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const mod = activeModule;
  return (
    <div className="fadein">
      <div className="mobile-topbar">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={15} /> Modules</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.color}18`, border: `1px solid ${mod.color}30`, fontSize: 16 }}>{mod.icon}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>{mod.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{mod.description}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mod.lessons.map((lesson, i) => {
          const done = !!progress.completed[lesson.id];
          const locked = i > 0 && !progress.completed[mod.lessons[i - 1].id];
          return (
            <button key={lesson.id} disabled={locked}
              onClick={() => !locked && onOpenLesson(mod, lesson)}
              className="card card-btn"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, textAlign: "left", width: "100%", opacity: locked ? 0.4 : 1, cursor: locked ? "not-allowed" : "pointer" }}>
              <div style={{ flexShrink: 0 }}>
                {locked ? <Lock size={15} style={{ color: "var(--text-3)" }} /> : done ? <CheckCircle2 size={15} style={{ color: "var(--green)" }} /> : <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${mod.color}` }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{lesson.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{lesson.minutes} min · {lesson.quiz?.length || 0} questions</div>
              </div>
              {!locked && <ChevronRight size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
