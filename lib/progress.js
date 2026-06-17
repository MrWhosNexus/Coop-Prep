"use client";

const KEY = "coop_prep_v1";

export function loadProgress() {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveProgress(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export function defaultState() {
  return {
    completed: {},   // lessonId → true
    quizScores: {},  // lessonId → { correct, total, lastAt }
    flashDone: {},   // flashcard index → true
    notes: {},       // lessonId → string
    xp: 0,
    streak: 0,
    lastDay: null,
  };
}

export function markComplete(state, lessonId, xpGain = 50) {
  if (state.completed[lessonId]) return state;
  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = state.lastDay !== today;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = isNewDay
    ? state.lastDay === yesterday ? state.streak + 1 : 1
    : state.streak;
  return {
    ...state,
    completed: { ...state.completed, [lessonId]: true },
    xp: state.xp + xpGain,
    streak,
    lastDay: today,
  };
}

export function saveQuizScore(state, lessonId, correct, total) {
  return {
    ...state,
    quizScores: {
      ...state.quizScores,
      [lessonId]: { correct, total, lastAt: new Date().toISOString() },
    },
  };
}

export function daysUntilFellowship() {
  const target = new Date("2026-08-12");
  const now = new Date();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export function readinessScore(progress, modules) {
  const allLessons = modules.flatMap((m) => m.lessons);
  const total = allLessons.length;
  const done = allLessons.filter((l) => progress.completed[l.id]).length;
  const quizzed = allLessons.filter(
    (l) => progress.quizScores[l.id]?.correct >= (progress.quizScores[l.id]?.total ?? 1)
  ).length;
  // 60% weight on lesson completion, 40% on quiz passes
  return Math.round(((done / total) * 0.6 + (quizzed / total) * 0.4) * 100);
}
