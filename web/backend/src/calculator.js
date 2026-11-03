import { REFERENCE as R, COMPARISONS } from './referenceData.js';

const v = (k) => R[k].value;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const SPEC = {
  people: { t: 'num', min: 1, max: 20, def: 4, int: true },
  bathMethod: { t: 'enum', vals: ['shower', 'bucket'], def: 'shower' },
  showerMinutes: { t: 'num', min: 1, max: 60, def: 8 },
  showersPerPerson: { t: 'num', min: 0, max: 5, def: 1 },
  lowFlowShower: { t: 'bool', def: false },
  bucketsPerBath: { t: 'num', min: 1, max: 6, def: 2, int: true },
  brushTapRunning: { t: 'bool', def: true },
  kitchenTapRunning: { t: 'bool', def: true },
  dishMethod: { t: 'enum', vals: ['tap_running', 'basin', 'dishwasher'], def: 'tap_running' },
  toiletType: { t: 'enum', vals: ['standard', 'dual_flush', 'low_flow'], def: 'standard' },
  flushesPerPerson: { t: 'num', min: 1, max: 15, def: 5 },
  loadsPerWeek: { t: 'num', min: 0, max: 30, def: 4 },
  fullLoads: { t: 'bool', def: true },
  washerType: { t: 'enum', vals: ['top_loading', 'front_loading'], def: 'front_loading' },
  hasGarden: { t: 'bool', def: false },
  gardenDaysPerWeek: { t: 'num', min: 0, max: 7, def: 3, int: true },
  gardenMinutes: { t: 'num', min: 1, max: 180, def: 15 },
  gardenMethod: { t: 'enum', vals: ['hose', 'can', 'drip'], def: 'hose' },
  hasRO: { t: 'bool', def: false },
  roRejectReused: { t: 'bool', def: false },
  greywaterReused: { t: 'bool', def: false },
  rainwater: { t: 'bool', def: false },
  plantsReuse: { t: 'bool', def: false },
};

/** Validate + fill defaults. Missing fields get defaults; present-but-invalid fields are errors. */
export function normalize(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const answers = {};
  const errors = [];
  for (const [k, s] of Object.entries(SPEC)) {
    const x = src[k];
    if (x === undefined || x === null || x === '') { answers[k] = s.def; continue; }
    if (s.t === 'bool') {
      if (typeof x !== 'boolean') errors.push(`${k} must be true or false`); else answers[k] = x;
    } else if (s.t === 'enum') {
      if (!s.vals.includes(x)) errors.push(`${k} must be one of: ${s.vals.join(', ')}`); else answers[k] = x;
    } else {
      const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN;
      if (!Number.isFinite(n)) errors.push(`${k} must be a number`);
      else if (n < s.min || n > s.max) errors.push(`${k} must be between ${s.min} and ${s.max}`);
      else answers[k] = s.int ? Math.round(n) : n;
    }
  }
  return { answers, errors };
}

