"use client";

import { useEffect } from "react";
import { useProgress } from "./ProgressContext";
import { ACHIEVEMENTS } from "@/lib/momentum";
import { Award, Zap, TrendingUp } from "lucide-react";

export default function RewardLayer() {
  const { rewards, dismissReward } = useProgress();

  // Auto-dismiss each reward after its animation.
  useEffect(() => {
    const timers = rewards.map((r) => {
      const ttl = r.type === "xp" ? 1400 : 3200;
      return setTimeout(() => dismissReward(r.id), ttl);
    });
    return () => timers.forEach(clearTimeout);
  }, [rewards, dismissReward]);

  const toasts = rewards.filter((r) => r.type !== "xp");
  const xps = rewards.filter((r) => r.type === "xp");

  return (
    <>
      {/* XP floats — centered bottom */}
      <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 60, pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {xps.map((r) => (
          <div key={r.id} className="float-xp mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold-2)", textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            +{r.amount} XP
          </div>
        ))}
      </div>

      {/* Toasts — top right */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 60, display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
        {toasts.map((r) => {
          if (r.type === "level") {
            return (
              <div key={r.id} className="card-2 toast-in" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                <TrendingUp size={20} style={{ color: "var(--blue-2)" }} />
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)" }}>Level {r.level}!</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Keep the momentum going.</div>
                </div>
              </div>
            );
          }
          const ach = ACHIEVEMENTS.find((a) => a.id === r.achId);
          return (
            <div key={r.id} className="card-2 toast-in" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <Award size={20} style={{ color: "var(--gold-2)" }} />
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)" }}>{ach?.label ?? "Achievement"}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{ach?.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
