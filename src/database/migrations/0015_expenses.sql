CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount_clp INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'otros' CHECK(category IN ('hosting','dominio','marketing','legal','herramientas','otros')),
  receipt_url TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_expenses_created ON expenses(created_at DESC);

CREATE TABLE IF NOT EXISTS monthly_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year_month TEXT NOT NULL UNIQUE,
  total_donations INTEGER NOT NULL DEFAULT 0,
  total_expenses INTEGER NOT NULL DEFAULT 0,
  pdf_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
