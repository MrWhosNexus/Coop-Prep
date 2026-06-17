"use client";

import { useState, useEffect, useRef } from "react";
import { useProgress } from "./ProgressContext";
import { formatDuration } from "@/lib/momentum";
import { Play, Square } from "lucide-react";

export default function FocusTimer() {
  const { addFocusMinutes } = useProgress();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [running]);

  function stop() {
    setRunning(false);
    const mins = Math.floor(seconds / 60);
    if (mins > 0) addFocusMinutes(mins);
    setSeconds(0);
  }

  return (
    <button
      className="nav-item"
      onClick={() => (running ? stop() : setRunning(true))}
      style={{ justifyContent: "space-between", marginTop: 8 }}
      title={running ? "Stop focus session (logs minutes)" : "Start focus session"}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {running ? <Square size={13} style={{ color: "var(--red)" }} /> : <Play size={13} style={{ color: "var(--green)" }} />}
        Focus
      </span>
      <span className="mono" style={{ fontSize: 12, color: running ? "var(--text)" : "var(--text-3)" }}>{formatDuration(seconds)}</span>
    </button>
  );
}
