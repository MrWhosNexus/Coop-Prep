import { useEffect, useRef, useState } from "react";
import * as lib from "@/lib/coop-lib";
import {
  LayoutDashboard, BookOpen, CreditCard, Target, Zap, Flame,
  ChevronRight, ChevronLeft, Clock, HelpCircle, Lock, CheckCircle2,
  Check, ArrowLeft, ArrowRight, Lightbulb, RotateCcw, Play, Square,
  TrendingUp, Award, Sun, Moon, CalendarDays,
  Search, Bookmark, X, Highlighter, StickyNote,
} from "lucide-react";

/* Mobile port of the "COOP Prep" Claude Design UI — same light Liquid-Glass
   language as desktop, adapted to a single-column phone shell with a bottom
   tab bar. State + pure logic come from lib/* (shared with desktop). */

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// Wrap any saved highlight snippet in <mark> within `text`.
function HighlightedText({ text, snippets, color }) {
  if (!snippets || !snippets.length) return text;
  const present = snippets.filter((s) => s && text.includes(s)).sort((a, b) => b.length - a.length);
  if (!present.length) return text;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${present.map(esc).join("|")})`, "g"));
  return parts.map((part, i) =>
    present.includes(part)
      ? <mark key={i} style={{ background: hexA(color, 0.28), color: "var(--text-1)", borderRadius: 3, padding: "0 2px" }}>{part}</mark>
      : part
  );
}

export default function MobileApp() {
  const [progress, setProgress] = useState(null);
  const [days, setDays] = useState(0);
  const [theme, setTheme] = useState("daylight");

  const [view, setView] = useState("home");        // home | modules | lesson | flash
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

  /* actions */
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
      const t = setTimeout(() => setRewards((prev) => prev.filter((x) => x.id !== r.id)), ttl);
      timers.current.push(t);
    });
  }
  const completeLesson = (id) => applyResult(lib.doCompleteLesson(progress, id));
  const recordQuiz = (id, c, t) => applyResult(lib.doRecordQuiz(progress, id, c, t));
  const masterCard = (idx) => applyResult(lib.doMasterCard(progress, idx));
  const addFocus = (min) => applyResult(lib.doAddFocusMinutes(progress, min));

  /* study tools (persist immediately) */
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

  /* nav */
  function openModule(id) { setView("modules"); setActiveModuleId(id); }
  function openLesson(modId, lessonId) {
    setView("lesson"); setActiveModuleId(modId); setActiveLessonId(lessonId);
    setLessonTab("read"); setAnswers({}); setSubmitted(false); setSelText("");
    setNoteDraft(progress?.notes?.[lessonId] || "");
    window.scrollTo(0, 0);
  }
  function openCard(index) { setFlashMode("all"); setFlashIdx(index); setFlipped(false); setView("flash"); window.scrollTo(0, 0); }
  function goTab(id) { setView(id); setActiveModuleId(null); setActiveLessonId(null); window.scrollTo(0, 0); }
  function toggleTheme() {
    const next = theme === "daylight" ? "midnight" : "daylight";
    try { localStorage.setItem("coop_theme", next); } catch {}
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  }

  /* focus */
  function toggleFocus() {
    if (focusRunning) {
      clearInterval(focusInt.current);
      const mins = Math.floor(focusSeconds / 60);
      if (mins > 0) addFocus(mins);
      setFocusRunning(false); setFocusSeconds(0);
    } else {
      setFocusRunning(true);
      focusInt.current = setInterval(() => setFocusSeconds((s) => s + 1), 1000);
    }
  }

  /* lesson */
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
    lib.saveProgress(next); setNoteDraft(v); setProgress(next);
  }

  /* flashcards */
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
    masterCard(lib.FLASHCARDS.indexOf(card));
    setFlipped(false);
    setFlashIdx(pos >= len - 1 ? 0 : pos + 1);
  }

  if (!progress) {
    return (
      <>
        <div className="app-backdrop" />
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="spinner" />
        </div>
      </>
    );
  }

  const { MODULES, FLASHCARDS } = lib;
  const allLessons = MODULES.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const doneLessons = allLessons.filter((l) => progress.completed[l.id]).length;
  const readiness = lib.readinessScore(progress, MODULES);

  const tab = view === "lesson" ? "modules" : view;
  const xpFloats = rewards.filter((r) => r.type === "xp");
  const toasts = rewards.filter((r) => r.type !== "xp");

  const TABS = [
    { id: "home", label: "Home", Icon: LayoutDashboard },
    { id: "modules", label: "Modules", Icon: BookOpen },
    { id: "flash", label: "Cards", Icon: CreditCard },
    { id: "search", label: "Search", Icon: Search },
    { id: "saved", label: "Saved", Icon: Bookmark },
  ];

  return (
    <>
      <div className="app-backdrop" />

      <div className="mobile-topbar">
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)" }}>COOP Prep</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>Financial Services Track</div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title="Switch theme" aria-label="Switch theme">
          {theme === "daylight" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="mobile-main">
        {view === "home" && (
          <Home {...{ MODULES, FLASHCARDS, progress, days, readiness, doneLessons, totalLessons,
            openModule, openLesson, goTab, focusRunning, focusSeconds, toggleFocus }} />
        )}
        {view === "modules" && (
          <Modules {...{ MODULES, progress, activeModuleId, openModule, openLesson, setActiveModuleId }} />
        )}
        {view === "lesson" && (
          <Lesson {...{ MODULES, progress, activeModuleId, activeLessonId, lessonTab, setLessonTab,
            answers, submitted, noteDraft, pickAnswer, submitQuiz, retryQuiz, onNote, completeLesson, setView,
            toggleBookmark, removeHighlight, setSelText }} />
        )}
        {view === "flash" && (
          <Flash {...{ FLASHCARDS, progress, flashMode, flipped, flashIdx, flashDeck, chooseFlashMode, flip, navCard, markKnown, goTab }} />
        )}
        {view === "search" && (
          <SearchTab {...{ MODULES, FLASHCARDS, query, setQuery, openLesson, openCard }} />
        )}
        {view === "saved" && (
          <SavedTab {...{ MODULES, progress, openLesson, toggleBookmark, removeHighlight }} />
        )}
      </div>

      <nav className="tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => goTab(id)}>
            <Icon size={20} />{label}
          </button>
        ))}
      </nav>

      {/* highlight selection pill */}
      {view === "lesson" && lessonTab === "read" && selText && (
        <div style={{ position: "fixed", bottom: "calc(env(safe-area-inset-bottom) + 76px)", left: "50%", transform: "translateX(-50%)", zIndex: 70 }}>
          <button className="glass-strong" onClick={saveHighlight} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999, cursor: "pointer", color: "var(--text-1)", fontSize: 13.5, fontWeight: 600, fontFamily: "var(--font-body)", boxShadow: "0 10px 30px rgba(0,0,0,0.22)" }}>
            <Highlighter size={15} style={{ color: "var(--gold-2)" }} /> Highlight
          </button>
        </div>
      )}

      {/* reward layer */}
      <div style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 60, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {xpFloats.map((x) => (
          <div key={x.id} className="float-xp mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold-2)", textShadow: "0 2px 12px rgba(0,0,0,0.18)" }}>+{x.amount} XP</div>
        ))}
      </div>
      <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 70px)", left: 16, right: 16, zIndex: 60, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map((t) => {
          const isLevel = t.type === "level";
          const ach = !isLevel ? lib.ACHIEVEMENTS.find((a) => a.id === t.achId) : null;
          return (
            <div key={t.id} className="glass-strong toast-in" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <span className="celebrate" style={{ display: "flex", color: isLevel ? "var(--primary-2)" : "var(--gold-2)" }}>
                {isLevel ? <TrendingUp size={20} /> : <Award size={20} />}
              </span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-1)" }}>{isLevel ? `Level ${t.level}!` : (ach?.label || "Achievement")}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{isLevel ? "Keep the momentum going." : (ach?.desc || "")}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─────────── Momentum (compact) ─────────── */
function Momentum({ progress }) {
  const lvl = lib.levelFromXp(progress.xp);
  const daily = lib.dailyProgress(progress, lib.todayISO());
  const mult = lib.streakMultiplier(progress.streak);
  const dC = 138;
  return (
    <div className="glass" style={{ padding: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span className="badge badge-primary">LVL {lvl.level}</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>{lvl.tierName}</span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-3)", marginLeft: "auto" }}>{lvl.xpInLevel}/{lvl.xpForNext}</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${lvl.pct}%`, background: "linear-gradient(90deg, var(--primary), var(--secondary))" }} /></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--orange-2)" }}><Flame size={13} /><span className="mono" style={{ fontWeight: 800, color: "var(--text-1)" }}>{progress.streak}</span></span>
          <span className="badge badge-gold">{mult.toFixed(1)}× XP</span>
        </div>
      </div>
      <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }} title="Daily goal">
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="28" cy="28" r="22" fill="none" stroke="var(--glass-border-2)" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={daily.met ? "var(--green)" : "var(--primary)"} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(daily.pct / 100) * dC} ${dC}`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{daily.pct}%</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Home ─────────── */
function Home({ MODULES, FLASHCARDS, progress, days, readiness, doneLessons, totalLessons, openModule, openLesson, goTab, focusRunning, focusSeconds, toggleFocus }) {
  const quizPasses = Object.values(progress.quizScores).filter((s) => s.correct === s.total).length;
  const hour = new Date().getHours();
  const greeting = (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening") + " 👋";

  let next = null;
  for (const mod of MODULES) { for (const l of mod.lessons) { if (!progress.completed[l.id]) { next = { mod, l }; break; } } if (next) break; }

  const rC = 264;
  const ringStop1 = readiness < 40 ? "var(--red)" : readiness < 70 ? "var(--gold)" : "var(--green)";
  const ringStop2 = readiness > 60 ? "var(--primary)" : ringStop1;
  const ringCopy = readiness < 33 ? "Just starting — every lesson counts."
    : readiness < 66 ? "Good momentum. Keep pushing."
    : readiness < 90 ? "Strong. Finish the quizzes." : "You're ready. Practice your pitch.";

  let cdColor;
  if (days < 20) cdColor = "var(--red-2)"; else if (days < 45) cdColor = "var(--gold-2)"; else cdColor = "var(--primary-2)";

  const stats = [
    { icon: <BookOpen size={15} />, value: doneLessons, sub: `/ ${totalLessons}`, label: "Lessons", color: "var(--primary-2)" },
    { icon: <Target size={15} />, value: quizPasses, sub: "passed", label: "Quizzes", color: "var(--green-2)" },
    { icon: <Zap size={15} />, value: progress.xp, sub: "XP", label: "Earned", color: "var(--gold-2)" },
    { icon: <Flame size={15} />, value: progress.streak, sub: "days", label: "Streak", color: "var(--orange-2)" },
  ];

  return (
    <div className="fadein">
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.025em", lineHeight: 1.15 }}>{greeting}</h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
          <CalendarDays size={13} style={{ color: cdColor }} /><span style={{ color: cdColor, fontWeight: 600 }}>{days} days</span> to the fellowship
        </p>
      </div>

      <Momentum progress={progress} />

      {/* readiness ring */}
      <div className="glass" style={{ padding: 18, marginBottom: 14, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ position: "relative", width: 92, height: 92, flexShrink: 0 }}>
          <svg width="92" height="92" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="mrgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={ringStop1} /><stop offset="100%" stopColor={ringStop2} />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="42" fill="none" stroke="var(--glass-border-2)" strokeWidth="9" />
            <circle cx="60" cy="60" r="42" fill="none" stroke="url(#mrgrad)" strokeWidth="9" strokeLinecap="round" strokeDasharray={`${(readiness / 100) * rC} ${rC}`} style={{ animation: "ringfill .9s cubic-bezier(.16,1,.3,1) both" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", lineHeight: 1 }}>{readiness}%</span>
            <span style={{ fontSize: 8.5, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 2 }}>Ready</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>Fellowship Readiness</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{ringCopy}</div>
        </div>
      </div>

      {/* continue */}
      {next ? (
        <button onClick={() => openLesson(next.mod.id, next.l.id)} className="glass glass-btn"
          style={{ display: "block", width: "100%", textAlign: "left", padding: 18, marginBottom: 14,
            borderColor: hexA(next.mod.color, 0.32), background: `linear-gradient(135deg, var(--glass-fill) 0%, ${hexA(next.mod.color, 0.10)} 100%)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span className="badge" style={{ background: hexA(next.mod.color, 0.16), color: next.mod.color, border: `1px solid ${hexA(next.mod.color, 0.34)}` }}>Continue</span>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>{next.mod.title}</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.25, marginBottom: 8 }}>{next.l.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "var(--text-3)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{next.l.minutes} min</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><HelpCircle size={12} />{(next.l.quiz || []).length} q</span>
            <span style={{ color: "var(--gold-2)", fontWeight: 600 }}>+50 XP</span>
            <ChevronRight size={15} style={{ marginLeft: "auto", color: "var(--primary-2)" }} />
          </div>
        </button>
      ) : (
        <div className="glass" style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>All lessons complete 🎉</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Review flashcards and practice your pitch.</div>
        </div>
      )}

      {/* 2×2 stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {stats.map(({ icon, value, sub, label, color }) => (
          <div key={label} className="glass" style={{ padding: 14, textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ color, display: "flex", alignItems: "center" }}>{icon}</span>
              <span className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>{value}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* focus timer */}
      <button onClick={toggleFocus} className="glass glass-btn" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", marginBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>
          {focusRunning ? <Square size={14} style={{ color: "var(--red)" }} /> : <Play size={14} style={{ color: "var(--green-2)" }} />}
          Focus timer
        </span>
        <span className="mono" style={{ fontSize: 13, color: focusRunning ? "var(--text-1)" : "var(--text-3)" }}>{lib.formatDuration(focusSeconds)}</span>
      </button>

      <button onClick={() => goTab("modules")} className="btn-ghost" style={{ width: "100%" }}>
        Browse all modules <ChevronRight size={15} />
      </button>
    </div>
  );
}

