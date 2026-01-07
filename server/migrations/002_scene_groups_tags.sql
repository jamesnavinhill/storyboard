-- Scene Groups
CREATE TABLE scene_groups (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  order_index INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_scene_groups_project_id ON scene_groups(project_id);

-- Scene Group Members (many-to-many, but enforcing single group per scene in application logic)
CREATE TABLE scene_group_members (
  scene_id TEXT NOT NULL,
  group_id TEXT NOT NULL,
  PRIMARY KEY (scene_id, group_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES scene_groups(id) ON DELETE CASCADE
);

CREATE INDEX idx_scene_group_members_scene_id ON scene_group_members(scene_id);
CREATE INDEX idx_scene_group_members_group_id ON scene_group_members(group_id);

-- Scene Tags
CREATE TABLE scene_tags (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, name)
);

CREATE INDEX idx_scene_tags_project_id ON scene_tags(project_id);

-- Scene Tag Assignments (many-to-many)
CREATE TABLE scene_tag_assignments (
  scene_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (scene_id, tag_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES scene_tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_scene_tag_assignments_scene_id ON scene_tag_assignments(scene_id);
CREATE INDEX idx_scene_tag_assignments_tag_id ON scene_tag_assignments(tag_id);
