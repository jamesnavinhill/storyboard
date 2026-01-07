PRAGMA foreign_keys = ON;

-- Workflows table for workflow definitions with system instructions
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT NOT NULL CHECK (category IN ('music-video', 'commercial', 'social', 'explainer', 'custom')),
  system_instruction TEXT NOT NULL,
  art_style TEXT,
  examples TEXT, -- JSON array string
  metadata TEXT, -- JSON object string
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS trg_workflows_updated_at
AFTER UPDATE ON workflows
FOR EACH ROW
BEGIN
  UPDATE workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Index on category for efficient filtering by category
CREATE INDEX IF NOT EXISTS idx_workflows_category ON workflows(category);
