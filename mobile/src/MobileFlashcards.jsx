import { useState } from "react";
import { useProgress } from "@/components/ProgressContext";
import { FLASHCARDS } from "@/data/curriculum";
import { ChevronLeft, ChevronRight, Check, RotateCcw } from "lucide-react";

export default function MobileFlashcards() {
  const { progress, masterCard } = useProgress();
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState({ ...progress.flashDone });
  const [mode, setMode] = useState("all");

  const deck = mode === "unseen" ? FLASHCARDS.filter((_, i) => !known[i]) : FLASHCARDS;
  const mastered = Object.keys(known).length;

  if (!deck.length) {
    return (
      <div className="scalein" style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>All {FLASHCARDS.length} mastered!</div>
        <button onClick={() => { setMode("all"); setIdx(0); }} className="btn-primary" style={{ justifyContent: "center" }}><RotateCcw size={14} /> Review all</button>
      </div>
    );
  }

  const pos = idx % deck.length;
  const card = deck[pos];

  function markKnown() {
    const gi = FLASHCARDS.indexOf(card);
    setKnown(k => ({ ...k, [gi]: true }));
    masterCard(gi);
    setFlipped(false);
    setIdx(i => (i >= deck.length - 1 ? 0 : i + 1));
  }
  function navigate(d) { setFlipped(false); setTimeout(() => setIdx(i => (i + d + deck.length) % deck.length), 60); }

  return (
    <div className="fadein">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>Flashcards</h2>
        <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
          {[["all", `All ${FLASHCARDS.length}`], ["unseen", `Unseen ${FLASHCARDS.length - mastered}`]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setIdx(0); setFlipped(false); }}
              style={{ padding: "6px 12px", borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: mode === m ? "var(--card-2)" : "transparent", color: mode === m ? "var(--text)" : "var(--text-3)", border: mode === m ? "1px solid var(--border-2)" : "1px solid transparent" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-3)", marginBottom: 12 }} className="mono">{pos + 1} of {deck.length} · {mastered} mastered</div>

      <div style={{ perspective: "1200px", cursor: "pointer", userSelect: "none", marginBottom: 20 }}
        onClick={() => setFlipped(f => !f)} role="button" tabIndex={0}
        onKeyDown={e => e.key === "Enter" && setFlipped(f => !f)}>
        <div style={{ position: "relative", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)", height: 280 }}>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "var(--card-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
            <span className="badge badge-blue" style={{ marginBottom: 16 }}>TERM</span>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.3 }}>{card.term}</div>
            <div style={{ marginTop: 18, fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}><RotateCcw size={11} /> Tap to flip</div>
          </div>
          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--card-2)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, textAlign: "center" }}>
            <span className="badge badge-gold" style={{ marginBottom: 16 }}>DEFINITION</span>
            <div style={{ fontSize: 15.5, color: "var(--text-2)", lineHeight: 1.7 }}>{card.def}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost"><ChevronLeft size={15} /> Prev</button>
        {flipped ? (
          <button onClick={markKnown} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: "var(--r-md)", background: "var(--green-dim)", color: "var(--green)", border: "1px solid var(--green-ring)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}><Check size={14} /> Got it</button>
        ) : <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>Flip to mark</span>}
        <button onClick={() => navigate(1)} className="btn-ghost">Next <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}
