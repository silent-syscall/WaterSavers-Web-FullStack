// Centralised reference data. status: "published" = tied to a published standard/norm;
// "assumption" = typical-range planning value, NOT measured. All are estimates.
const ref = (name, value, unit, status, source, notes = '') => ({ name, value, unit, status, source, notes });
const ASSUME = 'Assumption: typical range for household estimation (not measured)';

export const REFERENCE = {
  SHOWER_FLOW: ref('Standard shower flow rate', 9.5, 'L/min', 'published', 'US federal maximum showerhead flow 2.5 gal/min (~9.5 L/min); Indian fittings vary', 'Used as a typical standard showerhead'),
  LOW_FLOW_SHOWER: ref('Low-flow shower flow rate', 7.6, 'L/min', 'published', 'US EPA WaterSense showerhead criterion 2.0 gal/min (~7.6 L/min)'),
  BUCKET_VOLUME: ref('Bucket size', 15, 'L', 'assumption', ASSUME),
  TAP_FLOW: ref('Tap flow rate', 6, 'L/min', 'assumption', 'US EPA WaterSense bathroom faucet max 1.5 gal/min (~5.7 L/min); older taps flow more'),
  BRUSHES_PER_DAY: ref('Brushing sessions per person', 2, 'per day', 'assumption', ASSUME),
  BRUSH_MIN_RUNNING: ref('Tap-open time if left running while brushing', 1, 'min', 'assumption', ASSUME),
  BRUSH_L_TAP_OFF: ref('Water per brush if tap is turned off (rinse)', 1, 'L', 'assumption', ASSUME),
  HAND_WASHES: ref('Hand washes per person', 5, 'per day', 'assumption', ASSUME),
  HAND_WASH_L: ref('Water per hand wash', 2, 'L', 'assumption', ASSUME),
  TOILET_STANDARD: ref('Standard cistern flush', 9, 'L/flush', 'assumption', 'Older cisterns commonly ~9-13 L; typical value chosen'),
  TOILET_DUAL: ref('Dual-flush average', 4.5, 'L/flush', 'assumption', 'Average of typical ~3 L / ~6 L flushes'),
  TOILET_LOW: ref('Low-flow toilet flush', 4.8, 'L/flush', 'published', 'US EPA WaterSense toilet criterion 1.28 gal/flush (~4.8 L)'),
  DISH_TAP: ref('Dishwashing under running tap', 12, 'L/person/day', 'assumption', ASSUME),
  DISH_BASIN: ref('Dishwashing in basin', 5, 'L/person/day', 'assumption', ASSUME),
  DISH_MACHINE: ref('Dishwasher (about one cycle/day)', 3.5, 'L/person/day', 'assumption', ASSUME),
  KITCHEN_TAP_EXTRA: ref('Extra water if kitchen tap often left running', 3, 'L/person/day', 'assumption', ASSUME),
  DRINK_COOK: ref('Drinking and cooking', 5, 'L/person/day', 'assumption', ASSUME),
  WASHER_TOP: ref('Top-loading washing machine', 100, 'L/load', 'assumption', 'Typical range ~90-150 L; check your machine label'),
  WASHER_FRONT: ref('Front-loading washing machine', 50, 'L/load', 'assumption', 'Typical range ~40-60 L; check your machine label'),
  LOAD_CONSOLIDATION: ref('Loads avoided by batching partial loads', 0.2, 'fraction', 'assumption', ASSUME),
  GARDEN_HOSE: ref('Hose watering', 12, 'L/min', 'assumption', ASSUME),
  GARDEN_CAN: ref('Watering can / bucket', 6, 'L/min', 'assumption', ASSUME),
  GARDEN_DRIP: ref('Drip irrigation', 4, 'L/min', 'assumption', ASSUME),
  RO_PURIFIED: ref('RO purified water consumed', 4, 'L/person/day', 'assumption', ASSUME),
  RO_REJECT_RATIO: ref('RO reject water per litre purified', 2, 'L/L', 'assumption', 'Varies widely by purifier and water TDS (roughly 1-3+)'),
  CLEANING: ref('Floor cleaning and other uses', 6, 'L/person/day', 'assumption', ASSUME),
  BENCHMARK: ref('Comparison reference', 135, 'L/person/day', 'published',
    'CPHEEO (India) urban water-supply planning norm of 135 lpcd for towns with piped sewerage. Verify against the current edition before citing.',
    'This is a supply-planning norm, not a measured household consumption target or legal limit. Configurable via BENCHMARK_LPCD.'),
};

export const COMPARISONS = {
  bathtub: { label: 'full bathtubs (150 L)', litres: 150 },
  can: { label: '20-litre drinking-water cans', litres: 20 },
  bottle: { label: '1-litre bottles', litres: 1 },
};
