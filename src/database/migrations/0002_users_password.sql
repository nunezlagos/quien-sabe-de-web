-- Migración 0002: agregar columna password_hash a users para MVP de autenticación.
-- DEFAULT '' permite aplicar la migración sobre tablas con filas legacy; el helper
-- `verificarContrasena` retorna false ante cualquier hash que no cumpla el formato
-- `pbkdf2$<iter>$<saltB64>$<hashB64>`, bloqueando login hasta backfill (post-MVP).

ALTER TABLE `users` ADD COLUMN `password_hash` TEXT NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE `users` ADD COLUMN `status` TEXT NOT NULL DEFAULT 'active';