CREATE TABLE user_roles (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'provider', 'admin')),
  granted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  granted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  PRIMARY KEY (user_id, role)
);

CREATE TABLE events_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL CHECK (event IN ('signup','search','contact','review','donation','ticket_open')),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('anonymous','user','provider','admin')),
  props_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(props_json)),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_events_log_event ON events_log(event);
CREATE INDEX idx_events_log_event_created ON events_log(event, created_at);

-- Backfill existing users into user_roles
INSERT OR IGNORE INTO user_roles (user_id, role, granted_at) SELECT id, role, created_at FROM users WHERE role IS NOT NULL;
