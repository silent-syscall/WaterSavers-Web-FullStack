import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, simulate, normalize } from '../src/calculator.js';

const finite = (r) => assert.ok([r.total, r.perPerson, r.score.points, ...r.categories.map((c) => c.litres)].every((n) => Number.isFinite(n) && n >= 0));

test('1 small efficient household', () => {
  const r = analyze({ people: 1, showerMinutes: 4, lowFlowShower: true, toiletType: 'low_flow', brushTapRunning: false, kitchenTapRunning: false, dishMethod: 'basin', hasGarden: false });
  finite(r);
  assert.ok(r.perPerson < r.benchmark.value);
  assert.ok(r.score.points >= 60);
});
test('2 average household (defaults)', () => { const r = analyze({}); finite(r); assert.equal(r.answers.people, 4); });
test('3 high usage household', () => {
  const r = analyze({ people: 5, showerMinutes: 25, brushTapRunning: true, kitchenTapRunning: true, hasGarden: true, gardenDaysPerWeek: 7, gardenMinutes: 60, gardenMethod: 'hose', loadsPerWeek: 12, washerType: 'top_loading' });
  finite(r);
  assert.equal(r.benchmark.status, 'HIGH');
  assert.ok(r.score.points < 40);
  assert.ok(r.top3.length === 3);
});
test('4 extreme values stay sane; out-of-range rejected', () => {
  const r = analyze({ people: 20, showerMinutes: 60, showersPerPerson: 5, flushesPerPerson: 15, loadsPerWeek: 30, hasGarden: true, gardenDaysPerWeek: 7, gardenMinutes: 180, washerType: 'top_loading' });
  finite(r);
  assert.ok(r.score.points >= 0 && r.score.points <= 100);
  for (const bad of [{ people: -1 }, { people: 0 }, { showerMinutes: 'abc' }, { toiletType: 'x' }, { hasGarden: 'yes' }, { loadsPerWeek: 1e9 }])
    assert.ok(normalize(bad).errors.length > 0, JSON.stringify(bad));
  assert.throws(() => analyze({ people: -3 }));
});
test('5 simulator: shower 8 -> 5 min saves 114 L/day', () => {
  const s = simulate({ people: 4, showerMinutes: 8 }, { showerMinutes: 5 });
  assert.equal(s.saving.daily, 114);
  assert.equal(s.saving.yearly, 114 * 365);
  assert.equal(s.current - s.after, 114);
  assert.equal(s.comparisons.bathtub.count, Math.round((114 * 365) / 150));
});
test('6 simulator: no changes = no saving', () => {
  const s = simulate({}, { people: 1, showerMinutes: 8 });
  assert.equal(s.saving.daily, 0);
  assert.equal(s.current, s.after);
});
test('7 categories sum to total; shares ~100', () => {
  const r = analyze({});
  assert.equal(r.categories.reduce((a, c) => a + c.litres, 0), r.total);
  assert.ok(Math.abs(r.categories.reduce((a, c) => a + c.share, 0) - 100) <= 3);
});
test('8 transparency: formulas show real inputs', () => {
  const r = analyze({ people: 2, showerMinutes: 10, showersPerPerson: 2 });
  assert.match(r.categories.find((c) => c.key === 'bathing').formula, /10 min × 9\.5 L\/min × 2 showers\/person × 2 people = 380 L\/day/);
});
test('9 recommendations consistent with top-3 combined saving', () => {
  const r = analyze({ showerMinutes: 15 });
  assert.ok(r.top3Saving.daily > 0 && r.top3Saving.yearly === r.top3Saving.daily * 365);
  assert.equal(r.biggest.key, [...r.categories].sort((a, b) => b.litres - a.litres)[0].key);
});
