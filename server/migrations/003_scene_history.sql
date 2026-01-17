PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS scene_history (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL,
  description TEXT NOT NULL,
  image_asset_id TEXT,
  video_asset_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (image_asset_id) REFERENCES assets(id) ON DELETE SET NULL,
  FOREIGN KEY (video_asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scene_history_scene_id ON scene_history(scene_id);
