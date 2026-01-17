PRAGMA foreign_keys = ON;

-- Project Documents table for document versioning and content
CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL, -- JSON string containing document content
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, version)
);

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS trg_project_documents_updated_at
AFTER UPDATE ON project_documents
FOR EACH ROW
BEGIN
  UPDATE project_documents SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Index on project_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- Composite index on project_id and version DESC for efficient version queries
CREATE INDEX IF NOT EXISTS idx_project_documents_project_version ON project_documents(project_id, version DESC);
