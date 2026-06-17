"use client";

import { useState } from "react";
import {
  LayoutDashboard, CreditCard, ChevronRight, BookOpen,
  Zap, Flame, CalendarDays, Target, CheckCircle2,
  Lock, ArrowLeft, Clock, HelpCircle, Lightbulb,
  TrendingUp, CircleCheck
} from "lucide-react";
import { MODULES, FLASHCARDS } from "@/data/curriculum";
import LessonViewer from "./LessonViewer";
import FlashcardDeck from "./FlashcardDeck";
import { ProgressProvider, useProgress } from "./ProgressContext";
import MomentumStrip from "./MomentumStrip";
import RewardLayer from "./RewardLayer";
import FocusTimer from "./FocusTimer";

/* ─────────────────────────────────────────── */
/*  Root                                       */
/* ─────────────────────────────────────────── */
function DashboardInner() {
  const { progress, days, readiness, completeLesson, recordQuiz } = useProgress();
  const [view, setView] = useState("home");          // home | module | lesson | flash
  const [activeModule, setActiveModule] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);

  const onComplete = (id) => completeLesson(id);
  const onQuizDone = (id, correct, total) => recordQuiz(id, correct, total);

  if (!progress) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--blue)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* Full-screen views (lesson / flashcard) */
  if (view === "lesson" && activeLesson) {
    return (
      <AppShell progress={progress} days={days} readiness={readiness}
        view={view} activeModule={activeModule}
        onNav={(v, m) => { setView(v); if (m) setActiveModule(m); }}>
        <LessonViewer lesson={activeLesson} mod={activeModule} progress={progress}
          onBack={() => setView("module")} onComplete={onComplete} onQuizDone={onQuizDone} />
      </AppShell>
    );
  }

  if (view === "flash") {
    return (
      <AppShell progress={progress} days={days} readiness={readiness}
        view={view} activeModule={activeModule}
        onNav={(v, m) => { setView(v); if (m) setActiveModule(m); }}>
        <FlashcardDeck cards={FLASHCARDS} progress={progress}
          onBack={() => setView("home")} />
      </AppShell>
    );
  }

  if (view === "module" && activeModule) {
    return (
      <AppShell progress={progress} days={days} readiness={readiness}
        view={view} activeModule={activeModule}
        onNav={(v, m) => { setView(v); if (m) setActiveModule(m); }}>
        <ModuleView mod={activeModule} progress={progress}
          onBack={() => setView("home")}
          onOpen={(l) => { setActiveLesson(l); setView("lesson"); }} />
      </AppShell>
    );
  }

  return (
    <AppShell progress={progress} days={days} readiness={readiness}
      view={view} activeModule={activeModule}
      onNav={(v, m) => { setView(v); if (m) setActiveModule(m); }}>
      <HomeView progress={progress} days={days} readiness={readiness}
        onOpenModule={(m) => { setActiveModule(m); setView("module"); }}
        onOpenLesson={(m, l) => { setActiveModule(m); setActiveLesson(l); setView("lesson"); }}
        onFlash={() => setView("flash")} />
    </AppShell>
  );
}

