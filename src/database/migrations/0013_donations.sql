CREATE TABLE donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'webpay')),
  external_id TEXT UNIQUE,
  amount_clp INTEGER NOT NULL CHECK (amount_clp BETWEEN 1000 AND 5000000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'abandoned')),
  payer_email TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recurring INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE webhook_events_processed (
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  processed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (provider, external_id)
);

CREATE INDEX idx_donations_user ON donations(user_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_created ON donations(created_at);
