CREATE TABLE bastion_workers (
  id TEXT PRIMARY KEY,
  bastion_id TEXT NOT NULL REFERENCES bastions(id) ON DELETE CASCADE,
  worker_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX bastion_workers_bastion_idx ON bastion_workers(bastion_id);

ALTER TABLE bastions ADD COLUMN storage_herbs INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bastions ADD COLUMN storage_crystals INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bastions ADD COLUMN storage_relics INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bastions ADD COLUMN storage_scout_reports INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bastions ADD COLUMN last_collected_at TIMESTAMP NOT NULL DEFAULT NOW();
