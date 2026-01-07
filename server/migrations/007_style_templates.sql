PRAGMA foreign_keys = ON;

-- Style Templates table for reusable visual style definitions
CREATE TABLE IF NOT EXISTS style_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT, -- JSON array string
  style_prompt TEXT NOT NULL,
  tested INTEGER NOT NULL DEFAULT 0, -- Boolean as integer (0 = false, 1 = true)
  examples TEXT, -- JSON array string
  metadata TEXT, -- JSON object string
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS trg_style_templates_updated_at
AFTER UPDATE ON style_templates
FOR EACH ROW
BEGIN
  UPDATE style_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Index on tested column for efficient filtering by tested status
CREATE INDEX IF NOT EXISTS idx_style_templates_tested ON style_templates(tested);