/* ─────────────────────────────────────────── */
/*  App shell: sidebar + content area          */
/* ─────────────────────────────────────────── */
function AppShell({ progress, days, readiness, view, activeModule, onNav, children }) {
  const totalLessons = MODULES.flatMap(m => m.lessons).length;
  const doneLessons  = MODULES.flatMap(m => m.lessons).filter(l => progress.completed[l.id]).length;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "var(--sidebar-w)",
        flexShrink: 0,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        zIndex: 30,
      }}>

        {/* Brand */}
        <div style={{ padding: "24px 16px 20px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>COOP Prep</div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2, fontWeight: 500 }}>
            Financial Services Track
          </div>
        </div>

        <div className="divider" style={{ margin: "0 16px 12px" }} />

        {/* Nav */}
        <nav style={{ padding: "0 8px", flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>

          {/* Home */}
          <button className={`nav-item ${view === "home" ? "active" : ""}`}
            onClick={() => onNav("home")}>
            <LayoutDashboard size={15} />
            Dashboard
          </button>

          {/* Modules */}
          <div style={{ marginTop: 16, marginBottom: 6, padding: "0 10px" }}>
            <span className="section-label">Curriculum</span>
          </div>

          {MODULES.map((mod) => {
            const total = mod.lessons.length;
            const done  = mod.lessons.filter(l => progress.completed[l.id]).length;
            const isActive = view === "module" && activeModule?.id === mod.id;
            const isActiveLesson = view === "lesson" && activeModule?.id === mod.id;

            return (
              <button key={mod.id}
                className={`nav-item ${isActive || isActiveLesson ? "active" : ""}`}
                onClick={() => onNav("module", mod)}
                style={{ paddingLeft: 10 }}>
                {/* Colored dot */}
                <div className="nav-dot" style={{
                  width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                  background: (isActive || isActiveLesson) ? "var(--blue-2)" : mod.color,
                  opacity: (isActive || isActiveLesson) ? 1 : 0.7,
                }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {mod.title}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {done}/{total}
                </span>
              </button>
            );
          })}

          {/* Practice */}
          <div style={{ marginTop: 16, marginBottom: 6, padding: "0 10px" }}>
            <span className="section-label">Practice</span>
          </div>

          <button className={`nav-item ${view === "flash" ? "active" : ""}`}
            onClick={() => onNav("flash")}>
            <CreditCard size={15} />
            Flashcards
            <span className="badge badge-muted" style={{ marginLeft: "auto", fontSize: 10.5 }}>
              {FLASHCARDS.length}
            </span>
          </button>
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border)", marginTop: "auto" }}>
          {/* Overall progress */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>Overall progress</span>
              <span style={{ fontSize: 11.5, color: "var(--text-2)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                {doneLessons}/{totalLessons}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill"
                style={{ width: `${(doneLessons / totalLessons) * 100}%`, background: "var(--blue)" }} />
            </div>
          </div>

          {/* Countdown */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: "var(--r-md)",
            background: days < 20 ? "rgba(248,113,113,0.1)" : days < 45 ? "var(--gold-dim)" : "var(--blue-dim)",
            border: `1px solid ${days < 20 ? "rgba(248,113,113,0.25)" : days < 45 ? "rgba(245,158,11,0.25)" : "var(--blue-ring)"}`,
          }}>
            <CalendarDays size={13} style={{ color: days < 20 ? "var(--red)" : days < 45 ? "var(--gold)" : "var(--blue-2)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: days < 20 ? "var(--red)" : days < 45 ? "var(--gold-2)" : "var(--blue-2)" }}>
              {days} days to Aug 12
            </span>
          </div>

          {/* XP + Streak */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", borderRadius: "var(--r-sm)", background: "var(--gold-dim)" }}>
              <Zap size={12} style={{ color: "var(--gold)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold-2)" }}>{progress.xp}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>XP</span>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 5, padding: "6px 8px", borderRadius: "var(--r-sm)", background: "rgba(249,115,22,0.1)" }}>
              <Flame size={12} style={{ color: "#f97316" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>{progress.streak}</span>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>day</span>
            </div>
          </div>

          {/* Focus Timer */}
          <FocusTimer />
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{
        marginLeft: "var(--sidebar-w)",
        flex: 1,
        minHeight: "100vh",
        overflowY: "auto",
      }}>
        {children}
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Home view                                  */
/* ─────────────────────────────────────────── */
function HomeView({ progress, days, readiness, onOpenModule, onOpenLesson, onFlash }) {
  const totalLessons = MODULES.flatMap(m => m.lessons).length;
  const doneLessons  = MODULES.flatMap(m => m.lessons).filter(l => progress.completed[l.id]).length;
  const quizPasses   = Object.values(progress.quizScores).filter(s => s.correct === s.total).length;

  const nextLesson = (() => {
    for (const mod of MODULES) {
      for (const lesson of mod.lessons) {
        if (!progress.completed[lesson.id]) return { mod, lesson };
      }
    }
    return null;
  })();

  const ringC    = 264;                                          // 2π × 42
  const ringFill = (readiness / 100) * ringC;
  const ringColor = readiness < 40 ? "var(--red)" : readiness < 70 ? "var(--gold)" : "var(--green)";

  const HOUR = new Date().getHours();
  const greeting = HOUR < 12 ? "Good morning" : HOUR < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: "40px 48px", maxWidth: 900, margin: "0 auto" }}>

      <MomentumStrip />

      {/* Page header */}
      <div className="fadein" style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          {greeting} 👋
        </h1>
        <p style={{ marginTop: 6, fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.5 }}>
          Track your progress toward the COOP Financial Services Fellowship — {days} days remaining.
        </p>
      </div>

      {/* Hero: readiness + continue */}
      <div className="fadein" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 20, marginBottom: 28, animationDelay: "0.05s" }}>

        {/* Readiness ring */}
        <div className="card" style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ position: "relative", width: 120, height: 120, marginBottom: 20 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={ringColor} />
                  <stop offset="100%" stopColor={readiness > 60 ? "var(--blue-2)" : ringColor} />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="42" fill="none" stroke="var(--border-2)" strokeWidth="7" />
              {readiness > 0 && (
                <circle cx="60" cy="60" r="42" fill="none"
                  stroke="url(#rg)" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={`${ringFill} ${ringC}`}
                  style={{ animation: "ring-fill 1s cubic-bezier(0.16,1,0.3,1) both", transition: "stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
              )}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{readiness}%</div>
              <div style={{ fontSize: 10.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>Ready</div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>Fellowship Readiness</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
            {readiness < 33 ? "Just starting — every lesson counts." :
             readiness < 66 ? "Good momentum. Keep pushing." :
             readiness < 90 ? "Strong. Finish the quizzes." :
             "You're ready. Practice your pitch."}
          </div>
        </div>

        {/* Continue learning */}
        <div>
          {nextLesson ? (
            <button onClick={() => onOpenLesson(nextLesson.mod, nextLesson.lesson)}
              className="card card-btn"
              style={{
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                width: "100%", height: "100%", padding: "28px 28px",
                textAlign: "left",
                borderColor: `${nextLesson.mod.color}40`,
                background: `linear-gradient(135deg, var(--card) 0%, ${nextLesson.mod.color}08 100%)`,
              }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className="badge" style={{ background: `${nextLesson.mod.color}20`, color: nextLesson.mod.color, borderColor: `${nextLesson.mod.color}40` }}>
                    Continue
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{nextLesson.mod.title}</span>
                </div>
                <div style={{ fontSize: 21, fontWeight: 700, color: "var(--text)", lineHeight: 1.25, letterSpacing: "-0.01em", marginBottom: 10 }}>
                  {nextLesson.lesson.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--text-3)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} />{nextLesson.lesson.minutes} min
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <HelpCircle size={12} />{nextLesson.lesson.quiz?.length || 0} questions
                  </span>
                  <span style={{ color: "var(--gold)", fontWeight: 600 }}>+50 XP</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 24, fontSize: 13.5, fontWeight: 600, color: "var(--blue-2)" }}>
                Start lesson <ChevronRight size={15} />
              </div>
            </button>
          ) : (
            <div className="card" style={{ height: "100%", padding: "32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                All {totalLessons} lessons complete
              </div>
              <div style={{ fontSize: 14, color: "var(--text-2)" }}>
                Review flashcards and practice your pitch. Fellowship is {days} days away.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="fadein" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40, animationDelay: "0.1s" }}>
        {[
          { icon: <BookOpen size={16} />, value: doneLessons, sub: `/ ${totalLessons}`, label: "Lessons done", color: "var(--blue-2)" },
          { icon: <Target size={16} />,   value: quizPasses,  sub: " passed",          label: "Quiz passes",  color: "var(--green)" },
          { icon: <Zap size={16} />,      value: progress.xp, sub: " XP",              label: "Total earned", color: "var(--gold)" },
          { icon: <Flame size={16} />,    value: progress.streak, sub: " days",         label: "Study streak", color: "#f97316" },
        ].map(({ icon, value, sub, label, color }) => (
          <div key={label} className="card" style={{ padding: "20px 20px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 4 }}>
              <span style={{ color, display: "flex", alignItems: "center", marginRight: 2 }}>{icon}</span>
              <span style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
              <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>{sub}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Modules section */}
      <div className="fadein" style={{ animationDelay: "0.15s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>Modules</h2>
          <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>
            {MODULES.filter(m => m.lessons.every(l => progress.completed[l.id])).length}/{MODULES.length} complete
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {MODULES.map((mod, i) => {
            const total = mod.lessons.length;
            const done  = mod.lessons.filter(l => progress.completed[l.id]).length;
            const pct   = Math.round((done / total) * 100);
            const allDone = done === total;

            return (
              <button key={mod.id} onClick={() => onOpenModule(mod)}
                className="card card-btn"
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", textAlign: "left", animationDelay: `${0.15 + i * 0.03}s` }}>
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: "var(--r-md)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${mod.color}18`, border: `1px solid ${mod.color}30`,
                  fontSize: 18,
                }}>
                  {mod.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{mod.title}</span>
                    {allDone && <span className="badge badge-green">Done</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>{mod.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-fill"
                        style={{ width: `${pct}%`, background: allDone ? "var(--green)" : mod.color }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {done}/{total}
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} style={{ color: "var(--text-3)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Flashcard CTA */}
      <div className="fadein" style={{ marginTop: 24, animationDelay: "0.4s" }}>
        <button onClick={onFlash} className="card card-btn"
          style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", width: "100%", textAlign: "left" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "var(--r-md)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--gold-dim)", border: "1px solid rgba(245,158,11,0.3)",
          }}>
            <CreditCard size={19} style={{ color: "var(--gold)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>Flashcard Review</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
              {FLASHCARDS.length} terms · regulations, formulas, frameworks · spaced repetition
            </div>
          </div>
          <ChevronRight size={16} style={{ color: "var(--text-3)" }} />
        </button>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Module lesson list                         */
/* ─────────────────────────────────────────── */
function ModuleView({ mod, progress, onBack, onOpen }) {
  const total = mod.lessons.length;
  const done  = mod.lessons.filter(l => progress.completed[l.id]).length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div style={{ padding: "40px 48px", maxWidth: 720, margin: "0 auto" }}>

      {/* Back */}
      <button onClick={onBack} className="btn-ghost fadein" style={{ marginBottom: 28, gap: 6 }}>
        <ArrowLeft size={14} /> Back to dashboard
      </button>

      {/* Module header */}
      <div className="card fadein" style={{ padding: "28px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "var(--r-lg)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${mod.color}18`, border: `1px solid ${mod.color}30`,
            fontSize: 22,
          }}>
            {mod.icon}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{mod.title}</div>
            <div style={{ fontSize: 12, color: mod.color, fontWeight: 600, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{mod.coopModule}</div>
          </div>
        </div>
        <div style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, marginBottom: 16 }}>{mod.description}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="progress-track" style={{ flex: 1, height: 5 }}>
            <div className="progress-fill" style={{ width: `${pct}%`, background: mod.color }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{done}/{total} lessons</span>
        </div>
      </div>

      {/* Lesson list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mod.lessons.map((lesson, idx) => {
          const isDone   = !!progress.completed[lesson.id];
          const quiz     = progress.quizScores[lesson.id];
          const locked   = idx > 0 && !progress.completed[mod.lessons[idx - 1].id];

          return (
            <button key={lesson.id} disabled={locked}
              onClick={() => !locked && onOpen(lesson)}
              className="card"
              style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                textAlign: "left", width: "100%",
                opacity: locked ? 0.4 : 1,
                cursor: locked ? "not-allowed" : "pointer",
                borderColor: isDone ? "rgba(34,197,94,0.28)" : "var(--border)",
                background: isDone ? "rgba(34,197,94,0.04)" : "var(--card)",
                transition: "background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { if (!locked) { e.currentTarget.style.background = isDone ? "rgba(34,197,94,0.07)" : "var(--card-hover)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-2)"; } }}
              onMouseLeave={e => { if (!locked) { e.currentTarget.style.background = isDone ? "rgba(34,197,94,0.04)" : "var(--card)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; } }}>

              {/* Number / status */}
              <div style={{
                width: 36, height: 36, borderRadius: "var(--r-md)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: isDone ? "var(--green-dim)" : locked ? "rgba(255,255,255,0.04)" : `${mod.color}18`,
                border: `1px solid ${isDone ? "var(--green-ring)" : locked ? "var(--border)" : `${mod.color}30`}`,
                fontSize: 13, fontWeight: 700,
                color: isDone ? "var(--green)" : locked ? "var(--text-3)" : mod.color,
              }}>
                {isDone ? <CircleCheck size={16} /> : locked ? <Lock size={13} /> : idx + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{lesson.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", display: "flex", gap: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{lesson.minutes} min</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}><HelpCircle size={11} />{lesson.quiz?.length || 0} questions</span>
                </div>
              </div>

              {/* Quiz score */}
              {quiz && (
                <span className={`badge ${quiz.correct === quiz.total ? "badge-green" : "badge-gold"}`}>
                  {quiz.correct}/{quiz.total}
                </span>
              )}
              {!locked && !isDone && <ChevronRight size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Provider wrapper (default export)          */
/* ─────────────────────────────────────────── */
export default function Dashboard() {
  return (
    <ProgressProvider>
      <DashboardInner />
      <RewardLayer />
    </ProgressProvider>
  );
}
