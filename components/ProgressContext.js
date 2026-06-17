"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  loadProgress, saveProgress, markComplete, saveQuizScore,
  daysUntilFellowship, readinessScore, todayISO,
} from "@/lib/progress";
import {
  levelFromXp, streakMultiplier, awardXp, dailyProgress, evaluateAchievements,
} from "@/lib/momentum";
import { MODULES } from "@/data/curriculum";

const Ctx = createContext(null);
export function useProgress() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress must be used inside <ProgressProvider>");
  return v;
}

let _rid = 0;

export function ProgressProvider({ children }) {
  const [progress, setProgress] = useState(null);
  const [days, setDays] = useState(0);
  const [rewards, setRewards] = useState([]);
  const prevXpRef = useRef(0);

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    prevXpRef.current = p.xp;
    setDays(daysUntilFellowship());
  }, []);

  const pushRewards = useCallback((before, after) => {
    const beforeLevel = levelFromXp(before.xp).level;
    const afterLevel = levelFromXp(after.xp).level;
    const xpGained = after.xp - before.xp;
    const earnedBefore = new Set(Object.keys(before.achievements ?? {}));
    const earnedNow = evaluateAchievements(after, MODULES);
    const newAchievements = earnedNow.filter((id) => !earnedBefore.has(id));
    const leveledUp = afterLevel > beforeLevel;

    const queued = [];
    if (xpGained > 0) queued.push({ id: ++_rid, type: "xp", amount: xpGained });
    if (leveledUp) queued.push({ id: ++_rid, type: "level", level: afterLevel });
    for (const id of newAchievements) queued.push({ id: ++_rid, type: "achievement", achId: id });
    if (queued.length) setRewards((r) => [...r, ...queued]);

    return { xpGained, leveledUp, newAchievements };
  }, []);

  // Persist achievements (unlockedAt) into state, then save.
  const commit = useCallback((next) => {
    const earned = evaluateAchievements(next, MODULES);
    const now = new Date().toISOString();
    const achievements = { ...(next.achievements ?? {}) };
    for (const id of earned) if (!achievements[id]) achievements[id] = now;
    const final = { ...next, achievements };
    setProgress(final);
    saveProgress(final);
    return final;
  }, []);

  const completeLesson = useCallback((id) => {
    let reward = { xpGained: 0, leveledUp: false, newAchievements: [] };
    setProgress((cur) => {
      const before = cur;
      const after = markComplete(before, id, 50);
      if (after === before) return before;        // already complete
      reward = pushRewards(before, after);
      return commit(after);
    });
    return reward;
  }, [pushRewards, commit]);

  const recordQuiz = useCallback((id, correct, total) => {
    let reward = { xpGained: 0, leveledUp: false, newAchievements: [] };
    setProgress((cur) => {
      const before = cur;
      let after = saveQuizScore(before, id, correct, total);
      if (correct === total) {
        const today = todayISO();
        const bonus = awardXp(25, before.streak);
        const daily = after.daily?.date === today
          ? { ...after.daily, xp: after.daily.xp + bonus }
          : { date: today, xp: bonus, lessons: 0, minutes: after.daily?.minutes ?? 0 };
        after = { ...after, xp: after.xp + bonus, daily };
      }
      reward = pushRewards(before, after);
      return commit(after);
    });
    return reward;
  }, [pushRewards, commit]);

  const masterCard = useCallback((idx) => {
    let reward = { xpGained: 0, leveledUp: false, newAchievements: [] };
    setProgress((cur) => {
      const before = cur;
      if (before.flashDone?.[idx]) return before;
      const after = { ...before, flashDone: { ...before.flashDone, [idx]: true } };
      reward = pushRewards(before, after);
      return commit(after);
    });
    return reward;
  }, [pushRewards, commit]);

  const addFocusMinutes = useCallback((min) => {
    setProgress((cur) => {
      const today = todayISO();
      const daily = cur.daily?.date === today
        ? { ...cur.daily, minutes: cur.daily.minutes + min }
        : { date: today, xp: 0, lessons: 0, minutes: min };
      return commit({ ...cur, daily });
    });
  }, [commit]);

  const dismissReward = useCallback((id) => {
    setRewards((r) => r.filter((x) => x.id !== id));
  }, []);

  const momentum = progress ? (() => {
    const lvl = levelFromXp(progress.xp);
    return {
      ...lvl,
      multiplier: streakMultiplier(progress.streak),
      daily: dailyProgress(progress, todayISO()),
    };
  })() : null;

  const readiness = progress ? readinessScore(progress, MODULES) : 0;

  return (
    <Ctx.Provider value={{
      progress, days, readiness, momentum,
      completeLesson, recordQuiz, masterCard, addFocusMinutes,
      rewards, dismissReward,
    }}>
      {children}
    </Ctx.Provider>
  );
}
