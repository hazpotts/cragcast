-- Crags table: stores climbing crag data imported from OpenBeta
CREATE TABLE IF NOT EXISTS crags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  aspect TEXT,
  rock TEXT DEFAULT '[]',
  trad REAL DEFAULT 0,
  sport REAL DEFAULT 0,
  boulder REAL DEFAULT 0,
  route_count INTEGER DEFAULT 0,
  tags TEXT DEFAULT '[]',
  openbeta_id TEXT,
  source TEXT DEFAULT 'openbeta',
  imported_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_crags_region ON crags(region_id);
CREATE INDEX IF NOT EXISTS idx_crags_openbeta ON crags(openbeta_id);

-- Import log: tracks import runs for monitoring and scheduling
CREATE TABLE IF NOT EXISTS import_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  status TEXT DEFAULT 'running',
  crags_imported INTEGER DEFAULT 0,
  crags_updated INTEGER DEFAULT 0,
  errors TEXT DEFAULT '[]',
  source TEXT DEFAULT 'openbeta'
);