/** Core estimate: litres/day per category, each with its formula. */
export function estimate(a) {
  const P = a.people;
  const rows = [];
  const add = (key, label, icon, litres, formula) =>
    rows.push({ key, label, icon, exact: litres, formula: `${formula} = ${Math.round(litres)} L/day` });

  if (a.bathMethod === 'bucket') {
    const b = v('BUCKET_VOLUME');
    add('bathing', 'Bathing', '🚿', a.bucketsPerBath * b * a.showersPerPerson * P,
      `${a.bucketsPerBath} buckets × ${b} L × ${a.showersPerPerson} baths/person × ${P} people`);
  } else {
    const rate = a.lowFlowShower ? v('LOW_FLOW_SHOWER') : v('SHOWER_FLOW');
    add('bathing', 'Bathing', '🚿', rate * a.showerMinutes * a.showersPerPerson * P,
      `${a.showerMinutes} min × ${rate} L/min × ${a.showersPerPerson} showers/person × ${P} people`);
  }
  const flush = { standard: v('TOILET_STANDARD'), dual_flush: v('TOILET_DUAL'), low_flow: v('TOILET_LOW') }[a.toiletType];
  add('toilet', 'Toilet', '🚽', a.flushesPerPerson * flush * P, `${a.flushesPerPerson} flushes × ${flush} L × ${P} people`);

  const perBrush = a.brushTapRunning ? v('BRUSH_MIN_RUNNING') * v('TAP_FLOW') : v('BRUSH_L_TAP_OFF');
  add('taps', 'Brushing & hand washing', '🚰', (v('BRUSHES_PER_DAY') * perBrush + v('HAND_WASHES') * v('HAND_WASH_L')) * P,
    `(${v('BRUSHES_PER_DAY')} brushes × ${perBrush} L + ${v('HAND_WASHES')} hand washes × ${v('HAND_WASH_L')} L) × ${P} people`);

  const dishRate = { tap_running: v('DISH_TAP'), basin: v('DISH_BASIN'), dishwasher: v('DISH_MACHINE') }[a.dishMethod];
  const extra = a.kitchenTapRunning ? v('KITCHEN_TAP_EXTRA') : 0;
  add('kitchen', 'Kitchen, drinking & cooking', '🍳', (dishRate + extra + v('DRINK_COOK')) * P,
    `(${dishRate} dishes + ${extra} tap + ${v('DRINK_COOK')} drink/cook L) × ${P} people`);

  const perLoad = a.washerType === 'top_loading' ? v('WASHER_TOP') : v('WASHER_FRONT');
  add('laundry', 'Laundry', '🧺', (a.loadsPerWeek * perLoad) / 7, `${a.loadsPerWeek} loads/week × ${perLoad} L ÷ 7`);

  if (a.hasGarden) {
    const rate = { hose: v('GARDEN_HOSE'), can: v('GARDEN_CAN'), drip: v('GARDEN_DRIP') }[a.gardenMethod];
    add('garden', 'Garden', '🌱', (a.gardenDaysPerWeek * a.gardenMinutes * rate) / 7,
      `${a.gardenDaysPerWeek} days/week × ${a.gardenMinutes} min × ${rate} L/min ÷ 7`);
  } else add('garden', 'Garden', '🌱', 0, 'No garden');

  const ro = a.hasRO && !a.roRejectReused ? v('RO_PURIFIED') * v('RO_REJECT_RATIO') * P : 0;
  add('other', 'Cleaning & other', '🧹', v('CLEANING') * P + ro, `${v('CLEANING')} L cleaning × ${P} people + RO reject ${ro} L`);

  const categories = rows.map((x) => ({ key: x.key, label: x.label, icon: x.icon, litres: Math.round(x.exact), formula: x.formula }));
  const total = categories.reduce((s, x) => s + x.litres, 0);
  categories.forEach((x) => (x.share = total ? Math.round((x.litres / total) * 100) : 0));
  return { categories, total, perPerson: Math.round(total / P) };
}

export function benchmarkInfo(perPerson) {
  const env = Number(process.env.BENCHMARK_LPCD);
  const value = env > 0 ? env : v('BENCHMARK');
  const ratio = perPerson / value;
  const status = ratio <= 1 ? 'WITHIN REFERENCE' : ratio <= 1.25 ? 'SLIGHTLY HIGH' : 'HIGH';
  return { value, ratio: Math.round(ratio * 100) / 100, status, note: R.BENCHMARK.notes };
}

const LEVELS = [[80, 'Excellent'], [60, 'Good'], [40, 'Needs Improvement'], [20, 'Poor'], [0, 'Critical']];

