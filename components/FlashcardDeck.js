"use client";

import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";

export default function FlashcardDeck({ cards, progress, onBack, onUpdate }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState({ ...progress.flashDone });
  const [mode, setMode] = useState("all");

  const deck    = mode === "unseen" ? cards.filter((_, i) => !known[i]) : cards;
  const pos     = idx % Math.max(deck.length, 1);
  const card    = deck[pos];
  const mastered = Object.keys(known).length;

  function markKnown() {
    const gi   = cards.indexOf(card);
    const next = { ...known, [gi]: true };
    setKnown(next);
    onUpdate({ ...progress, flashDone: next });
    setFlipped(false);
    setIdx(i => (i >= deck.length - 1 ? 0 : i + 1));
  }

  function navigate(dir) {
    setFlipped(false);
    setTimeout(() => setIdx(i => (i + dir + deck.length) % deck.length), 60);
  }

  /* All mastered empty state */
  if (!deck.length) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ textAlign: "center", maxWidth: 360 }} className="scalein">
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em", marginBottom: 8 }}>
            All {cards.length} cards mastered!
          </div>
          <div style={{ fontSize: 14.5, color: "var(--text-2)", marginBottom: 28, lineHeight: 1.6 }}>
            Switch to All Cards to review again, or head back to continue your lessons.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setMode("all"); setIdx(0); }} className="btn-primary">
              <RotateCcw size={14} /> Review All Cards
            </button>
            <button onClick={onBack} className="btn-ghost">
              <ArrowLeft size={14} /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "40px 48px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }} className="fadein">
          <button onClick={onBack} className="btn-ghost">
            <ArrowLeft size={14} /> Dashboard
          </button>

          {/* Mode toggle */}
          <div style={{
            display: "flex", gap: 4, padding: 4,
            background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)",
          }}>
            {[["all", `All (${cards.length})`], ["unseen", `Unseen (${cards.length - mastered})`]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setIdx(0); setFlipped(false); }}
                style={{
                  padding: "6px 14px", borderRadius: "var(--r-sm)",
                  fontSize: 12.5, fontWeight: 600,
                  background: mode === m ? "var(--card-2)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text-3)",
                  border: mode === m ? "1px solid var(--border-2)" : "1px solid transparent",
                  cursor: "pointer", transition: "all 0.12s ease",
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Counter + progress dots */}
        <div style={{ textAlign: "center", marginBottom: 24 }} className="fadein">
          <div style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
            {pos + 1} of {deck.length} · {mastered} mastered
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
            {Array.from({ length: Math.min(deck.length, 20) }, (_, i) => (
              <div key={i} style={{
                height: 3,
                width: i === pos ? 20 : 6,
                borderRadius: 2,
                background: i < pos ? "var(--border-2)" : i === pos ? "var(--blue-2)" : "var(--border)",
                transition: "all 0.2s ease",
              }} />
            ))}
            {deck.length > 20 && <span style={{ fontSize: 11, color: "var(--text-3)", alignSelf: "center" }}>+{deck.length - 20}</span>}
          </div>
        </div>

        {/* 3D Flip Card */}
        <div className="fadein" style={{ perspective: "1200px", cursor: "pointer", userSelect: "none", marginBottom: 24 }}
          onClick={() => setFlipped(f => !f)}
          role="button" tabIndex={0}
          onKeyDown={e => e.key === "Enter" && setFlipped(f => !f)}
          aria-label={flipped ? "Definition side — click to see term" : "Term side — click to reveal definition"}>

          <div style={{
            position: "relative",
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
            height: 300,
          }}>
            {/* Front — Term */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              background: "var(--card-2)", border: "1px solid var(--border-2)",
              borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-2)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "40px 48px", textAlign: "center",
            }}>
              <span className="badge badge-blue" style={{ marginBottom: 20 }}>TERM</span>
              <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                {card.term}
              </div>
              <div style={{ marginTop: 24, fontSize: 12.5, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
                <RotateCcw size={11} /> Click to flip
              </div>
            </div>

            {/* Back — Definition */}
            <div style={{
              position: "absolute", inset: 0,
              backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "var(--card-2)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-2)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "40px 48px", textAlign: "center",
            }}>
              <span className="badge badge-gold" style={{ marginBottom: 20 }}>DEFINITION</span>
              <div style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.75 }}>
                {card.def}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }} className="fadein">
          <button onClick={() => navigate(-1)} className="btn-ghost">
            <ChevronLeft size={15} /> Prev
          </button>

          {flipped ? (
            <button onClick={markKnown}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 28px", borderRadius: "var(--r-md)",
                background: "var(--green-dim)", color: "var(--green)",
                border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.2)"; e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--green-dim)"; e.currentTarget.style.transform = ""; }}>
              <Check size={14} /> Got it
            </button>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>Flip to mark known</div>
          )}

          <button onClick={() => navigate(1)} className="btn-ghost">
            Next <ChevronRight size={15} />
          </button>
        </div>

        {/* Mastery bar */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>Mastery</span>
            <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
              {mastered}/{cards.length}
            </span>
          </div>
          <div className="progress-track" style={{ height: 5 }}>
            <div className="progress-fill"
              style={{ width: `${(mastered / cards.length) * 100}%`, background: `linear-gradient(90deg, var(--green) 0%, var(--blue-2) 100%)` }} />
          </div>
        </div>

      </div>
    </div>
  );
}
