ALTER TABLE reviews ADD COLUMN response TEXT;
ALTER TABLE reviews ADD COLUMN responded_at INTEGER;
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN email_verification_token TEXT;
ALTER TABLE users ADD COLUMN session_token TEXT;
