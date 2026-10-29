CREATE TABLE profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  email TEXT,
  github_url TEXT,
  links_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

INSERT INTO profile (id, name, updated_at)
VALUES (1, '이름을 입력하세요', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));

CREATE TABLE works (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  description_html TEXT NOT NULL,
  fields_json TEXT NOT NULL DEFAULT '[]',
  techs_json TEXT NOT NULL DEFAULT '[]',
  links_json TEXT NOT NULL DEFAULT '[]',
  competition TEXT,
  organizer TEXT,
  participated_on TEXT,
  period_start TEXT,
  period_end TEXT,
  award TEXT,
  team_type TEXT CHECK (team_type IN ('solo', 'team')),
  team_size INTEGER,
  role TEXT,
  is_public INTEGER NOT NULL DEFAULT 0 CHECK (is_public IN (0, 1)),
  is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX works_public_idx ON works (is_public);

CREATE TABLE files (
  id TEXT PRIMARY KEY,
  work_id TEXT REFERENCES works (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('cover', 'gallery', 'attachment', 'avatar')),
  r2_key TEXT NOT NULL,
  thumb_r2_key TEXT,
  original_name TEXT NOT NULL,
  relative_path TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'uploading' CHECK (status IN ('uploading', 'complete')),
  upload_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX files_work_idx ON files (work_id, kind, sort_order);

CREATE TABLE login_attempts (
  ip TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);