/** Score = up to 60 pts from usage vs reference + 5 pts for each of 8 habits. */
export function conservationScore(a, perPerson) {
  const bm = benchmarkInfo(perPerson).value;
  const usagePts = clamp((60 * (2 - perPerson / bm)) / 1.4, 0, 60); // full at <=0.6x ref, zero at >=2x ref
  const habits = [
    { good: 'Short showers, low-flow head or bucket bathing', bad: 'Long showers with a standard showerhead', ok: a.bathMethod === 'bucket' || a.lowFlowShower || a.showerMinutes <= 6 },
    { good: 'Tap turned off while brushing', bad: 'Tap left running while brushing', ok: !a.brushTapRunning },
    { good: 'Kitchen tap not left running', bad: 'Kitchen tap left running / dishes under running tap', ok: !a.kitchenTapRunning && a.dishMethod !== 'tap_running' },
    { good: 'Efficient toilet flush', bad: 'Standard high-volume flush', ok: a.toiletType !== 'standard' },
    { good: 'Full washing-machine loads', bad: 'Partial washing-machine loads', ok: a.fullLoads || a.loadsPerWeek === 0 },
    { good: 'Efficient garden watering (or no garden)', bad: 'Frequent or hose-based garden watering', ok: !a.hasGarden || a.gardenMethod === 'drip' || (a.gardenDaysPerWeek <= 3 && a.gardenMinutes <= 15) },
    { good: 'RO reject water reused (or no RO)', bad: 'RO reject water drained', ok: !a.hasRO || a.roRejectReused },
    { good: 'Greywater / rainwater / plant reuse', bad: 'No water reuse at home', ok: a.greywaterReused || a.rainwater || a.plantsReuse },
  ];
  const okCount = habits.filter((h) => h.ok).length;
  const points = Math.round(clamp(usagePts + 5 * okCount, 0, 100));
  return {
    points, level: LEVELS.find(([min]) => points >= min)[1], usagePoints: Math.round(usagePts), habitPoints: 5 * okCount,
    strengths: habits.filter((h) => h.ok).map((h) => h.good), improvements: habits.filter((h) => !h.ok).map((h) => h.bad),
  };
}

const RULES = [
  (a) => a.bathMethod === 'shower' && a.showerMinutes > 6 && { id: 'shorter_shower', icon: '🚿', title: 'Shorten your showers', difficulty: 'Easy',
    problem: `You shower for about ${a.showerMinutes} minutes.`, action: `Aim for ${Math.max(5, a.showerMinutes - 5)} minutes (a shower timer helps).`, changes: { showerMinutes: Math.max(5, a.showerMinutes - 5) } },
  (a) => a.bathMethod === 'shower' && !a.lowFlowShower && { id: 'low_flow_head', icon: '🚿', title: 'Fit a low-flow showerhead', difficulty: 'Medium',
    problem: 'Your showerhead uses a standard flow rate.', action: 'Install a low-flow showerhead (about 7.6 L/min or less).', changes: { lowFlowShower: true } },
  (a) => a.brushTapRunning && { id: 'tap_off_brushing', icon: '🪥', title: 'Turn off the tap while brushing', difficulty: 'Easy',
    problem: 'The tap runs while you brush.', action: 'Wet the brush, turn the tap off, rinse with a mug.', changes: { brushTapRunning: false } },
  (a) => a.kitchenTapRunning && { id: 'kitchen_tap', icon: '🍳', title: 'Stop leaving the kitchen tap running', difficulty: 'Easy',
    problem: 'The kitchen tap is often left running.', action: 'Wash vegetables in a bowl and reuse that water for plants.', changes: { kitchenTapRunning: false } },
  (a) => a.dishMethod === 'tap_running' && { id: 'basin_dishes', icon: '🍽️', title: 'Wash dishes in a basin', difficulty: 'Easy',
    problem: 'You wash dishes under a running tap.', action: 'Soak and scrub in a basin, then rinse briefly.', changes: { dishMethod: 'basin' } },
  (a) => a.toiletType === 'standard' && { id: 'dual_flush', icon: '🚽', title: 'Upgrade to a dual-flush system', difficulty: 'Medium',
    problem: 'You have a standard high-volume flush.', action: 'Fit a dual-flush cistern or conversion kit.', changes: { toiletType: 'dual_flush' } },
  (a) => !a.fullLoads && a.loadsPerWeek > 1 && { id: 'full_loads', icon: '🧺', title: 'Run only full laundry loads', difficulty: 'Easy',
    problem: 'You often wash partial loads.', action: 'Batch clothes so each wash is a full load.', changes: { loadsPerWeek: Math.max(1, Math.ceil(a.loadsPerWeek * (1 - v('LOAD_CONSOLIDATION')))) } },
  (a) => a.hasGarden && a.gardenMethod === 'hose' && { id: 'drip_garden', icon: '🌱', title: 'Water with drip or a can, not a hose', difficulty: 'Medium',
    problem: 'You water the garden with a hose.', action: 'Switch to drip irrigation and water in the early morning or evening to cut evaporation.', changes: { gardenMethod: 'drip' } },
  (a) => a.hasGarden && a.gardenDaysPerWeek > 3 && { id: 'less_watering', icon: '🌱', title: 'Water the garden fewer days a week', difficulty: 'Easy',
    problem: `You water ${a.gardenDaysPerWeek} days a week.`, action: 'Water deeply on fewer days, in cooler hours.', changes: { gardenDaysPerWeek: Math.max(2, a.gardenDaysPerWeek - 2) } },
  (a) => a.hasRO && !a.roRejectReused && { id: 'reuse_ro', icon: '♻️', title: 'Reuse RO reject water', difficulty: 'Easy',
    problem: 'RO reject water goes down the drain.', action: 'Collect it for mopping, cleaning or watering non-edible plants.', changes: { roRejectReused: true } },
];

