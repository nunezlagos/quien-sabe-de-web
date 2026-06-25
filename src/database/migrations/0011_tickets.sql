CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('suplantacion','mal_servicio','contenido','consulta')),
  status TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto','en_revision','cerrado')),
  assignee_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_provider_id INTEGER REFERENCES trades(id) ON DELETE CASCADE,
  created_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  contact_email TEXT,
  subject TEXT NOT NULL CHECK (length(subject) BETWEEN 5 AND 150),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('author','admin','system')),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  internal_note INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_tickets_status_created ON tickets(status, created_at);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_admin_id);
CREATE INDEX idx_tickets_kind ON tickets(kind);
CREATE INDEX idx_tickets_user_provider ON tickets(created_by_user_id, target_provider_id, status);
CREATE INDEX idx_ticket_messages_ticket_public ON ticket_messages(ticket_id, internal_note, created_at);
