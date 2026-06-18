"use client";

import { useEffect, useRef, useState } from "react";
import * as lib from "@/lib/coop-lib";

/* ──────────────────────────────────────────────────────────────────────
   Ported from the "COOP Prep" Claude Design component (COOP Prep.dc.html).
   Single client component holding all state, mirroring the design's DCLogic
   class. Pure logic + data come from lib/* (unchanged).
   ────────────────────────────────────────────────────────────────────── */

const ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  cards: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  chevR: '<path d="m9 18 6-6-6-6"/>',
  chevL: '<path d="m15 18-6-6 6-6"/>',
  arrowL: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  lightbulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  circleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  square: '<rect width="18" height="18" x="3" y="3" rx="2"/>',
  trending: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  highlighter: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  note: '<path d="M15 3v4a2 2 0 0 0 2 2h4"/><path d="M5 3h10l6 6v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>',
};

// Split `text` into nodes, wrapping any saved highlight snippet in <mark>.
function HighlightedText({ text, snippets, color }) {
  if (!snippets || !snippets.length) return text;
  const present = snippets.filter((s) => s && text.includes(s)).sort((a, b) => b.length - a.length);
  if (!present.length) return text;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${present.map(esc).join("|")})`, "g");
  const parts = text.split(re);
  return parts.map((part, i) =>
    present.includes(part) ? (
      <mark key={i} style={{ background: hexA(color, 0.28), color: "var(--text-1)", borderRadius: 3, padding: "0 2px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>{part}</mark>
    ) : (
      part
    )
  );
}

function Icon({ name, size = 16, color = "currentColor", fill = "none", style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || "" }}
    />
  );
}

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export default function Dashboard() {
  const [progress, setProgress] = useState(null);
  const [days, setDays] = useState(0);
  const [theme, setTheme] = useState("daylight");

  const [view, setView] = useState("home");
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);

  const [rewards, setRewards] = useState([]);

  const [lessonTab, setLessonTab] = useState("read");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const [query, setQuery] = useState("");
  const [selText, setSelText] = useState("");

  const [flashIdx, setFlashIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [flashMode, setFlashMode] = useState("all");

  const [focusRunning, setFocusRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);

  const focusInt = useRef(null);
  const timers = useRef([]);

  /* ── mount ── */
  useEffect(() => {
    let t = "daylight";
    try { t = localStorage.getItem("coop_theme") || "daylight"; } catch {}
    document.documentElement.setAttribute("data-theme", t);
    setTheme(t);
    setProgress(lib.loadProgress());
    setDays(lib.daysUntilFellowship());
    return () => {
      if (focusInt.current) clearInterval(focusInt.current);
      timers.current.forEach(clearTimeout);
    };
  }, []);

  /* ── actions ── */
  function applyResult(res) {
    if (!res.final) return;
    lib.saveProgress(res.final);
    setProgress(res.final);
    if (res.queued.length) enqueue(res.queued);
  }
  function enqueue(queued) {
    setRewards((prev) => [...prev, ...queued]);
    queued.forEach((r) => {
      const ttl = r.type === "xp" ? 1400 : 3200;
      const t = setTimeout(
        () => setRewards((prev) => prev.filter((x) => x.id !== r.id)),
        ttl
      );
      timers.current.push(t);
    });
  }
  const completeLesson = (id) => applyResult(lib.doCompleteLesson(progress, id));
  const recordQuiz = (id, c, t) => applyResult(lib.doRecordQuiz(progress, id, c, t));
  const masterCard = (idx) => applyResult(lib.doMasterCard(progress, idx));
  const addFocus = (min) => applyResult(lib.doAddFocusMinutes(progress, min));

  /* ── study tools (persist immediately; no rewards) ── */
  function persist(next) { lib.saveProgress(next); setProgress(next); }
  const toggleBookmark = (id) => persist(lib.toggleBookmark(progress, id));
  function saveHighlight() {
    const t = selText.trim();
    if (!t || !activeLessonId) return;
    persist(lib.addHighlight(progress, activeLessonId, t));
    setSelText("");
    try { window.getSelection()?.removeAllRanges(); } catch {}
  }
  const removeHighlight = (id, text) => persist(lib.removeHighlight(progress, id, text));

  /* ── navigation ── */
  function go(v, moduleId) {
    setView(v);
    if (moduleId !== undefined) setActiveModuleId(moduleId);
  }
  function openModule(id) { setView("module"); setActiveModuleId(id); }
  function openLesson(modId, lessonId) {
    setView("lesson");
    setActiveModuleId(modId);
    setActiveLessonId(lessonId);
    setLessonTab("read");
    setAnswers({});
    setSubmitted(false);
    setSelText("");
    setNoteDraft(progress?.notes?.[lessonId] || "");
  }
  function openCard(index) {
    setFlashMode("all");
    setFlashIdx(index);
    setFlipped(false);
    setView("flash");
  }
  function toggleTheme() {
    const next = theme === "daylight" ? "midnight" : "daylight";
    try { localStorage.setItem("coop_theme", next); } catch {}
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  /* ── focus timer ── */
  function toggleFocus() {
    if (focusRunning) {
      clearInterval(focusInt.current);
      const mins = Math.floor(focusSeconds / 60);
      if (mins > 0) addFocus(mins);
      setFocusRunning(false);
      setFocusSeconds(0);
    } else {
      setFocusRunning(true);
      focusInt.current = setInterval(() => setFocusSeconds((s) => s + 1), 1000);
    }
  }

  /* ── lesson handlers ── */
  const pickAnswer = (qi, opt) => { if (!submitted) setAnswers((a) => ({ ...a, [qi]: opt })); };
  function submitQuiz(lesson) {
    const c = lesson.quiz.filter((q, i) => answers[i] === q.a).length;
    setSubmitted(true);
    recordQuiz(lesson.id, c, lesson.quiz.length);
  }
  function retryQuiz() { setAnswers({}); setSubmitted(false); }
  function onNote(e) {
    const v = e.target.value;
    const next = { ...progress, notes: { ...progress.notes, [activeLessonId]: v } };
    lib.saveProgress(next);
    setNoteDraft(v);
    setProgress(next);
  }

  /* ── flashcards ── */
  function flashDeck() {
    const cards = lib.FLASHCARDS;
    const known = progress?.flashDone || {};
    return flashMode === "unseen" ? cards.filter((_, i) => !known[i]) : cards;
  }
  const flip = () => setFlipped((f) => !f);
  function navCard(dir) {
    const len = Math.max(flashDeck().length, 1);
    setFlipped(false);
    const t = setTimeout(() => setFlashIdx((i) => (i + dir + len) % len), 60);
    timers.current.push(t);
  }
  function chooseFlashMode(m) { setFlashMode(m); setFlashIdx(0); setFlipped(false); }
  function markKnown() {
    const deck = flashDeck();
    const len = deck.length;
    const pos = flashIdx % Math.max(len, 1);
    const card = deck[pos];
    const gi = lib.FLASHCARDS.indexOf(card);
    masterCard(gi);
    setFlipped(false);
    setFlashIdx(pos >= len - 1 ? 0 : pos + 1);
  }

  /* ── loading ── */
  if (!progress) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--canvas)", color: "var(--text-1)", position: "relative", overflowX: "hidden" }}>
        <div style={{ position: "fixed", inset: 0, background: "var(--bg-gradient)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  /* ════════ derived ════════ */
  const { MODULES, FLASHCARDS } = lib;
  const allLessons = MODULES.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => progress.completed[l.id]).length;
  const readiness = lib.readinessScore(progress, MODULES);

  const bookmarkCount = Object.keys(progress.bookmarks || {}).length;
  const highlightCount = Object.values(progress.highlights || {}).reduce((n, arr) => n + arr.length, 0);
  const savedCount = bookmarkCount + highlightCount;

  // sidebar countdown urgency
  let cdBg, cdBorder, cdColor;
  if (days < 20) { cdBg = "var(--red-dim)"; cdBorder = "var(--red-ring)"; cdColor = "var(--red-2)"; }
  else if (days < 45) { cdBg = "var(--gold-dim)"; cdBorder = "var(--gold-ring)"; cdColor = "var(--gold-2)"; }
  else { cdBg = "var(--primary-dim)"; cdBorder = "var(--primary-ring)"; cdColor = "var(--primary-2)"; }

  const xpFloats = rewards.filter((r) => r.type === "xp");
  const toasts = rewards.filter((r) => r.type !== "xp");

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)", color: "var(--text-1)", fontFamily: "var(--font-body)", position: "relative", overflowX: "hidden" }}>
      {/* backdrop blooms */}
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-gradient)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", minHeight: "100vh" }}>

        {/* ══════════ SIDEBAR ══════════ */}
        <aside style={{ width: "var(--sidebar-w)", flexShrink: 0, position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30, padding: 14 }}>
          <div className="glass-strong" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 18px 16px" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)" }}>COOP Prep</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>Financial Services Track</div>
              </div>
              <button onClick={toggleTheme} title="Switch theme" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 999, border: "1px solid var(--glass-border)", background: "var(--glass-fill)", color: "var(--text-2)", cursor: "pointer" }}>
                <Icon name={theme === "daylight" ? "moon" : "sun"} size={15} />
              </button>
            </div>

            <div style={{ height: 1, background: "var(--glass-border)", margin: "0 16px 12px" }} />

            <nav style={{ padding: "0 10px", flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              <button className={view === "home" ? "nav-item active" : "nav-item"} onClick={() => go("home")}>
                <Icon name="dashboard" size={15} /><span>Dashboard</span>
              </button>

              <div style={{ margin: "16px 0 6px", padding: "0 10px" }}><span className="section-label">Curriculum</span></div>
              {MODULES.map((mod) => {
                const total = mod.lessons.length;
                const done = mod.lessons.filter((l) => progress.completed[l.id]).length;
                const active = (view === "module" || view === "lesson") && activeModuleId === mod.id;
                return (
                  <button key={mod.id} className={active ? "nav-item active" : "nav-item"} onClick={() => openModule(mod.id)} style={{ paddingLeft: 11 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: active ? "var(--primary)" : mod.color, opacity: active ? 1 : 0.75 }} />
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.title}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{done}/{total}</span>
                  </button>
                );
              })}

              <div style={{ margin: "16px 0 6px", padding: "0 10px" }}><span className="section-label">Practice</span></div>
              <button className={view === "flash" ? "nav-item active" : "nav-item"} onClick={() => go("flash")}>
                <Icon name="cards" size={15} /><span style={{ flex: 1 }}>Flashcards</span>
                <span className="badge badge-muted" style={{ fontSize: 10 }}>{FLASHCARDS.length}</span>
              </button>

              <div style={{ margin: "16px 0 6px", padding: "0 10px" }}><span className="section-label">Study</span></div>
              <button className={view === "search" ? "nav-item active" : "nav-item"} onClick={() => go("search")}>
                <Icon name="search" size={15} /><span>Search</span>
              </button>
              <button className={view === "saved" ? "nav-item active" : "nav-item"} onClick={() => go("saved")}>
                <Icon name="bookmark" size={15} /><span style={{ flex: 1 }}>Saved</span>
                {savedCount > 0 && <span className="badge badge-muted" style={{ fontSize: 10 }}>{savedCount}</span>}
              </button>
            </nav>

            {/* footer */}
            <div style={{ padding: "14px 16px 16px", borderTop: "1px solid var(--glass-border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>Overall progress</span>
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--text-2)", fontWeight: 600 }}>{doneLessons}/{totalLessons}</span>
                </div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${(doneLessons / totalLessons) * 100}%`, background: "var(--cta-gradient)" }} /></div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: "var(--r-sm)", background: cdBg, border: `1px solid ${cdBorder}` }}>
                <Icon name="calendar" size={13} color={cdColor} />
                <span style={{ fontSize: 12, fontWeight: 600, color: cdColor }}>{days} days to Aug 12</span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "7px 9px", borderRadius: "var(--r-sm)", background: "var(--gold-dim)", border: "1px solid var(--gold-ring)" }}>
                  <Icon name="zap" size={12} color="var(--gold-2)" fill="var(--gold)" /><span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--gold-2)" }}>{progress.xp}</span><span style={{ fontSize: 10.5, color: "var(--text-3)" }}>XP</span>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "7px 9px", borderRadius: "var(--r-sm)", background: "var(--orange-dim)", border: "1px solid var(--orange-ring)" }}>
                  <Icon name="flame" size={12} color="var(--orange-2)" fill="var(--orange)" /><span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--orange-2)" }}>{progress.streak}</span><span style={{ fontSize: 10.5, color: "var(--text-3)" }}>day</span>
                </div>
              </div>

              <button className="nav-item" onClick={toggleFocus} style={{ justifyContent: "space-between", background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name={focusRunning ? "square" : "play"} size={13} color={focusRunning ? "var(--red)" : "var(--green-2)"} />Focus
                </span>
                <span className="mono" style={{ fontSize: 12, color: focusRunning ? "var(--text-1)" : "var(--text-3)" }}>{lib.formatDuration(focusSeconds)}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <main style={{ marginLeft: "var(--sidebar-w)", flex: 1, minHeight: "100vh" }}>
          {view === "home" && <HomeView {...{ MODULES, FLASHCARDS, progress, days, readiness, doneLessons, totalLessons, openModule, openLesson, go }} />}
          {view === "module" && <ModuleView {...{ MODULES, progress, activeModuleId, openLesson, go }} />}
          {view === "lesson" && (
            <LessonView
              {...{ MODULES, progress, activeModuleId, activeLessonId, lessonTab, setLessonTab,
                answers, submitted, noteDraft, pickAnswer, submitQuiz, retryQuiz, onNote, completeLesson, go,
                toggleBookmark, removeHighlight, setSelText }}
            />
          )}
          {view === "flash" && (
            <FlashView
              {...{ FLASHCARDS, progress, flashMode, flipped, flashIdx, flashDeck,
                chooseFlashMode, flip, navCard, markKnown, go }}
            />
          )}
          {view === "search" && (
            <SearchView {...{ MODULES, FLASHCARDS, progress, query, setQuery, openLesson, openCard }} />
          )}
          {view === "saved" && (
            <SavedView {...{ MODULES, progress, openLesson, toggleBookmark, removeHighlight }} />
          )}
        </main>
      </div>

      {/* ══════════ HIGHLIGHT SELECTION PILL ══════════ */}
      {view === "lesson" && lessonTab === "read" && selText && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 70 }}>
          <button className="glass-strong" onClick={saveHighlight} style={{ display: "flex", alignItems: "center", gap: 9, padding: "11px 20px", borderRadius: 999, cursor: "pointer", color: "var(--text-1)", fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: "0 10px 30px rgba(0,0,0,0.22)" }}>
            <Icon name="highlighter" size={15} color="var(--gold-2)" /> Highlight selection
          </button>
        </div>
      )}

      {/* ══════════ REWARD LAYER ══════════ */}
      <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 60, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {xpFloats.map((x) => (
          <div key={x.id} className="float-xp mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold-2)", textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>+{x.amount} XP</div>
        ))}
      </div>
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 60, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
        {toasts.map((t) => {
          const isLevel = t.type === "level";
          const ach = !isLevel ? lib.ACHIEVEMENTS.find((a) => a.id === t.achId) : null;
          return (
            <div key={t.id} className="glass-strong toast-in" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <span className="celebrate" style={{ display: "flex" }}>
                <Icon name={isLevel ? "trending" : "award"} size={20} color={isLevel ? "var(--primary-2)" : "var(--gold-2)"} />
              </span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-1)" }}>{isLevel ? `Level ${t.level}!` : (ach?.label || "Achievement")}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{isLevel ? "Keep the momentum going." : (ach?.desc || "")}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── HOME ─────────────────────────────────────────── */
function HomeView({ MODULES, FLASHCARDS, progress, days, readiness, doneLessons, totalLessons, openModule, openLesson, go }) {
  const quizPasses = Object.values(progress.quizScores).filter((s) => s.correct === s.total).length;

  const lvl = lib.levelFromXp(progress.xp);
  const daily = lib.dailyProgress(progress, lib.todayISO());
  const mult = lib.streakMultiplier(progress.streak);
  const dC = 176;

  const rC = 264;
  const ringStop1 = readiness < 40 ? "var(--red)" : readiness < 70 ? "var(--gold)" : "var(--green)";
  const ringStop2 = readiness > 60 ? "var(--primary)" : ringStop1;
  const ringCopy = readiness < 33 ? "Just starting — every lesson counts."
    : readiness < 66 ? "Good momentum. Keep pushing."
    : readiness < 90 ? "Strong. Finish the quizzes."
    : "You're ready. Practice your pitch.";

  const hour = new Date().getHours();
  const greeting = (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening") + " 👋";

  let next = null;
  for (const mod of MODULES) { for (const l of mod.lessons) { if (!progress.completed[l.id]) { next = { mod, l }; break; } } if (next) break; }

  const stats = [
    { icon: <Icon name="book" size={16} color="var(--primary-2)" />, value: doneLessons, sub: `/ ${totalLessons}`, label: "Lessons done" },
    { icon: <Icon name="target" size={16} color="var(--green-2)" />, value: quizPasses, sub: "passed", label: "Quiz passes" },
    { icon: <Icon name="zap" size={16} color="var(--gold-2)" fill="var(--gold)" />, value: progress.xp, sub: "XP", label: "Total earned" },
    { icon: <Icon name="flame" size={16} color="var(--orange-2)" fill="var(--orange)" />, value: progress.streak, sub: "days", label: "Study streak" },
  ];

  const modulesComplete = MODULES.filter((m) => m.lessons.every((l) => progress.completed[l.id])).length;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 940, margin: "0 auto" }}>

      {/* momentum strip */}
      <div className="glass fadein" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 24, alignItems: "center", padding: "20px 24px", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 9 }}>
            <span className="badge badge-primary">LVL {lvl.level}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{lvl.tierName}</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>{lvl.xpInLevel}/{lvl.xpForNext} XP</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${lvl.pct}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary))" }} /></div>
        </div>
        <div style={{ position: "relative", width: 64, height: 64 }} title="Daily goal">
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--glass-border-2)" strokeWidth="5" />
            <circle cx="32" cy="32" r="28" fill="none" stroke={daily.met ? "var(--green)" : "var(--primary)"} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(daily.pct / 100) * dC} ${dC}`} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{daily.pct}%</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
            <Icon name="flame" size={14} color="var(--orange-2)" fill="var(--orange)" /><span className="mono" style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>{progress.streak}</span>
          </div>
          <div className="badge badge-gold" style={{ marginTop: 6 }}>{mult.toFixed(1)}× XP</div>
        </div>
      </div>

      {/* greeting */}
      <div className="fadein" style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15, color: "var(--text-1)" }}>{greeting}</h1>
        <p style={{ marginTop: 8, fontSize: 15, color: "var(--text-2)", lineHeight: 1.5 }}>Track your progress toward the COOP Financial Services Fellowship — {days} days remaining.</p>
      </div>

      {/* hero */}
      <div className="fadein" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, marginBottom: 24 }}>
        {/* readiness ring */}
        <div className="glass" style={{ padding: "30px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ position: "relative", width: 120, height: 120, marginBottom: 18 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="rgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ringStop1} />
                  <stop offset="100%" stopColor={ringStop2} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="42" fill="none" stroke="var(--glass-border-2)" strokeWidth="8" />
              <circle cx="60" cy="60" r="42" fill="none" stroke="url(#rgrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(readiness / 100) * rC} ${rC}`} style={{ animation: "ringfill .9s cubic-bezier(.16,1,.3,1) both" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: 30, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{readiness}%</span>
              <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 4 }}>Ready</span>
            </div>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Fellowship Readiness</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{ringCopy}</div>
        </div>

        {/* continue / all complete */}
        {next ? (
          <button className="glass glass-btn" onClick={() => openLesson(next.mod.id, next.l.id)} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 28, textAlign: "left", borderColor: hexA(next.mod.color, 0.32), background: `linear-gradient(135deg, var(--glass-fill) 0%, ${hexA(next.mod.color, 0.10)} 100%)` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span className="badge" style={{ background: hexA(next.mod.color, 0.16), color: next.mod.color, border: `1px solid ${hexA(next.mod.color, 0.34)}` }}>Continue</span>
                <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{next.mod.title}</span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.01em", color: "var(--text-1)", marginBottom: 12 }}>{next.l.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-3)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="clock" size={12} color="var(--text-3)" />{next.l.minutes} min</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Icon name="help" size={12} color="var(--text-3)" />{(next.l.quiz || []).length} questions</span>
                <span style={{ color: "var(--gold-2)", fontWeight: 600 }}>+50 XP</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 24, fontSize: 13.5, fontWeight: 600, color: "var(--primary-2)" }}>Start lesson <Icon name="arrowR" size={15} color="var(--primary-2)" /></div>
          </button>
        ) : (
          <div className="glass" style={{ height: "100%", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>All {totalLessons} lessons complete</div>
            <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 }}>Review flashcards and practice your pitch. Fellowship is {days} days away.</div>
          </div>
        )}
      </div>

      {/* stats */}
      <div className="fadein" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 40 }}>
        {stats.map((s) => (
          <div key={s.label} className="glass" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 5 }}>
              <span style={{ display: "flex", alignItems: "center", marginRight: 2 }}>{s.icon}</span>
              <span className="mono" style={{ fontSize: 26, fontWeight: 800, color: "var(--text-1)" }}>{s.value}</span>
              <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{s.sub}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* modules */}
      <div className="fadein">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-1)" }}>Modules</h2>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{modulesComplete}/{MODULES.length} complete</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MODULES.map((mod) => {
            const total = mod.lessons.length;
            const done = mod.lessons.filter((l) => progress.completed[l.id]).length;
            const allDone = done === total;
            return (
              <button key={mod.id} className="glass glass-btn" onClick={() => openModule(mod.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", textAlign: "left", width: "100%" }}>
                <div style={{ width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: hexA(mod.color, 0.14), border: `1px solid ${hexA(mod.color, 0.28)}` }}>{mod.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)" }}>{mod.title}</span>
                    {allDone && <span className="badge badge-green">Done</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>{mod.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${(done / total) * 100}%`, background: allDone ? "var(--green)" : mod.color }} /></div>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>{done}/{total}</span>
                  </div>
                </div>
                <Icon name="chevR" size={16} color="var(--text-3)" />
              </button>
            );
          })}
        </div>
      </div>

      {/* flashcard CTA */}
      <div className="fadein" style={{ marginTop: 24 }}>
        <button className="glass glass-btn" onClick={() => go("flash")} style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", width: "100%", textAlign: "left" }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gold-dim)", border: "1px solid var(--gold-ring)" }}><Icon name="cards" size={19} color="var(--gold-2)" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>Flashcard Review</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{FLASHCARDS.length} terms · regulations, formulas, frameworks · spaced repetition</div>
          </div>
          <Icon name="chevR" size={16} color="var(--text-3)" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── MODULE ─────────────────────────────────────────── */
function ModuleView({ MODULES, progress, activeModuleId, openLesson, go }) {
  const mod = MODULES.find((m) => m.id === activeModuleId);
  if (!mod) return null;
  const total = mod.lessons.length;
  const done = mod.lessons.filter((l) => progress.completed[l.id]).length;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 740, margin: "0 auto" }}>
      <button className="btn-ghost fadein" onClick={() => go("home")} style={{ marginBottom: 24 }}><Icon name="arrowL" size={14} /> Back to dashboard</button>

      <div className="glass fadein" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: hexA(mod.color, 0.14), border: `1px solid ${hexA(mod.color, 0.28)}` }}>{mod.icon}</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.2, color: "var(--text-1)" }}>{mod.title}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 5, textTransform: "uppercase", letterSpacing: ".06em", color: mod.color }}>{mod.coopModule}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 18 }}>{mod.description}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${(done / total) * 100}%`, background: mod.color }} /></div>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>{done}/{total} lessons</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mod.lessons.map((lesson, idx) => {
          const isDone = !!progress.completed[lesson.id];
          const quiz = progress.quizScores[lesson.id];
          const locked = idx > 0 && !progress.completed[mod.lessons[idx - 1].id];
          let iconBg, iconBorder, iconColor, iconNode;
          if (isDone) { iconBg = "var(--green-dim)"; iconBorder = "var(--green-ring)"; iconColor = "var(--green-2)"; iconNode = <Icon name="circleCheck" size={16} color="var(--green-2)" />; }
          else if (locked) { iconBg = "var(--glass-fill)"; iconBorder = "var(--glass-border)"; iconColor = "var(--text-3)"; iconNode = <Icon name="lock" size={13} color="var(--text-3)" />; }
          else { iconBg = hexA(mod.color, 0.14); iconBorder = hexA(mod.color, 0.3); iconColor = mod.color; iconNode = idx + 1; }
          return (
            <button key={lesson.id} className="glass" onClick={() => { if (!locked) openLesson(mod.id, lesson.id); }} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", textAlign: "left", width: "100%", opacity: locked ? 0.45 : 1, cursor: locked ? "not-allowed" : "pointer", borderColor: isDone ? "var(--green-ring)" : "var(--glass-border)", background: isDone ? "var(--green-dim)" : "var(--glass-fill)", transition: "transform .15s ease, box-shadow .15s ease" }}>
              <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: iconBg, border: `1px solid ${iconBorder}`, color: iconColor }}>{iconNode}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>{lesson.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", display: "flex", gap: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="clock" size={11} color="var(--text-3)" />{lesson.minutes} min</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon name="help" size={11} color="var(--text-3)" />{(lesson.quiz || []).length} questions</span>
                </div>
              </div>
              {quiz && <span className={`badge ${quiz.correct === quiz.total ? "badge-green" : "badge-gold"}`}>{quiz.correct}/{quiz.total}</span>}
              {!locked && !isDone && <Icon name="chevR" size={15} color="var(--text-3)" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── LESSON ─────────────────────────────────────────── */
function LessonView({ MODULES, progress, activeModuleId, activeLessonId, lessonTab, setLessonTab, answers, submitted, noteDraft, pickAnswer, submitQuiz, retryQuiz, onNote, completeLesson, go, toggleBookmark, removeHighlight, setSelText }) {
  const mod = MODULES.find((m) => m.id === activeModuleId);
  const lesson = mod && mod.lessons.find((l) => l.id === activeLessonId);
  if (!lesson) return null;
  const done = !!progress.completed[lesson.id];
  const quizScore = progress.quizScores[lesson.id];
  const bookmarked = !!progress.bookmarks?.[lesson.id];
  const highlights = progress.highlights?.[lesson.id] || [];
  const captureSelection = () => {
    try { setSelText((window.getSelection()?.toString() || "").trim()); } catch {}
  };

  const tabDefs = [
    { id: "read", label: "Lesson", ic: "clock" },
    { id: "quiz", label: `Quiz (${(lesson.quiz || []).length})`, ic: "help" },
    { id: "challenge", label: "Challenge", ic: "lightbulb" },
  ];

  const correct = submitted ? lesson.quiz.filter((q, i) => answers[i] === q.a).length : 0;
  const allAnswered = (lesson.quiz || []).every((_, i) => answers[i] !== undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--glass-fill-strong)", WebkitBackdropFilter: "blur(20px) saturate(180%)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid var(--glass-border)", padding: "0 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0 12px" }}>
            <button className="btn-ghost" onClick={() => go("module")} style={{ flexShrink: 0 }}><Icon name="arrowL" size={14} /> Back</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: mod.color, marginBottom: 2 }}>{mod.title}</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.title}</div>
            </div>
            {done && <span className="badge badge-green" style={{ flexShrink: 0 }}><Icon name="check" size={10} color="var(--green-2)" />Done</span>}
            <button onClick={() => toggleBookmark(lesson.id)} title={bookmarked ? "Remove bookmark" : "Bookmark this lesson"} aria-label="Toggle bookmark" style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 999, cursor: "pointer", border: `1px solid ${bookmarked ? "var(--gold-ring)" : "var(--glass-border)"}`, background: bookmarked ? "var(--gold-dim)" : "var(--glass-fill)" }}>
              <Icon name="bookmark" size={15} color={bookmarked ? "var(--gold-2)" : "var(--text-3)"} fill={bookmarked ? "var(--gold-2)" : "none"} />
            </button>
          </div>
          <div style={{ display: "flex", borderTop: "1px solid var(--glass-border)" }}>
            {tabDefs.map((t) => {
              const active = lessonTab === t.id;
              return (
                <button key={t.id} onClick={() => setLessonTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", fontSize: 13, fontWeight: 500, color: active ? "var(--text-1)" : "var(--text-3)", background: "none", border: "none", cursor: "pointer", borderBottom: active ? `2px solid ${mod.color}` : "2px solid transparent", marginBottom: -1, fontFamily: "var(--font-body)" }}>
                  <span style={{ display: "flex" }}><Icon name={t.ic} size={13} color={active ? mod.color : "var(--text-3)"} /></span>{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "36px 32px", maxWidth: 720, margin: "0 auto", width: "100%" }}>

        {lessonTab === "read" && (
          <div className="fadein">
            <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
              <span className="badge badge-muted"><Icon name="clock" size={11} color="var(--text-3)" /> {lesson.minutes} min read</span>
              {done && <span className="badge badge-green"><Icon name="check" size={10} color="var(--green-2)" /> Completed</span>}
            </div>
            <div onMouseUp={captureSelection} onTouchEnd={captureSelection} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {lesson.body.map((text, i) => (
                <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-2)" }}>
                  <HighlightedText text={text} snippets={highlights} color={mod.color} />
                </p>
              ))}
            </div>

            {highlights.length > 0 && (
              <div style={{ marginTop: 32, paddingTop: 22, borderTop: "1px solid var(--glass-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Icon name="highlighter" size={14} color="var(--gold-2)" />
                  <span className="section-label">Highlights ({highlights.length})</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {highlights.map((h) => (
                    <div key={h} className="glass" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 14px", borderLeft: `3px solid ${mod.color}` }}>
                      <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.5 }}>{h}</span>
                      <button onClick={() => removeHighlight(lesson.id, h)} title="Remove highlight" aria-label="Remove highlight" style={{ flexShrink: 0, display: "flex", padding: 4, borderRadius: 6, border: "none", background: "none", cursor: "pointer", color: "var(--text-3)" }}>
                        <Icon name="x" size={14} color="var(--text-3)" />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>Select any text above and tap “Highlight selection” to save it here.</div>
              </div>
            )}
            <div style={{ marginTop: 40, paddingTop: 26, borderTop: "1px solid var(--glass-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 16, borderRadius: 2, background: mod.color }} />
                <span className="section-label">Your Notes</span>
              </div>
              <textarea rows={4} value={noteDraft} onChange={onNote} placeholder="Write anything here — only you can see this." style={{ width: "100%", padding: "14px 16px", borderRadius: "var(--r-md)", background: "var(--glass-fill)", border: "1px solid var(--glass-border-2)", color: "var(--text-1)", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ marginTop: 20 }}>
              {!done ? (
                <button onClick={() => completeLesson(lesson.id)} style={{ width: "100%", padding: 14, borderRadius: "var(--r-md)", fontSize: 14.5, fontWeight: 600, fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", cursor: "pointer", color: "#fff", background: `linear-gradient(135deg, ${mod.color}, ${hexA(mod.color, 0.78)})`, boxShadow: `0 6px 18px ${hexA(mod.color, 0.4)}` }}>
                  <Icon name="circleCheck" size={16} color="#fff" /> Mark Lesson Complete · +50 XP
                </button>
              ) : (
                <div style={{ padding: 14, textAlign: "center", borderRadius: "var(--r-md)", background: "var(--green-dim)", color: "var(--green-2)", border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600 }}>✓ Lesson complete — try the Quiz and Challenge next</div>
              )}
            </div>
          </div>
        )}

        {lessonTab === "quiz" && (
          <div className="fadein" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {quizScore && (() => {
              const perfect = quizScore.correct === quizScore.total;
              return (
                <div style={{ padding: "14px 18px", borderRadius: "var(--r-md)", background: perfect ? "var(--green-dim)" : "var(--gold-dim)", border: `1px solid ${perfect ? "var(--green-ring)" : "var(--gold-ring)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, fontWeight: 600, color: perfect ? "var(--green-2)" : "var(--gold-2)" }}>
                  <span>Last score: {quizScore.correct}/{quizScore.total}</span>
                  <span>{perfect ? "Perfect! +25 XP" : "Retry to improve"}</span>
                </div>
              );
            })()}
            {(lesson.quiz || []).map((q, qi) => (
              <div key={qi} className="glass" style={{ padding: 22, borderLeft: `3px solid ${hexA(mod.color, 0.5)}` }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 16, lineHeight: 1.5 }}><span style={{ color: "var(--text-3)", fontWeight: 400, marginRight: 6 }}>{qi + 1}.</span>{q.q}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === opt;
                    const isCorrect = opt === q.a;
                    let bg = "var(--glass-fill)", border = "var(--glass-border)", color = "var(--text-2)";
                    if (submitted) {
                      if (isCorrect) { bg = "var(--green-dim)"; border = "var(--green-ring)"; color = "var(--green-2)"; }
                      else if (selected) { bg = "var(--red-dim)"; border = "var(--red-ring)"; color = "var(--red-2)"; }
                      else { color = "var(--text-3)"; }
                    } else if (selected) { bg = "var(--primary-dim)"; border = "var(--primary-ring)"; color = "var(--primary-2)"; }
                    return (
                      <button key={oi} onClick={() => pickAnswer(qi, opt)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: "var(--r-md)", background: bg, border: `1px solid ${border}`, color, fontSize: 13.5, fontWeight: 500, textAlign: "left", cursor: submitted ? "default" : "pointer", transition: "background .12s, border-color .12s, color .12s", fontFamily: "var(--font-body)" }}>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, flexShrink: 0 }}>{String.fromCharCode(65 + oi)}.</span>
                        {submitted && isCorrect && <Icon name="circleCheck" size={13} color="var(--green-2)" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {submitted ? (
              <div>
                <div className="glass" style={{ padding: 20, textAlign: "center", marginBottom: 12, borderColor: correct === lesson.quiz.length ? "var(--green-ring)" : "var(--gold-ring)", background: correct === lesson.quiz.length ? "var(--green-dim)" : "var(--gold-dim)" }}>
                  <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: correct === lesson.quiz.length ? "var(--green-2)" : "var(--gold-2)", marginBottom: 4 }}>{correct}/{lesson.quiz.length}</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-2)" }}>{correct === lesson.quiz.length ? "Perfect score! +25 XP earned." : `${lesson.quiz.length - correct} incorrect — review highlighted answers above.`}</div>
                </div>
                <button className="btn-ghost" style={{ width: "100%" }} onClick={retryQuiz}>Retry Quiz</button>
              </div>
            ) : (
              <button disabled={!allAnswered} onClick={() => submitQuiz(lesson)} style={{ width: "100%", padding: 14, borderRadius: "var(--r-md)", fontSize: 14.5, fontWeight: 600, fontFamily: "var(--font-body)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", background: allAnswered ? "var(--cta-gradient)" : "var(--glass-fill)", color: allAnswered ? "#fff" : "var(--text-3)", boxShadow: allAnswered ? "0 6px 18px var(--primary-ring)" : "none", cursor: allAnswered ? "pointer" : "not-allowed" }}>
                {allAnswered ? "Submit Quiz" : `Answer all ${lesson.quiz.length} questions to submit`}
              </button>
            )}
          </div>
        )}

        {lessonTab === "challenge" && (
          <div className="fadein">
            <div className="glass-strong" style={{ padding: 24, marginBottom: 16, borderLeft: `3px solid ${mod.color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="lightbulb" size={14} color={mod.color} /><span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: mod.color }}>Apply Your Knowledge</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-2)" }}>{lesson.challenge}</p>
            </div>
            <div style={{ padding: "14px 18px", borderRadius: "var(--r-md)", background: "var(--glass-fill)", border: "1px solid var(--glass-border)", fontSize: 13.5, color: "var(--text-3)", lineHeight: 1.6 }}><strong style={{ color: "var(--text-2)" }}>Tip:</strong> Write your answer in Notes on the Lesson tab. Challenges are for reflection — no submission needed.</div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── FLASHCARDS ─────────────────────────────────────────── */
function FlashView({ FLASHCARDS, progress, flashMode, flipped, flashIdx, flashDeck, chooseFlashMode, flip, navCard, markKnown, go }) {
  const cards = FLASHCARDS;
  const known = progress.flashDone || {};
  const mastered = Object.keys(known).filter((k) => known[k]).length;
  const deck = flashDeck();

  if (!deck.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div className="scalein" style={{ textAlign: "center", maxWidth: 380 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text-1)", marginBottom: 8 }}>All {cards.length} cards mastered!</div>
          <div style={{ fontSize: 14.5, color: "var(--text-2)", marginBottom: 28, lineHeight: 1.6 }}>Switch to All Cards to review again, or head back to continue your lessons.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => chooseFlashMode("all")}><Icon name="rotate" size={14} color="#fff" /> Review All Cards</button>
            <button className="btn-ghost" onClick={() => go("home")}><Icon name="arrowL" size={14} /> Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const len = deck.length;
  const pos = flashIdx % Math.max(len, 1);
  const card = deck[pos];
  const dotCount = Math.min(len, 20);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 48px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="fadein" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <button className="btn-ghost" onClick={() => go("home")}><Icon name="arrowL" size={14} /> Dashboard</button>
          <div className="glass" style={{ display: "flex", gap: 4, padding: 4, borderRadius: "var(--r-md)" }}>
            {[["all", `All (${cards.length})`], ["unseen", `Unseen (${cards.length - mastered})`]].map(([m, label]) => (
              <button key={m} onClick={() => chooseFlashMode(m)} style={{ padding: "6px 14px", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600, background: flashMode === m ? "var(--glass-fill-strong)" : "transparent", color: flashMode === m ? "var(--text-1)" : "var(--text-3)", border: flashMode === m ? "1px solid var(--glass-border-2)" : "1px solid transparent", cursor: "pointer", fontFamily: "var(--font-body)" }}>{label}</button>
            ))}
          </div>
        </div>

        <div className="fadein" style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="mono" style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>{pos + 1} of {len} · {mastered} mastered</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            {Array.from({ length: dotCount }, (_, i) => (
              <div key={i} style={{ height: 3, width: i === pos ? 20 : 6, borderRadius: 2, background: i < pos ? "var(--glass-border-2)" : i === pos ? "var(--primary)" : "var(--glass-border)", transition: "all .2s ease" }} />
            ))}
          </div>
        </div>

        <div className="fadein" onClick={flip} style={{ perspective: 1200, cursor: "pointer", userSelect: "none", marginBottom: 24 }}>
          <div style={{ position: "relative", transformStyle: "preserve-3d", transition: "transform .55s cubic-bezier(.16,1,.3,1)", height: 300, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
            <div className="glass-strong" style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 48px", textAlign: "center" }}>
              <span className="badge badge-primary" style={{ marginBottom: 20 }}>TERM</span>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>{card.term}</div>
              <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}><Icon name="rotate" size={11} color="var(--text-3)" /> Click to flip</div>
            </div>
            <div className="glass-strong" style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "var(--r-xl)", borderColor: "var(--gold-ring)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 48px", textAlign: "center" }}>
              <span className="badge badge-gold" style={{ marginBottom: 20 }}>DEFINITION</span>
              <div style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75 }}>{card.def}</div>
            </div>
          </div>
        </div>

        <div className="fadein" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button className="btn-ghost" onClick={() => navCard(-1)}><Icon name="chevL" size={15} /> Prev</button>
          {flipped ? (
            <button onClick={markKnown} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 28px", borderRadius: "var(--r-md)", background: "var(--green-dim)", color: "var(--green-2)", border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}><Icon name="check" size={14} color="var(--green-2)" /> Got it</button>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>Flip to mark known</div>
          )}
          <button className="btn-ghost" onClick={() => navCard(1)}>Next <Icon name="chevR" size={15} /></button>
        </div>

        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>Mastery</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{mastered}/{cards.length}</span>
          </div>
          <div className="progress-track" style={{ height: 6 }}><div className="progress-fill" style={{ width: `${(mastered / cards.length) * 100}%`, background: "linear-gradient(90deg, var(--green) 0%, var(--primary) 100%)" }} /></div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── SEARCH ─────────────────────────────────────────── */
function SearchView({ MODULES, FLASHCARDS, progress, query, setQuery, openLesson, openCard }) {
  const results = lib.searchCurriculum(MODULES, FLASHCARDS, query);
  const lessons = results.filter((r) => r.type === "lesson");
  const cards = results.filter((r) => r.type === "flashcard");
  const trimmed = query.trim();

  return (
    <div style={{ padding: "40px 48px", maxWidth: 740, margin: "0 auto" }}>
      <h1 className="fadein" style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)", marginBottom: 18 }}>Search</h1>

      <div className="glass fadein" style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 16px", marginBottom: 24 }}>
        <Icon name="search" size={18} color="var(--text-3)" />
        <input
          autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons, challenges, and flashcards…"
          style={{ flex: 1, padding: "14px 0", background: "none", border: "none", outline: "none", color: "var(--text-1)", fontSize: 15, fontFamily: "var(--font-body)" }}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search" style={{ display: "flex", padding: 6, border: "none", background: "none", cursor: "pointer", color: "var(--text-3)" }}>
            <Icon name="x" size={16} color="var(--text-3)" />
          </button>
        )}
      </div>

      {trimmed.length < 2 ? (
        <div className="fadein" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-3)", fontSize: 14 }}>Type at least two characters to search across every module.</div>
      ) : results.length === 0 ? (
        <div className="fadein" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-3)", fontSize: 14 }}>No matches for “{trimmed}”. Try a regulation, formula, or keyword.</div>
      ) : (
        <div className="fadein" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>{results.length} result{results.length === 1 ? "" : "s"} for “{trimmed}”</div>

          {lessons.length > 0 && (
            <div>
              <div style={{ marginBottom: 10 }}><span className="section-label">Lessons ({lessons.length})</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lessons.map((r) => (
                  <button key={r.lessonId} className="glass glass-btn" onClick={() => openLesson(r.moduleId, r.lessonId)} style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 18px", borderLeft: `3px solid ${r.color}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: r.color }}>{r.moduleTitle}</span>
                    </div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>{r.snippet}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cards.length > 0 && (
            <div>
              <div style={{ marginBottom: 10 }}><span className="section-label">Flashcards ({cards.length})</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.map((r) => (
                  <button key={r.index} className="glass glass-btn" onClick={() => openCard(r.index)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "14px 18px" }}>
                    <Icon name="cards" size={17} color="var(--gold-2)" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>{r.term}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5 }}>{r.snippet}</div>
                    </div>
                    <Icon name="chevR" size={15} color="var(--text-3)" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── SAVED ─────────────────────────────────────────── */
function SavedView({ MODULES, progress, openLesson, toggleBookmark, removeHighlight }) {
  const lessonOf = (id) => {
    for (const mod of MODULES) {
      const l = mod.lessons.find((x) => x.id === id);
      if (l) return { mod, lesson: l };
    }
    return null;
  };

  const bookmarks = Object.keys(progress.bookmarks || {}).map(lessonOf).filter(Boolean);
  const highlightEntries = Object.entries(progress.highlights || {})
    .map(([id, snippets]) => ({ ref: lessonOf(id), snippets }))
    .filter((e) => e.ref && e.snippets.length);
  const noteEntries = Object.entries(progress.notes || {})
    .filter(([, v]) => v && v.trim())
    .map(([id, text]) => ({ ref: lessonOf(id), text }))
    .filter((e) => e.ref);

  const empty = !bookmarks.length && !highlightEntries.length && !noteEntries.length;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 740, margin: "0 auto" }}>
      <h1 className="fadein" style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)", marginBottom: 6 }}>Saved</h1>
      <p className="fadein" style={{ fontSize: 13.5, color: "var(--text-2)", marginBottom: 26 }}>Your bookmarks, highlights, and notes — all in one place.</p>

      {empty ? (
        <div className="glass fadein" style={{ textAlign: "center", padding: "44px 24px" }}>
          <Icon name="bookmark" size={26} color="var(--text-3)" style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>Nothing saved yet</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>Bookmark a lesson, highlight a sentence, or jot a note — they’ll collect here for quick review.</div>
        </div>
      ) : (
        <div className="fadein" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {bookmarks.length > 0 && (
            <div>
              <div style={{ marginBottom: 12 }}><span className="section-label">Bookmarked lessons ({bookmarks.length})</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bookmarks.map(({ mod, lesson }) => (
                  <div key={lesson.id} className="glass" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderLeft: `3px solid ${mod.color}` }}>
                    <button onClick={() => openLesson(mod.id, lesson.id)} className="glass-btn" style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: mod.color, marginBottom: 4 }}>{mod.title}</div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)" }}>{lesson.title}</div>
                    </button>
                    <button onClick={() => toggleBookmark(lesson.id)} title="Remove bookmark" aria-label="Remove bookmark" style={{ flexShrink: 0, display: "flex", padding: 7, borderRadius: 999, border: "1px solid var(--gold-ring)", background: "var(--gold-dim)", cursor: "pointer" }}>
                      <Icon name="bookmark" size={14} color="var(--gold-2)" fill="var(--gold-2)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {highlightEntries.length > 0 && (
            <div>
              <div style={{ marginBottom: 12 }}><span className="section-label">Highlights</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {highlightEntries.map(({ ref, snippets }) => (
                  <div key={ref.lesson.id}>
                    <button onClick={() => openLesson(ref.mod.id, ref.lesson.id)} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, background: "none", border: "none", cursor: "pointer", padding: 0, color: ref.mod.color, fontSize: 12.5, fontWeight: 600 }}>
                      {ref.lesson.title} <Icon name="chevR" size={13} color={ref.mod.color} />
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {snippets.map((h) => (
                        <div key={h} className="glass" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderLeft: `3px solid ${ref.mod.color}` }}>
                          <span style={{ flex: 1, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{h}</span>
                          <button onClick={() => removeHighlight(ref.lesson.id, h)} title="Remove highlight" aria-label="Remove highlight" style={{ flexShrink: 0, display: "flex", padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--text-3)" }}>
                            <Icon name="x" size={13} color="var(--text-3)" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {noteEntries.length > 0 && (
            <div>
              <div style={{ marginBottom: 12 }}><span className="section-label">Notes</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {noteEntries.map(({ ref, text }) => (
                  <button key={ref.lesson.id} className="glass glass-btn" onClick={() => openLesson(ref.mod.id, ref.lesson.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                      <Icon name="note" size={13} color="var(--text-3)" />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: ref.mod.color }}>{ref.lesson.title}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{text}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
