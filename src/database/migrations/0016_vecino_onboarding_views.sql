-- Migration: 0016_vecino_onboarding_views
-- Sprint C: Add onboarding fields to users, user_id to reviews, and user_views table

ALTER TABLE users ADD COLUMN commune_id INTEGER REFERENCES communes(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN interests TEXT;
ALTER TABLE users ADD COLUMN onboarded_at INTEGER;
ALTER TABLE users ADD COLUMN accepted_terms_at INTEGER;

ALTER TABLE reviews ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS user_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_user_views_user_created ON user_views(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_views_user_trade ON user_views(user_id, trade_id);
