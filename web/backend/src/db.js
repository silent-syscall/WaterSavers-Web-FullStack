import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const file = process.env.DB_PATH || path.resolve('data/watersavers.db');
fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
export const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// INPUT data: answers_json. CALCULATED data: the numeric columns + results_json.
db.exec(`
CREATE TABLE IF NOT EXISTS assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  household_key TEXT NOT NULL,
  is_demo INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT NOT NULL,
  daily_usage INTEGER NOT NULL,
  per_person_usage INTEGER NOT NULL,
  conservation_score INTEGER NOT NULL,
  benchmark_status TEXT NOT NULL,
  results_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assess_key ON assessments(household_key);
CREATE TABLE IF NOT EXISTS simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  changes_json TEXT NOT NULL,
  original_usage INTEGER NOT NULL,
  simulated_usage INTEGER NOT NULL,
  daily_saving INTEGER NOT NULL,
  yearly_saving INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS goals (
  assessment_id INTEGER PRIMARY KEY REFERENCES assessments(id) ON DELETE CASCADE,
  target_lpd INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS actions (
  assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  PRIMARY KEY (assessment_id, action_id)
);`);
