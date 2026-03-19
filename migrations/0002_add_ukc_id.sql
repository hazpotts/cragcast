-- Add UKC crag ID for direct crag page links
ALTER TABLE crags ADD COLUMN ukc_id TEXT;
CREATE INDEX IF NOT EXISTS idx_crags_ukc ON crags(ukc_id);
