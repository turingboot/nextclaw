CREATE TABLE IF NOT EXISTS marketplace_items (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('plugin', 'skill')),
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  summary_i18n TEXT NOT NULL DEFAULT '{}',
  description TEXT,
  description_i18n TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  author TEXT NOT NULL,
  source_repo TEXT,
  homepage TEXT,
  install_kind TEXT NOT NULL,
  install_spec TEXT NOT NULL,
  install_command TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (type = 'plugin' AND install_kind = 'npm')
    OR
    (type = 'skill' AND install_kind IN ('builtin', 'marketplace'))
  )
);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_type_updated_at ON marketplace_items(type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_slug ON marketplace_items(slug);

CREATE TABLE IF NOT EXISTS marketplace_recommendation_scenes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('plugin', 'skill')),
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_recommendation_items (
  scene_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scene_id, item_id),
  FOREIGN KEY (scene_id) REFERENCES marketplace_recommendation_scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES marketplace_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_marketplace_recommendation_items_scene_order
  ON marketplace_recommendation_items(scene_id, sort_order ASC);

CREATE TABLE IF NOT EXISTS marketplace_skill_files (
  skill_item_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_b64 TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (skill_item_id, file_path),
  FOREIGN KEY (skill_item_id) REFERENCES marketplace_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_marketplace_skill_files_item ON marketplace_skill_files(skill_item_id);
