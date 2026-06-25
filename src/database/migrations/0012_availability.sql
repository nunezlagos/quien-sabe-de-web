CREATE TABLE provider_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL CHECK (start_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  end_time TEXT NOT NULL CHECK (end_time GLOB '[0-2][0-9]:[0-5][0-9]'),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  CHECK (end_time > start_time)
);

CREATE UNIQUE INDEX uq_provider_availability_slot ON provider_availability(user_id, day_of_week, start_time);
CREATE INDEX idx_provider_availability_user ON provider_availability(user_id);
