import { useProgress } from "@/components/ProgressContext";
import MomentumStrip from "@/components/MomentumStrip";
import FocusTimer from "@/components/FocusTimer";
import { MODULES } from "@/data/curriculum";
import { BookOpen, Target, Zap, Flame, ChevronRight, Clock } from "lucide-react";

export default function MobileHome({ onOpenLesson, onGoModules }) {
  const { progress, days, readiness } = useProgress();
  const allLessons = MODULES.flatMap(m => m.lessons);
  const doneLessons = allLessons.filter(l => progress.completed[l.id]).length;
  const quizPasses = Object.values(progress.quizScores).filter(s => s.correct === s.total).length;

  // Continue target: first incomplete lesson in module/lesson order.
  let next = null;
  for (const mod of MODULES) {
    for (const lesson of mod.lessons) {
      if (!progress.completed[lesson.id]) { next = { mod, lesson }; break; }
    }
    if (next) break;
  }

  const stats = [
    { icon: <BookOpen size={15} />, value: doneLessons, sub: `/ ${allLessons.length}`, label: "Lessons", color: "var(--blue-2)" },
    { icon: <Target size={15} />, value: quizPasses, sub: " passed", label: "Quizzes", color: "var(--green)" },
    { icon: <Zap size={15} />, value: progress.xp, sub: " XP", label: "Earned", color: "var(--gold)" },
    { icon: <Flame size={15} />, value: progress.streak, sub: " days", label: "Streak", color: "#fb923c" },
  ];

  return (
    <div className="fadein">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>COOP Prep</h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}>{days} days to the fellowship</p>
      </div>

      <MomentumStrip />

      {/* Continue */}
      {next ? (
        <button onClick={() => onOpenLesson(next.mod, next.lesson)} className="card card-btn"
          style={{ display: "block", width: "100%", textAlign: "left", padding: 18, marginBottom: 16,
            borderColor: `${next.mod.color}40`, background: `linear-gradient(135deg, var(--card) 0%, ${next.mod.color}10 100%)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span className="badge" style={{ background: `${next.mod.color}20`, color: next.mod.color, borderColor: `${next.mod.color}40` }}>Continue</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{next.mod.title}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", lineHeight: 1.25, marginBottom: 8 }}>{next.lesson.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "var(--text-3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{next.lesson.minutes} min</span>
            <span style={{ color: "var(--gold)", fontWeight: 600 }}>+50 XP</span>
            <ChevronRight size={15} style={{ marginLeft: "auto", color: "var(--blue-2)" }} />
          </div>
        </button>
      ) : (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>All lessons complete 🎉</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Review flashcards and practice your pitch.</div>
        </div>
      )}

      {/* 2×2 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {stats.map(({ icon, value, sub, label, color }) => (
          <div key={label} className="card" style={{ padding: 14, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{value}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Focus timer (reused widget) */}
      <div className="card" style={{ padding: "6px 10px" }}><FocusTimer /></div>

      <button onClick={onGoModules} className="btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
        Browse all modules <ChevronRight size={15} />
      </button>
    </div>
  );
}
