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
  const progressRef = useRef(null);

  useEffect(() => {
    const p = loadProgress();
    progressRef.current = p;
    setProgress(p);
    setDays(daysUntilFellowship());
  }, []);

  // Pure helper: builds reward queue + achievement-merged final state from before→after.
  // evaluateAchievements is called exactly once per action.
  const _buildRewardAndFinal = useCallback((before, after) => {
    const beforeLevel = levelFromXp(before.xp).level;
    const afterLevel = levelFromXp(after.xp).level;
    const xpGained = after.xp - before.xp;
    const leveledUp = afterLevel > beforeLevel;

    // evaluateAchievements called once — result shared for both diff and unlockedAt merge
    const earnedBefore = new Set(Object.keys(before.achievements ?? {}));
    const earnedNow = evaluateAchievements(after, MODULES);
    const newAchievements = earnedNow.filter((id) => !earnedBefore.has(id));

    const now = new Date().toISOString();
    const mergedAchievements = { ...(after.achievements ?? {}) };
    for (const id of earnedNow) if (!mergedAchievements[id]) mergedAchievements[id] = now;
    const final = { ...after, achievements: mergedAchievements };

    const queued = [];
    if (xpGained > 0) queued.push({ id: ++_rid, type: "xp", amount: xpGained });
    if (leveledUp) queued.push({ id: ++_rid, type: "level", level: afterLevel });
    for (const id of newAchievements) queued.push({ id: ++_rid, type: "achievement", achId: id });

    return { final, queued, reward: { xpGained, leveledUp, newAchievements } };
  }, []);

  const completeLesson = useCallback((id) => {
    const before = progressRef.current;
    if (!before) return { xpGained: 0, leveledUp: false, newAchievements: [] };
    const after = markComplete(before, id, 50);
    if (after === before) return { xpGained: 0, leveledUp: false, newAchievements: [] };
    const { final, queued, reward } = _buildRewardAndFinal(before, after);
    progressRef.current = final;
    setProgress(final);
    if (queued.length) setRewards((r) => [...r, ...queued]);
    saveProgress(final);
    return reward;
  }, [_buildRewardAndFinal]);

  const recordQuiz = useCallback((id, correct, total) => {
    const before = progressRef.current;
    if (!before) return { xpGained: 0, leveledUp: false, newAchievements: [] };
    let after = saveQuizScore(before, id, correct, total);
    if (correct === total) {
      const today = todayISO();
      const bonus = awardXp(25, before.streak);
      const daily = after.daily?.date === today
        ? { ...after.daily, xp: after.daily.xp + bonus }
        : { date: today, xp: bonus, lessons: 0, minutes: after.daily?.minutes ?? 0 };
      after = { ...after, xp: after.xp + bonus, daily };
    }
    const { final, queued, reward } = _buildRewardAndFinal(before, after);
    progressRef.current = final;
    setProgress(final);
    if (queued.length) setRewards((r) => [...r, ...queued]);
    saveProgress(final);
    return reward;
  }, [_buildRewardAndFinal]);

  const masterCard = useCallback((idx) => {
    const before = progressRef.current;
    if (!before) return { xpGained: 0, leveledUp: false, newAchievements: [] };
    if (before.flashDone?.[idx]) return { xpGained: 0, leveledUp: false, newAchievements: [] };
    const after = { ...before, flashDone: { ...before.flashDone, [idx]: true } };
    const { final, queued, reward } = _buildRewardAndFinal(before, after);
    progressRef.current = final;
    setProgress(final);
    if (queued.length) setRewards((r) => [...r, ...queued]);
    saveProgress(final);
    return reward;
  }, [_buildRewardAndFinal]);

  const addFocusMinutes = useCallback((min) => {
    const cur = progressRef.current;
    if (!cur) return;
    const today = todayISO();
    const daily = cur.daily?.date === today
      ? { ...cur.daily, minutes: cur.daily.minutes + min }
      : { date: today, xp: 0, lessons: 0, minutes: min };
    const final = { ...cur, daily };
    progressRef.current = final;
    setProgress(final);
    saveProgress(final);
  }, []);

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
