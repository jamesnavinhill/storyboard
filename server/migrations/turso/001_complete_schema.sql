-- Turso/SQLite Complete Schema Migration
-- This file contains all tables required for the Storyboard application
-- Compatible with Turso (libSQL/SQLite)

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  description TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  duration REAL,
  primary_image_asset_id TEXT,
  primary_video_asset_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scene_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'attachment')),
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  checksum TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_scene_id ON assets(scene_id);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  scene_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  text TEXT NOT NULL,
  image_asset_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE SET NULL,
  FOREIGN KEY (image_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  project_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Scene Groups
CREATE TABLE IF NOT EXISTS scene_groups (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  order_index INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scene_groups_project_id ON scene_groups(project_id);

-- Scene Group Members
CREATE TABLE IF NOT EXISTS scene_group_members (
  scene_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  PRIMARY KEY (scene_id, group_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES scene_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scene_group_members_scene_id ON scene_group_members(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_group_members_group_id ON scene_group_members(group_id);

-- Scene Tags
CREATE TABLE IF NOT EXISTS scene_tags (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_scene_tags_project_id ON scene_tags(project_id);

-- Scene Tag Assignments
CREATE TABLE IF NOT EXISTS scene_tag_assignments (
  scene_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (scene_id, tag_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES scene_tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scene_tag_assignments_scene_id ON scene_tag_assignments(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_tag_assignments_tag_id ON scene_tag_assignments(tag_id);

-- Scene History
CREATE TABLE IF NOT EXISTS scene_history (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  description TEXT NOT NULL,
  asset_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scene_history_scene_id ON scene_history(scene_id);

-- Project Documents
CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, doc_type)
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('storyboarding', 'asset_generation', 'iteration', 'custom', 'concept_art')),
  subtype TEXT,
  entry_point TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Style Templates
CREATE TABLE IF NOT EXISTS style_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  style_direction TEXT NOT NULL,
  mood TEXT,
  color_palette TEXT,
  lighting TEXT,
  camera_angles TEXT,
  image_prompt_suffix TEXT,
  animation_prompt_suffix TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_style_templates_category ON style_templates(category);

-- Uploaded Files
CREATE TABLE IF NOT EXISTS uploaded_files (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('style-reference', 'character-reference', 'audio-reference', 'text-document', 'general-reference')),
  uri TEXT,
  inline_data TEXT,
  thumbnail TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_project_id ON uploaded_files(project_id);
