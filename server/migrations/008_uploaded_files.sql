PRAGMA foreign_keys = ON;

-- Uploaded Files table for file upload metadata and references
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('style-reference', 'character-reference', 'audio-reference', 'text-document', 'general-reference')),
  uri TEXT, -- Files API URI for large files (>20MB)
  inline_data TEXT, -- Base64 encoded data for small files (<20MB)
  thumbnail TEXT, -- Thumbnail image data or path
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Index on project_id for efficient lookups by project
CREATE INDEX IF NOT EXISTS idx_uploaded_files_project_id ON uploaded_files(project_id);
