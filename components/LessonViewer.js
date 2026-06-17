"use client";

import { useState } from "react";
import { ArrowLeft, Clock, CheckCircle2, HelpCircle, Lightbulb } from "lucide-react";

export default function LessonViewer({ lesson, mod, progress, onBack, onComplete, onQuizDone }) {
  const [tab, setTab] = useState("read");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [noteText, setNoteText] = useState(progress.notes?.[lesson.id] || "");

  const done      = !!progress.completed[lesson.id];
  const quizScore = progress.quizScores?.[lesson.id];
  const allDone   = lesson.quiz?.every((_, i) => answers[i] !== undefined);
  const correct   = submitted ? lesson.quiz.filter((q, i) => answers[i] === q.a).length : 0;

  function submit() {
    if (!lesson.quiz?.length) return;
    const c = lesson.quiz.filter((q, i) => answers[i] === q.a).length;
    setSubmitted(true);
    onQuizDone(lesson.id, c, lesson.quiz.length);
  }

  const TABS = [
    { id: "read",      label: "Lesson",   icon: <Clock size={13} /> },
    { id: "quiz",      label: `Quiz (${lesson.quiz?.length || 0})`, icon: <HelpCircle size={13} /> },
    { id: "challenge", label: "Challenge", icon: <Lightbulb size={13} /> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "rgba(13,17,23,0.6)",
        backdropFilter: "blur(16px) saturate(150%)",
        borderBottom: "1px solid var(--border)",
        padding: "0 32px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 14, paddingBottom: 12 }}>
            <button onClick={onBack} className="btn-ghost" style={{ flexShrink: 0 }}>
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: mod.color, marginBottom: 2 }}>
                {mod.title}
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {lesson.title}
              </div>
            </div>
            {done && (
              <span className="badge badge-green" style={{ flexShrink: 0 }}>
                <CheckCircle2 size={10} /> Done
              </span>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px", fontSize: 13, fontWeight: 500,
                  color: tab === t.id ? "var(--text)" : "var(--text-3)",
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: tab === t.id ? `2px solid ${mod.color}` : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 0.12s ease",
                }}>
                <span style={{ color: tab === t.id ? mod.color : "inherit" }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: "40px 32px", maxWidth: 720, margin: "0 auto", width: "100%" }}>

        {/* ── Read ── */}
        {tab === "read" && (
          <div className="fadein">
            <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
              <span className="badge badge-muted"><Clock size={10} /> {lesson.minutes} min read</span>
              {done && <span className="badge badge-green"><CheckCircle2 size={10} /> Completed</span>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {lesson.body.map((para, i) => (
                <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-2)" }}>{para}</p>
              ))}
            </div>

            {/* Notes */}
            <div style={{ marginTop: 40, paddingTop: 28, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: mod.color }} />
                <span className="section-label">Your Notes</span>
              </div>
              <textarea
                rows={4}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Write anything here — only you can see this."
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: "var(--r-md)",
                  background: "var(--card)", border: "1px solid var(--border-2)",
                  color: "var(--text)", fontSize: 14, lineHeight: 1.6,
                  resize: "vertical", outline: "none",
                  transition: "border-color 0.12s ease, box-shadow 0.12s ease",
                }}
                onFocus={e => { e.target.style.borderColor = `${mod.color}60`; e.target.style.boxShadow = `0 0 0 3px ${mod.color}15`; }}
                onBlur={e => { e.target.style.borderColor = "var(--border-2)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              {!done ? (
                <button onClick={() => onComplete(lesson.id)} className="btn-primary"
                  style={{ width: "100%", padding: "14px", fontSize: 14.5, justifyContent: "center", background: mod.color, boxShadow: `0 4px 14px ${mod.color}40` }}>
                  <CheckCircle2 size={16} /> Mark Lesson Complete · +50 XP
                </button>
              ) : (
                <div style={{
                  padding: "14px", textAlign: "center", borderRadius: "var(--r-md)",
                  background: "var(--green-dim)", color: "var(--green)",
                  border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600,
                }}>
                  ✓ Lesson complete — try the Quiz and Challenge next
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Quiz ── */}
        {tab === "quiz" && (
          <div className="fadein">
            {!lesson.quiz?.length ? (
              <div className="card" style={{ padding: 32, textAlign: "center", color: "var(--text-2)" }}>No questions for this lesson.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Previous score */}
                {quizScore && (
                  <div style={{
                    padding: "14px 18px", borderRadius: "var(--r-md)",
                    background: quizScore.correct === quizScore.total ? "var(--green-dim)" : "var(--gold-dim)",
                    border: `1px solid ${quizScore.correct === quizScore.total ? "var(--green-ring)" : "rgba(245,158,11,0.3)"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: 13.5, fontWeight: 600,
                    color: quizScore.correct === quizScore.total ? "var(--green)" : "var(--gold-2)",
                  }}>
                    <span>Last score: {quizScore.correct}/{quizScore.total}</span>
                    <span>{quizScore.correct === quizScore.total ? "Perfect! +25 XP" : "Retry to improve"}</span>
                  </div>
                )}

                {/* Questions */}
                {lesson.quiz.map((q, qi) => (
                  <div key={qi} className="card" style={{
                    padding: "22px 22px",
                    borderLeft: `3px solid ${mod.color}60`,
                  }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginBottom: 16, lineHeight: 1.5 }}>
                      <span style={{ color: "var(--text-3)", fontWeight: 400, marginRight: 6 }}>{qi + 1}.</span>
                      {q.q}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {q.options.map((opt, oi) => {
                        const selected   = answers[qi] === opt;
                        const isCorrect  = opt === q.a;
                        let bg = "var(--card-2)";
                        let border = "var(--border-2)";
                        let color = "var(--text-2)";
                        if (submitted) {
                          if (isCorrect)       { bg = "var(--green-dim)";  border = "var(--green-ring)";          color = "var(--green)"; }
                          else if (selected)   { bg = "var(--red-dim)";    border = "rgba(248,113,113,0.35)";     color = "var(--red)"; }
                          else                 { color = "var(--text-3)"; }
                        } else if (selected)   { bg = "var(--blue-dim)";   border = "var(--blue-ring)";           color = "var(--blue-2)"; }

                        return (
                          <button key={opt} disabled={submitted}
                            onClick={() => !submitted && setAnswers(p => ({ ...p, [qi]: opt }))}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "11px 14px", borderRadius: "var(--r-md)",
                              background: bg, border: `1px solid ${border}`, color,
                              fontSize: 13.5, fontWeight: 500,
                              textAlign: "left", cursor: submitted ? "default" : "pointer",
                              transition: "background 0.12s, border-color 0.12s, color 0.12s",
                            }}>
                            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {submitted && isCorrect && <CheckCircle2 size={13} style={{ flexShrink: 0 }} />}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Submit / result / retry */}
                {submitted ? (
                  <div>
                    <div className="card" style={{
                      padding: "20px", textAlign: "center", marginBottom: 12,
                      borderColor: correct === lesson.quiz.length ? "var(--green-ring)" : "rgba(245,158,11,0.3)",
                      background: correct === lesson.quiz.length ? "var(--green-dim)" : "var(--gold-dim)",
                    }}>
                      <div style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                        color: correct === lesson.quiz.length ? "var(--green)" : "var(--gold-2)", marginBottom: 4 }}>
                        {correct}/{lesson.quiz.length}
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--text-2)" }}>
                        {correct === lesson.quiz.length ? "Perfect score! +25 XP earned." : `${lesson.quiz.length - correct} incorrect — review highlighted answers above.`}
                      </div>
                    </div>
                    <button onClick={() => { setAnswers({}); setSubmitted(false); }}
                      className="btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
                      Retry Quiz
                    </button>
                  </div>
                ) : (
                  <button onClick={submit} disabled={!allDone}
                    className="btn-primary" style={{
                      width: "100%", justifyContent: "center", padding: "14px",
                      fontSize: 14.5,
                      background: allDone ? mod.color : "var(--card-2)",
                      color: allDone ? "#fff" : "var(--text-3)",
                      boxShadow: allDone ? `0 4px 14px ${mod.color}35` : "none",
                      cursor: allDone ? "pointer" : "not-allowed",
                    }}>
                    {allDone ? "Submit Quiz" : `Answer all ${lesson.quiz.length} questions to submit`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Challenge ── */}
        {tab === "challenge" && (
          <div className="fadein">
            <div className="card-2" style={{ padding: "24px 24px", marginBottom: 16, borderLeft: `3px solid ${mod.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Lightbulb size={14} style={{ color: mod.color }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: mod.color }}>
                  Apply Your Knowledge
                </span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>{lesson.challenge}</p>
            </div>
            <div style={{
              padding: "14px 18px", borderRadius: "var(--r-md)",
              background: "var(--card)", border: "1px solid var(--border)",
              fontSize: 13.5, color: "var(--text-3)", lineHeight: 1.6,
            }}>
              <strong style={{ color: "var(--text-2)" }}>Tip:</strong> Write your answer in Notes on the Lesson tab. Challenges are for reflection — no submission needed.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