const FILLERS = [
  { id: 'leak_check', icon: '🚽', title: 'Check toilets and taps for leaks', action: 'Add food colour to the cistern; if colour reaches the bowl without flushing, it leaks.' },
  { id: 'tank_check', icon: '🛢️', title: 'Check your water tank float valve', action: 'Make sure the tank does not overflow when filling.' },
  { id: 'review', icon: '💧', title: 'Review your progress', action: 'Retake the assessment and compare with your first result.' },
];

function applyChanges(a, changes) {
  const { answers, errors } = normalize({ ...a, ...changes });
  if (errors.length) throw Object.assign(new Error(errors.join('; ')), { status: 400, expose: true });
  return answers;
}
const savingBlock = (daily) => ({ daily, monthly: daily * 30, yearly: daily * 365 });

/** Full analysis of one household. */
export function analyze(raw) {
  const { answers: a, errors } = normalize(raw);
  if (errors.length) throw Object.assign(new Error(errors.join('; ')), { status: 400, expose: true });
  const est = estimate(a);

  const recommendations = RULES.map((rule) => rule(a)).filter(Boolean).map((rec) => {
    const daily = Math.max(0, est.total - estimate(applyChanges(a, rec.changes)).total);
    return { ...rec, saving: savingBlock(daily), impact: daily >= 15 ? 'High' : daily >= 6 ? 'Medium' : 'Low' };
  }).filter((x) => x.saving.daily > 0).sort((x, y) => y.saving.daily - x.saving.daily);

  const top3 = recommendations.slice(0, 3);
  const top3Changes = Object.assign({}, ...top3.map((t) => t.changes));
  const top3Saving = savingBlock(top3.length ? Math.max(0, est.total - estimate(applyChanges(a, top3Changes)).total) : 0);

  const b = [...est.categories].sort((x, y) => y.litres - x.litres)[0];
  const plan = [...recommendations.slice(0, 5), ...FILLERS].slice(0, 7)
    .map((p, i) => ({ day: i + 1, id: p.id, icon: p.icon, title: p.title, action: p.action }));

  return {
    answers: a, categories: est.categories, total: est.total, perPerson: est.perPerson,
    benchmark: benchmarkInfo(est.perPerson), score: conservationScore(a, est.perPerson),
    biggest: { key: b.key, label: b.label, icon: b.icon, litres: b.litres, share: b.share },
    recommendations, top3, top3Changes, top3Saving, plan,
  };
}

const SIM_KEYS = ['showerMinutes', 'brushTapRunning', 'kitchenTapRunning', 'gardenDaysPerWeek', 'loadsPerWeek'];

/** What-if: apply habit changes to saved answers and recompute. */
export function simulate(rawAnswers, changes) {
  const base = normalize(rawAnswers);
  if (base.errors.length) throw Object.assign(new Error(base.errors.join('; ')), { status: 400, expose: true });
  const picked = {};
  for (const k of SIM_KEYS) if (changes && Object.prototype.hasOwnProperty.call(changes, k)) picked[k] = changes[k];
  const before = estimate(base.answers);
  const after = estimate(applyChanges(base.answers, picked));
  const s = savingBlock(Math.max(0, before.total - after.total));
  return {
    changes: picked, current: before.total, after: after.total, perPersonCurrent: before.perPerson, perPersonAfter: after.perPerson,
    saving: s, afterCategories: after.categories,
    comparisons: Object.fromEntries(Object.entries(COMPARISONS).map(([k, c]) => [k, { label: c.label, count: Math.round(s.yearly / c.litres) }])),
  };
}
