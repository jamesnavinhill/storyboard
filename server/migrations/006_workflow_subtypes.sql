PRAGMA foreign_keys = ON;

-- Workflow Subtypes table for workflow variations with instruction modifiers
CREATE TABLE IF NOT EXISTS workflow_subtypes (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instruction_modifier TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS trg_workflow_subtypes_updated_at
AFTER UPDATE ON workflow_subtypes
FOR EACH ROW
BEGIN
  UPDATE workflow_subtypes SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Index on workflow_id for efficient lookups by workflow
CREATE INDEX IF NOT EXISTS idx_workflow_subtypes_workflow_id ON workflow_subtypes(workflow_id);
