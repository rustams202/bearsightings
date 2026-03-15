import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// ---------------------------------------------------------------------------
// Directory setup
// ---------------------------------------------------------------------------

// SQLite database file lives in server/data/ (excluded from git)
const DATA_DIR = path.join(__dirname, '../../data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// Uploaded photos live in server/uploads/ (excluded from git)
export const UPLOADS_DIR = path.join(__dirname, '../../uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'sightings.db')

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------

const db = new Database(DB_PATH)

// WAL mode gives much better concurrent read performance
db.pragma('journal_mode = WAL')

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
// The schema is designed to support future species beyond bears, multi-state
// rollout, moderation workflows, and analytics. Column comments explain
// the intent for each field.

db.exec(`
  CREATE TABLE IF NOT EXISTS sightings (
    id              TEXT    PRIMARY KEY,

    -- When
    sighting_date   TEXT    NOT NULL,          -- ISO date: YYYY-MM-DD
    sighting_time   TEXT    NOT NULL,          -- 24h time: HH:MM

    -- Where
    town            TEXT    NOT NULL,
    state           TEXT    NOT NULL DEFAULT 'Vermont',
    latitude        REAL,                       -- decimal degrees, nullable
    longitude       REAL,                       -- decimal degrees, nullable
    location_type   TEXT    NOT NULL,           -- backyard | road | forest | trail | farm | neighborhood | campsite | other

    -- The animal (species column added for future multi-species support)
    species         TEXT    NOT NULL DEFAULT 'black_bear',
    bear_count      INTEGER NOT NULL DEFAULT 1,
    bear_type       TEXT    NOT NULL DEFAULT 'unknown', -- adult | cub | mother_with_cubs | unknown
    behaviors       TEXT    NOT NULL DEFAULT '[]',      -- JSON array of behavior strings
    distance_ft     INTEGER,                            -- approximate distance in feet

    -- Context
    human_food_present  INTEGER NOT NULL DEFAULT 0,   -- boolean (0/1)
    pets_present        INTEGER NOT NULL DEFAULT 0,   -- boolean (0/1)
    description         TEXT,                          -- free-text notes from reporter

    -- Submitter (kept separate for privacy; email is optional)
    submitter_name  TEXT    NOT NULL,
    submitter_email TEXT,
    consent_given   INTEGER NOT NULL DEFAULT 1,        -- research use consent
    photo_filename  TEXT,                              -- stored filename in /uploads

    -- Moderation / admin workflow
    status          TEXT    NOT NULL DEFAULT 'pending',   -- pending | reviewed | flagged
    reviewed_at     TEXT,                                  -- ISO datetime when reviewed
    reviewer_notes  TEXT,                                  -- internal notes from researcher
    is_duplicate    INTEGER NOT NULL DEFAULT 0,            -- flagged as likely duplicate
    duplicate_of    TEXT,                                  -- ID of original sighting if duplicate

    -- Timestamps
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- Index for common filter/sort queries
  CREATE INDEX IF NOT EXISTS idx_sightings_date     ON sightings(sighting_date);
  CREATE INDEX IF NOT EXISTS idx_sightings_town     ON sightings(town);
  CREATE INDEX IF NOT EXISTS idx_sightings_status   ON sightings(status);
  CREATE INDEX IF NOT EXISTS idx_sightings_species  ON sightings(species);
  CREATE INDEX IF NOT EXISTS idx_sightings_created  ON sightings(created_at);
`)

export default db
