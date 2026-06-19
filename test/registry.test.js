import { test } from "node:test";
import assert from "node:assert/strict";
import { PILLARS } from "../data/pillars.js";
import { REGISTRY, getByPillar } from "../data/registry.js";
import { MODULES } from "../data/curriculum.js";

test("PILLARS are head, heart, hustle with Lucide (non-emoji) icons", () => {
  assert.deepEqual(PILLARS.map((p) => p.id), ["head", "heart", "hustle"]);
  for (const p of PILLARS) assert.match(p.icon, /^[a-z]+$/); // lucide name, not emoji
});

test("every curriculum module is in REGISTRY under head, in order", () => {
  const head = getByPillar("head");
  assert.equal(head.length, MODULES.length);
  assert.deepEqual(head.map((x) => x.id), MODULES.map((m) => m.id));
  assert.ok(head.every((x) => x.kind === "module" && x.pillarId === "head"));
});

test("hustle pillar contains exactly the cover letter tool", () => {
  const hustle = getByPillar("hustle");
  assert.equal(hustle.length, 1);
  assert.equal(hustle[0].id, "coverLetter");
  assert.equal(hustle[0].kind, "tool");
});

test("heart pillar is empty in this slice", () => {
  assert.deepEqual(getByPillar("heart"), []);
});

test("getByPillar sorts numerically by order (not lexicographically)", () => {
  const orders = getByPillar("head").map((x) => x.order);
  const sorted = [...orders].sort((a, b) => a - b);
  assert.deepEqual(orders, sorted);
});

test("getByPillar returns [] for an unknown pillar id", () => {
  assert.deepEqual(getByPillar("nope"), []);
});

test("every REGISTRY entry has a pillarId that exists in PILLARS", () => {
  const ids = new Set(PILLARS.map((p) => p.id));
  assert.ok(REGISTRY.every((x) => ids.has(x.pillarId)));
});
