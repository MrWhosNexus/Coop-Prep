import { useState } from "react";
import { useProgress } from "@/components/ProgressContext";
import { ChevronLeft, CheckCircle2, Clock, HelpCircle, Lightbulb } from "lucide-react";

export default function MobileLesson({ mod, lesson, onBack }) {
  const { progress, completeLesson, recordQuiz } = useProgress();
  const [tab, setTab] = useState("read");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const done = !!progress.completed[lesson.id];
  const allAnswered = lesson.quiz?.every((_, i) => answers[i] !== undefined);
  const correct = submitted ? lesson.quiz.filter((q, i) => answers[i] === q.a).length : 0;

  function submit() {
    if (!lesson.quiz?.length) return;
    const c = lesson.quiz.filter((q, i) => answers[i] === q.a).length;
    setSubmitted(true);
    recordQuiz(lesson.id, c, lesson.quiz.length);  // shared pathway → XP + achievements
  }

  const TABS = [
    { id: "read", label: "Lesson", icon: <Clock size={13} /> },
    { id: "quiz", label: `Quiz (${lesson.quiz?.length || 0})`, icon: <HelpCircle size={13} /> },
    { id: "challenge", label: "Challenge", icon: <Lightbulb size={13} /> },
  ];

  return (
    <div className="fadein">
      <div className="mobile-topbar">
        <button onClick={onBack} className="btn-ghost"><ChevronLeft size={15} /> Back</button>
        {done && <span className="badge badge-green" style={{ marginLeft: "auto" }}><CheckCircle2 size={10} /> Done</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: mod.color }}>{mod.title}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>{lesson.title}</div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", fontSize: 12.5, fontWeight: 600,
              borderRadius: "var(--r-sm)", cursor: "pointer",
              background: tab === t.id ? "var(--card-2)" : "transparent",
              color: tab === t.id ? "var(--text)" : "var(--text-3)",
              border: tab === t.id ? `1px solid ${mod.color}55` : "1px solid var(--border)" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "read" && (
        <div className="fadein">
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {lesson.body.map((p, i) => <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>{p}</p>)}
          </div>
          {!done ? (
            <button onClick={() => completeLesson(lesson.id)} className="btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: 14, background: mod.color, color: "#03121a" }}>
              <CheckCircle2 size={16} /> Mark Complete · +50 XP
            </button>
          ) : (
            <div className="card" style={{ padding: 14, textAlign: "center", color: "var(--green)", background: "var(--green-dim)", border: "1px solid var(--green-ring)" }}>✓ Lesson complete</div>
          )}
        </div>
      )}

      {tab === "quiz" && (
        <div className="fadein" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!lesson.quiz?.length ? <div className="card" style={{ padding: 20, textAlign: "center", color: "var(--text-2)" }}>No questions.</div> : (
            <>
              {lesson.quiz.map((q, qi) => (
                <div key={qi} className="card" style={{ padding: 16, borderLeft: `3px solid ${mod.color}60` }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}><span style={{ color: "var(--text-3)", marginRight: 6 }}>{qi + 1}.</span>{q.q}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      const selected = answers[qi] === opt;
                      const isCorrect = opt === q.a;
                      let bg = "var(--card-2)", border = "var(--border-2)", color = "var(--text-2)";
                      if (submitted) {
                        if (isCorrect) { bg = "var(--green-dim)"; border = "var(--green-ring)"; color = "var(--green)"; }
                        else if (selected) { bg = "var(--red-dim)"; border = "rgba(248,113,113,0.4)"; color = "var(--red)"; }
                      } else if (selected) { bg = "var(--blue-dim)"; border = "var(--blue-ring)"; color = "var(--blue-2)"; }
                      return (
                        <button key={opt} disabled={submitted} onClick={() => setAnswers(p => ({ ...p, [qi]: opt }))}
                          style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--r-md)", background: bg, border: `1px solid ${border}`, color, fontSize: 14, fontWeight: 500, textAlign: "left", cursor: submitted ? "default" : "pointer" }}>
                          <span className="mono" style={{ fontSize: 11, fontWeight: 700, opacity: 0.5 }}>{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {submitted ? (
                <>
                  <div className="card" style={{ padding: 18, textAlign: "center", background: correct === lesson.quiz.length ? "var(--green-dim)" : "var(--gold-dim)" }}>
                    <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: correct === lesson.quiz.length ? "var(--green)" : "var(--gold-2)" }}>{correct}/{lesson.quiz.length}</div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>{correct === lesson.quiz.length ? "Perfect! +25 XP" : "Review the highlighted answers."}</div>
                  </div>
                  <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="btn-ghost" style={{ width: "100%", justifyContent: "center" }}>Retry</button>
                </>
              ) : (
                <button onClick={submit} disabled={!allAnswered} className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: 14, background: allAnswered ? mod.color : "var(--card-2)", color: allAnswered ? "#03121a" : "var(--text-3)", cursor: allAnswered ? "pointer" : "not-allowed" }}>
                  {allAnswered ? "Submit Quiz" : `Answer all ${lesson.quiz.length}`}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {tab === "challenge" && (
        <div className="fadein">
          <div className="card-2" style={{ padding: 18, borderLeft: `3px solid ${mod.color}` }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: mod.color, marginBottom: 10 }}>Apply Your Knowledge</div>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>{lesson.challenge}</p>
          </div>
        </div>
      )}
    </div>
  );
}
