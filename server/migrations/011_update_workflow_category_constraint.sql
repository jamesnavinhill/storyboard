PRAGMA foreign_keys = OFF;

-- Create new workflows table with updated CHECK constraint
CREATE TABLE workflows_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  category TEXT NOT NULL CHECK (category IN ('music-video', 'commercial', 'social', 'explainer', 'custom', 'concept-art')),
  system_instruction TEXT NOT NULL,
  art_style TEXT,
  examples TEXT, -- JSON array string
  metadata TEXT, -- JSON object string
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table to new table
INSERT INTO workflows_new SELECT * FROM workflows;

-- Drop old table
DROP TABLE workflows;

-- Rename new table to original name
ALTER TABLE workflows_new RENAME TO workflows;

-- Recreate trigger
CREATE TRIGGER trg_workflows_updated_at
AFTER UPDATE ON workflows
FOR EACH ROW
BEGIN
  UPDATE workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Recreate index
CREATE INDEX idx_workflows_category ON workflows(category);

PRAGMA foreign_keys = ON;