/* ─────────── Modules ─────────── */
function Modules({ MODULES, progress, activeModuleId, openModule, openLesson, setActiveModuleId }) {
  const mod = activeModuleId ? MODULES.find((m) => m.id === activeModuleId) : null;

  if (!mod) {
    const modulesComplete = MODULES.filter((m) => m.lessons.every((l) => progress.completed[l.id])).length;
    return (
      <div className="fadein">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)" }}>Modules</h1>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{modulesComplete}/{MODULES.length} complete</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODULES.map((m) => {
            const total = m.lessons.length;
            const done = m.lessons.filter((l) => progress.completed[l.id]).length;
            const allDone = done === total;
            return (
              <button key={m.id} className="glass glass-btn" onClick={() => openModule(m.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, textAlign: "left", width: "100%" }}>
                <div style={{ width: 42, height: 42, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, background: hexA(m.color, 0.14), border: `1px solid ${hexA(m.color, 0.28)}` }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)" }}>{m.title}</span>
                    {allDone && <span className="badge badge-green">Done</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${(done / total) * 100}%`, background: allDone ? "var(--green)" : m.color }} /></div>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600 }}>{done}/{total}</span>
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

  const total = mod.lessons.length;
  const done = mod.lessons.filter((l) => progress.completed[l.id]).length;
  return (
    <div className="fadein">
      <button className="btn-ghost" onClick={() => setActiveModuleId(null)} style={{ marginBottom: 16 }}><ArrowLeft size={14} /> All modules</button>
      <div className="glass" style={{ padding: 18, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21, background: hexA(mod.color, 0.14), border: `1px solid ${hexA(mod.color, 0.28)}` }}>{mod.icon}</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, lineHeight: 1.2, color: "var(--text-1)" }}>{mod.title}</div>
            <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, textTransform: "uppercase", letterSpacing: ".06em", color: mod.color }}>{mod.coopModule}</div>
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 14 }}>{mod.description}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${(done / total) * 100}%`, background: mod.color }} /></div>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}>{done}/{total}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mod.lessons.map((lesson, idx) => {
          const isDone = !!progress.completed[lesson.id];
          const quiz = progress.quizScores[lesson.id];
          const locked = idx > 0 && !progress.completed[mod.lessons[idx - 1].id];
          let iconBg, iconBorder, iconColor, iconNode;
          if (isDone) { iconBg = "var(--green-dim)"; iconBorder = "var(--green-ring)"; iconColor = "var(--green-2)"; iconNode = <CheckCircle2 size={16} />; }
          else if (locked) { iconBg = "var(--glass-fill)"; iconBorder = "var(--glass-border)"; iconColor = "var(--text-3)"; iconNode = <Lock size={13} />; }
          else { iconBg = hexA(mod.color, 0.14); iconBorder = hexA(mod.color, 0.3); iconColor = mod.color; iconNode = idx + 1; }
          return (
            <button key={lesson.id} className="glass" onClick={() => { if (!locked) openLesson(mod.id, lesson.id); }} style={{ display: "flex", alignItems: "center", gap: 14, padding: 14, textAlign: "left", width: "100%", opacity: locked ? 0.45 : 1, cursor: locked ? "not-allowed" : "pointer", borderColor: isDone ? "var(--green-ring)" : "var(--glass-border)", background: isDone ? "var(--green-dim)" : "var(--glass-fill)" }}>
              <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: iconBg, border: `1px solid ${iconBorder}`, color: iconColor }}>{iconNode}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>{lesson.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", display: "flex", gap: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{lesson.minutes} min</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><HelpCircle size={11} />{(lesson.quiz || []).length} q</span>
                </div>
              </div>
              {quiz && <span className={`badge ${quiz.correct === quiz.total ? "badge-green" : "badge-gold"}`}>{quiz.correct}/{quiz.total}</span>}
              {!locked && !isDone && <ChevronRight size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────── Lesson ─────────── */
function Lesson({ MODULES, progress, activeModuleId, activeLessonId, lessonTab, setLessonTab, answers, submitted, noteDraft, pickAnswer, submitQuiz, retryQuiz, onNote, completeLesson, setView, toggleBookmark, removeHighlight, setSelText }) {
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
  const correct = submitted ? lesson.quiz.filter((q, i) => answers[i] === q.a).length : 0;
  const allAnswered = (lesson.quiz || []).every((_, i) => answers[i] !== undefined);

  const tabDefs = [
    { id: "read", label: "Lesson", Icon: Clock },
    { id: "quiz", label: `Quiz (${(lesson.quiz || []).length})`, Icon: HelpCircle },
    { id: "challenge", label: "Challenge", Icon: Lightbulb },
  ];

  return (
    <div className="fadein">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => setView("modules")} style={{ flexShrink: 0, padding: "9px 12px" }}><ArrowLeft size={14} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: mod.color }}>{mod.title}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.title}</div>
        </div>
        {done && <span className="badge badge-green" style={{ flexShrink: 0 }}><Check size={10} />Done</span>}
        <button onClick={() => toggleBookmark(lesson.id)} aria-label="Toggle bookmark" style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 999, cursor: "pointer", border: `1px solid ${bookmarked ? "var(--gold-ring)" : "var(--glass-border)"}`, background: bookmarked ? "var(--gold-dim)" : "var(--glass-fill)" }}>
          <Bookmark size={15} style={{ color: bookmarked ? "var(--gold-2)" : "var(--text-3)" }} fill={bookmarked ? "var(--gold-2)" : "none"} />
        </button>
      </div>

      <div className="glass" style={{ display: "flex", padding: 4, gap: 2, marginBottom: 16 }}>
        {tabDefs.map(({ id, label, Icon }) => {
          const active = lessonTab === id;
          return (
            <button key={id} onClick={() => setLessonTab(id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", fontSize: 12, fontWeight: 600, borderRadius: "var(--r-sm)", border: "none", cursor: "pointer", fontFamily: "var(--font-body)", color: active ? "var(--text-1)" : "var(--text-3)", background: active ? "var(--glass-fill-strong)" : "transparent" }}>
              <Icon size={13} style={{ color: active ? mod.color : "var(--text-3)" }} />{label}
            </button>
          );
        })}
      </div>

      {lessonTab === "read" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            <span className="badge badge-muted"><Clock size={11} /> {lesson.minutes} min read</span>
            {done && <span className="badge badge-green"><Check size={10} /> Completed</span>}
          </div>
          <div onMouseUp={captureSelection} onTouchEnd={captureSelection} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {lesson.body.map((text, i) => (
              <p key={i} style={{ fontSize: 14.5, lineHeight: 1.75, color: "var(--text-2)" }}>
                <HighlightedText text={text} snippets={highlights} color={mod.color} />
              </p>
            ))}
          </div>

          {highlights.length > 0 && (
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--glass-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Highlighter size={13} style={{ color: "var(--gold-2)" }} />
                <span className="section-label">Highlights ({highlights.length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {highlights.map((h) => (
                  <div key={h} className="glass" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 13px", borderLeft: `3px solid ${mod.color}` }}>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>{h}</span>
                    <button onClick={() => removeHighlight(lesson.id, h)} aria-label="Remove highlight" style={{ flexShrink: 0, display: "flex", padding: 4, borderRadius: 6, border: "none", background: "none", cursor: "pointer", color: "var(--text-3)" }}>
                      <X size={14} style={{ color: "var(--text-3)" }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 15, borderRadius: 2, background: mod.color }} />
              <span className="section-label">Your Notes</span>
            </div>
            <textarea rows={4} value={noteDraft} onChange={onNote} placeholder="Write anything here — only you can see this." style={{ width: "100%", padding: "13px 14px", borderRadius: "var(--r-md)", background: "var(--glass-fill)", border: "1px solid var(--glass-border-2)", color: "var(--text-1)", fontSize: 14, lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "var(--font-body)" }} />
          </div>
          <div style={{ marginTop: 18 }}>
            {!done ? (
              <button onClick={() => completeLesson(lesson.id)} style={{ width: "100%", padding: 14, borderRadius: "var(--r-md)", fontSize: 14.5, fontWeight: 600, fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, border: "none", cursor: "pointer", color: "#fff", background: `linear-gradient(135deg, ${mod.color}, ${hexA(mod.color, 0.78)})`, boxShadow: `0 6px 18px ${hexA(mod.color, 0.4)}` }}>
                <CheckCircle2 size={16} /> Mark Complete · +50 XP
              </button>
            ) : (
              <div style={{ padding: 14, textAlign: "center", borderRadius: "var(--r-md)", background: "var(--green-dim)", color: "var(--green-2)", border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600 }}>✓ Complete — try the Quiz and Challenge</div>
            )}
          </div>
        </div>
      )}

      {lessonTab === "quiz" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {quizScore && (() => {
            const perfect = quizScore.correct === quizScore.total;
            return (
              <div style={{ padding: "12px 16px", borderRadius: "var(--r-md)", background: perfect ? "var(--green-dim)" : "var(--gold-dim)", border: `1px solid ${perfect ? "var(--green-ring)" : "var(--gold-ring)"}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600, color: perfect ? "var(--green-2)" : "var(--gold-2)" }}>
                <span>Last: {quizScore.correct}/{quizScore.total}</span><span>{perfect ? "Perfect! +25 XP" : "Retry to improve"}</span>
              </div>
            );
          })()}
          {(lesson.quiz || []).map((q, qi) => (
            <div key={qi} className="glass" style={{ padding: 18, borderLeft: `3px solid ${hexA(mod.color, 0.5)}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 14, lineHeight: 1.5 }}><span style={{ color: "var(--text-3)", fontWeight: 400, marginRight: 6 }}>{qi + 1}.</span>{q.q}</div>
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
                    <button key={oi} onClick={() => pickAnswer(qi, opt)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: "var(--r-md)", background: bg, border: `1px solid ${border}`, color, fontSize: 13.5, fontWeight: 500, textAlign: "left", cursor: submitted ? "default" : "pointer", fontFamily: "var(--font-body)" }}>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, flexShrink: 0 }}>{String.fromCharCode(65 + oi)}.</span>
                      {submitted && isCorrect && <CheckCircle2 size={13} style={{ color: "var(--green-2)", flexShrink: 0 }} />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {submitted ? (
            <div>
              <div className="glass" style={{ padding: 18, textAlign: "center", marginBottom: 12, borderColor: correct === lesson.quiz.length ? "var(--green-ring)" : "var(--gold-ring)", background: correct === lesson.quiz.length ? "var(--green-dim)" : "var(--gold-dim)" }}>
                <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: correct === lesson.quiz.length ? "var(--green-2)" : "var(--gold-2)", marginBottom: 4 }}>{correct}/{lesson.quiz.length}</div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>{correct === lesson.quiz.length ? "Perfect score! +25 XP." : `${lesson.quiz.length - correct} incorrect — review above.`}</div>
              </div>
              <button className="btn-ghost" style={{ width: "100%" }} onClick={retryQuiz}>Retry Quiz</button>
            </div>
          ) : (
            <button disabled={!allAnswered} onClick={() => submitQuiz(lesson)} style={{ width: "100%", padding: 14, borderRadius: "var(--r-md)", fontSize: 14.5, fontWeight: 600, fontFamily: "var(--font-body)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", background: allAnswered ? "var(--cta-gradient)" : "var(--glass-fill)", color: allAnswered ? "#fff" : "var(--text-3)", boxShadow: allAnswered ? "0 6px 18px var(--primary-ring)" : "none", cursor: allAnswered ? "pointer" : "not-allowed" }}>
              {allAnswered ? "Submit Quiz" : `Answer all ${lesson.quiz.length} to submit`}
            </button>
          )}
        </div>
      )}

      {lessonTab === "challenge" && (
        <div>
          <div className="glass-strong" style={{ padding: 20, marginBottom: 14, borderLeft: `3px solid ${mod.color}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Lightbulb size={14} style={{ color: mod.color }} /><span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: mod.color }}>Apply Your Knowledge</span>
            </div>
            <p style={{ fontSize: 14.5, lineHeight: 1.7, color: "var(--text-2)" }}>{lesson.challenge}</p>
          </div>
          <div style={{ padding: "13px 16px", borderRadius: "var(--r-md)", background: "var(--glass-fill)", border: "1px solid var(--glass-border)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}><strong style={{ color: "var(--text-2)" }}>Tip:</strong> Write your answer in Notes on the Lesson tab.</div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Flashcards ─────────── */
function Flash({ FLASHCARDS, progress, flashMode, flipped, flashIdx, flashDeck, chooseFlashMode, flip, navCard, markKnown, goTab }) {
  const cards = FLASHCARDS;
  const known = progress.flashDone || {};
  const mastered = Object.keys(known).filter((k) => known[k]).length;
  const deck = flashDeck();

  if (!deck.length) {
    return (
      <div className="scalein" style={{ textAlign: "center", padding: "40px 16px" }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>🎉</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "var(--text-1)", marginBottom: 8 }}>All {cards.length} cards mastered!</div>
        <div style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>Switch to All Cards to review again.</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => chooseFlashMode("all")}><RotateCcw size={14} /> Review All</button>
          <button className="btn-ghost" onClick={() => goTab("home")}><ArrowLeft size={14} /> Home</button>
        </div>
      </div>
    );
  }

  const len = deck.length;
  const pos = flashIdx % Math.max(len, 1);
  const card = deck[pos];
  const dotCount = Math.min(len, 16);

  return (
    <div className="fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <div className="glass" style={{ display: "flex", gap: 4, padding: 4, borderRadius: "var(--r-md)" }}>
          {[["all", `All (${cards.length})`], ["unseen", `Unseen (${cards.length - mastered})`]].map(([m, label]) => (
            <button key={m} onClick={() => chooseFlashMode(m)} style={{ padding: "7px 14px", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 600, background: flashMode === m ? "var(--glass-fill-strong)" : "transparent", color: flashMode === m ? "var(--text-1)" : "var(--text-3)", border: flashMode === m ? "1px solid var(--glass-border-2)" : "1px solid transparent", cursor: "pointer", fontFamily: "var(--font-body)" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div className="mono" style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>{pos + 1} of {len} · {mastered} mastered</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
          {Array.from({ length: dotCount }, (_, i) => (
            <div key={i} style={{ height: 3, width: i === pos ? 20 : 6, borderRadius: 2, background: i < pos ? "var(--glass-border-2)" : i === pos ? "var(--primary)" : "var(--glass-border)", transition: "all .2s ease" }} />
          ))}
        </div>
      </div>

      <div onClick={flip} style={{ perspective: 1200, cursor: "pointer", userSelect: "none", marginBottom: 20 }}>
        <div style={{ position: "relative", transformStyle: "preserve-3d", transition: "transform .55s cubic-bezier(.16,1,.3,1)", height: 280, transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
          <div className="glass-strong" style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", borderRadius: "var(--r-xl)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center" }}>
            <span className="badge badge-primary" style={{ marginBottom: 18 }}>TERM</span>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.3 }}>{card.term}</div>
            <div style={{ marginTop: 20, fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}><RotateCcw size={11} /> Tap to flip</div>
          </div>
          <div className="glass-strong" style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "var(--r-xl)", borderColor: "var(--gold-ring)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", textAlign: "center" }}>
            <span className="badge badge-gold" style={{ marginBottom: 18 }}>DEFINITION</span>
            <div style={{ fontSize: 15, color: "var(--text-2)", lineHeight: 1.7 }}>{card.def}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button className="btn-ghost" onClick={() => navCard(-1)}><ChevronLeft size={15} /> Prev</button>
        {flipped ? (
          <button onClick={markKnown} style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: "var(--r-md)", background: "var(--green-dim)", color: "var(--green-2)", border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}><Check size={14} /> Got it</button>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>Flip to mark known</div>
        )}
        <button className="btn-ghost" onClick={() => navCard(1)}>Next <ChevronRight size={15} /></button>
      </div>

      <div style={{ marginTop: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>Mastery</span>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>{mastered}/{cards.length}</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${(mastered / cards.length) * 100}%`, background: "linear-gradient(90deg, var(--green) 0%, var(--primary) 100%)" }} /></div>
      </div>
    </div>
  );
}

/* ─────────── Search ─────────── */
function SearchTab({ MODULES, FLASHCARDS, query, setQuery, openLesson, openCard }) {
  const results = lib.searchCurriculum(MODULES, FLASHCARDS, query);
  const lessons = results.filter((r) => r.type === "lesson");
  const cards = results.filter((r) => r.type === "flashcard");
  const trimmed = query.trim();

  return (
    <div className="fadein">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 14 }}>Search</h1>
      <div className="glass" style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 14px", marginBottom: 18 }}>
        <Search size={17} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        <input
          autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lessons & flashcards…"
          style={{ flex: 1, minWidth: 0, padding: "12px 0", background: "none", border: "none", outline: "none", color: "var(--text-1)", fontSize: 15, fontFamily: "var(--font-body)" }}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear" style={{ display: "flex", padding: 5, border: "none", background: "none", cursor: "pointer" }}>
            <X size={16} style={{ color: "var(--text-3)" }} />
          </button>
        )}
      </div>

      {trimmed.length < 2 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-3)", fontSize: 13.5 }}>Type at least two characters to search.</div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-3)", fontSize: 13.5 }}>No matches for “{trimmed}”.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {lessons.length > 0 && (
            <div>
              <div style={{ marginBottom: 8 }}><span className="section-label">Lessons ({lessons.length})</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lessons.map((r) => (
                  <button key={r.lessonId} className="glass glass-btn" onClick={() => openLesson(r.moduleId, r.lessonId)} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 15px", borderLeft: `3px solid ${r.color}` }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: r.color, marginBottom: 4 }}>{r.moduleTitle}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", marginBottom: 3 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{r.snippet}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {cards.length > 0 && (
            <div>
              <div style={{ marginBottom: 8 }}><span className="section-label">Flashcards ({cards.length})</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cards.map((r) => (
                  <button key={r.index} className="glass glass-btn" onClick={() => openCard(r.index)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 15px" }}>
                    <CreditCard size={16} style={{ color: "var(--gold-2)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>{r.term}</div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.5 }}>{r.snippet}</div>
                    </div>
                    <ChevronRight size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
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

/* ─────────── Saved ─────────── */
function SavedTab({ MODULES, progress, openLesson, toggleBookmark, removeHighlight }) {
  const lessonOf = (id) => {
    for (const mod of MODULES) {
      const l = mod.lessons.find((x) => x.id === id);
      if (l) return { mod, lesson: l };
    }
    return null;
  };
  const bookmarks = Object.keys(progress.bookmarks || {}).map(lessonOf).filter(Boolean);
  const highlightEntries = Object.entries(progress.highlights || {})
    .map(([id, snippets]) => ({ ref: lessonOf(id), snippets })).filter((e) => e.ref && e.snippets.length);
  const noteEntries = Object.entries(progress.notes || {})
    .filter(([, v]) => v && v.trim()).map(([id, text]) => ({ ref: lessonOf(id), text })).filter((e) => e.ref);
  const empty = !bookmarks.length && !highlightEntries.length && !noteEntries.length;

  return (
    <div className="fadein">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Saved</h1>
      <p style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 18 }}>Bookmarks, highlights, and notes.</p>

      {empty ? (
        <div className="glass" style={{ textAlign: "center", padding: "36px 20px" }}>
          <Bookmark size={24} style={{ color: "var(--text-3)", margin: "0 auto 10px" }} />
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 5 }}>Nothing saved yet</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>Bookmark a lesson or highlight a sentence to collect it here.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {bookmarks.length > 0 && (
            <div>
              <div style={{ marginBottom: 10 }}><span className="section-label">Bookmarks ({bookmarks.length})</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bookmarks.map(({ mod, lesson }) => (
                  <div key={lesson.id} className="glass" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderLeft: `3px solid ${mod.color}` }}>
                    <button onClick={() => openLesson(mod.id, lesson.id)} style={{ flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: mod.color, marginBottom: 3 }}>{mod.title}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>{lesson.title}</div>
                    </button>
                    <button onClick={() => toggleBookmark(lesson.id)} aria-label="Remove bookmark" style={{ flexShrink: 0, display: "flex", padding: 7, borderRadius: 999, border: "1px solid var(--gold-ring)", background: "var(--gold-dim)", cursor: "pointer" }}>
                      <Bookmark size={14} style={{ color: "var(--gold-2)" }} fill="var(--gold-2)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {highlightEntries.length > 0 && (
            <div>
              <div style={{ marginBottom: 10 }}><span className="section-label">Highlights</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {highlightEntries.map(({ ref, snippets }) => (
                  <div key={ref.lesson.id}>
                    <button onClick={() => openLesson(ref.mod.id, ref.lesson.id)} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 7, background: "none", border: "none", cursor: "pointer", padding: 0, color: ref.mod.color, fontSize: 12, fontWeight: 600 }}>
                      {ref.lesson.title} <ChevronRight size={12} />
                    </button>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {snippets.map((h) => (
                        <div key={h} className="glass" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 13px", borderLeft: `3px solid ${ref.mod.color}` }}>
                          <span style={{ flex: 1, fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>{h}</span>
                          <button onClick={() => removeHighlight(ref.lesson.id, h)} aria-label="Remove highlight" style={{ flexShrink: 0, display: "flex", padding: 4, border: "none", background: "none", cursor: "pointer" }}>
                            <X size={13} style={{ color: "var(--text-3)" }} />
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
              <div style={{ marginBottom: 10 }}><span className="section-label">Notes</span></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {noteEntries.map(({ ref, text }) => (
                  <button key={ref.lesson.id} className="glass glass-btn" onClick={() => openLesson(ref.mod.id, ref.lesson.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "13px 15px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <StickyNote size={13} style={{ color: "var(--text-3)" }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: ref.mod.color }}>{ref.lesson.title}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55, whiteSpace: "pre-wrap", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{text}</div>
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
