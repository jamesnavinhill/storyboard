PRAGMA foreign_keys = ON;

-- Add duration field to scenes table
-- Duration is stored in seconds, defaults to 5 seconds for existing scenes
ALTER TABLE scenes ADD COLUMN duration INTEGER DEFAULT 5;

-- Create index on duration for potential future queries
CREATE INDEX IF NOT EXISTS idx_scenes_duration ON scenes(duration);
