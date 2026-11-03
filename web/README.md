# WaterSavers — Web Application

A full-stack household water-conservation tool built alongside the original
WaterSavers Android project. The web app is India-focused, simulator-driven,
and does not require an external water-data API.

## Architecture

```
React (Vite)  →  Express REST API  →  SQLite (better-sqlite3)
  :5173              :3001                data/watersavers.db
```

## Quick start

```bash
# 1. Backend
cd web/backend
cp .env.example .env        # edit PORT / BENCHMARK_LPCD if needed
npm install
npm run dev                 # http://localhost:3001

# 2. Frontend (separate terminal)
cd web/frontend
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173

To run the backend tests:
```bash
cd web/backend
npm test
```

## Data strategy

The app uses three layers — no live water-consumption API exists or is faked:

| Layer | What it is |
|---|---|
| **User data** | Questionnaire answers (shower duration, toilet type, etc.) |
| **Reference constants** | Documented flow-rate values (e.g. 9.5 L/min for a standard showerhead, based on the US 2.5 gal/min federal limit) |
| **Generated data** | Backend-calculated estimates, scores, recommendations and simulations |

All results are clearly labelled **Estimated Water Usage** — not measured consumption.

## Reference constant sources

| Constant | Value | Source |
|---|---|---|
| Standard showerhead | 9.5 L/min | US federal 2.5 gal/min limit (typical planning value; Indian fittings vary) |
| Low-flow showerhead | 7.6 L/min | US EPA WaterSense criterion (2.0 gal/min) |
| Low-flow toilet | 4.8 L/flush | US EPA WaterSense criterion (1.28 gal/flush) |
| Benchmark | 135 L/person/day | CPHEEO urban water-supply planning norm for towns with piped sewerage. This is a supply-planning norm, not a mandatory consumption target. Configurable via `BENCHMARK_LPCD`. |
| Other constants | see backend | Labelled "assumption" where no published source was found |

## Features

- 7-step household questionnaire (no huge single-page form)
- Calculation engine with per-category formulas (transparent, viva-ready)
- Conservation score 0–100 with strengths and areas to improve
- Benchmark comparison (CPHEEO 135 lpcd, configurable)
- Biggest water-waster identification
- Personalised rule-based recommendations with estimated savings
- **Water Savings Simulator** — live "what if I changed just 3 habits?" controls
- Yearly saving in litres + relatable comparisons (bathtubs, 20-litre cans)
- Savings goal (10 / 20 / 30 / 50 L/day)
- 7-day action plan with progress checkboxes
- Progress/history dashboard with chart
- Demo Household mode (clearly labelled)
- SDG 6 section

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | /api/assessment | Save answers + run analysis |
| GET | /api/assessment/:id | Retrieve saved assessment |
| POST | /api/calculate | Stateless preview (not saved) |
| POST | /api/simulation | What-if simulation (optionally saved) |
| PUT | /api/assessment/:id/goal | Set savings goal |
| PUT | /api/assessment/:id/actions/:actionId | Mark plan action done |
| GET | /api/progress/:key | Progress history for a household |
| GET | /api/demo | Demo household data |
| GET | /api/reference | All reference constants |

## Database tables

| Table | Stores |
|---|---|
| assessments | INPUT answers_json + CALCULATED results_json, scores, usage |
| simulations | Saved what-if simulations |
| goals | Per-assessment savings target |
| actions | 7-day plan completion state |

## Calculation method

```
Shower: duration_min × flow_rate_L_per_min × showers_per_person × people
Toilet: flushes_per_person × litres_per_flush × people
Laundry: loads_per_week × litres_per_load ÷ 7
Garden: days_per_week × minutes × flow_rate ÷ 7
...sum all categories = daily household usage
per-person = household total ÷ household size
```

Score = up to 60 points from usage vs reference + 5 points per good habit (8 habits checked).

## Limitations

- All figures are estimates from user-reported behaviour, not meter readings.
- Reference constants are planning values, not measured for each household.
- The benchmark (135 lpcd) is a supply-planning norm, not a legal limit.

## Future scope (not yet built)

- Smart water-meter integration
- IoT flow sensor support
- Municipal water-consumption data
- Regional benchmarks by city/state
- Weather-based garden-watering estimation
- Leak detection alerts

The Android project (original WaterSavers) is kept untouched in the repo root.
