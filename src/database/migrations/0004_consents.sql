-- 0004_consents.sql
-- HU-22.5 — consentimiento granular (Ley 19.628)
-- Las columnas inician con default 1 (consentimiento implícito en la migración)
-- para no romper registros existentes. Usuarios nuevos arrancan en NULL
-- y se setean explícitamente al aceptar el banner (HU-22.1).

ALTER TABLE users ADD COLUMN consent_email_product INTEGER DEFAULT 1;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN consent_analytics INTEGER DEFAULT 1;
--> statement-breakpoint
ALTER TABLE users ADD COLUMN consent_profile_public INTEGER DEFAULT 1;
