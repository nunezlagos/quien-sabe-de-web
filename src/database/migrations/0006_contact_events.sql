-- 0006_contact_events.sql
-- Contact events tracking (HU-08): tracks WhatsApp clicks, email clicks, etc.
-- Used for provider analytics and vecino dashboard history.

CREATE TABLE IF NOT EXISTS contact_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  visitor_id TEXT,                        -- anonymous visitor (session-based)
  user_id INTEGER REFERENCES users(id),   -- logged-in vecino (nullable)
  event_type TEXT NOT NULL CHECK(event_type IN ('whatsapp','email','phone','profile')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_contact_events_trade ON contact_events(trade_id);
CREATE INDEX idx_contact_events_user ON contact_events(user_id);
CREATE INDEX idx_contact_events_created ON contact_events(created_at);
