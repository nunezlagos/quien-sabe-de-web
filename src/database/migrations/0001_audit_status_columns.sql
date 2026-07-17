-- migration: 0001_audit_status_columns
-- author: nunezlagos
-- description: uniforma columnas de auditoría (created_at, updated_at) y agrega status TINYINT(0-9, default 1) donde no existía
-- breaking: no (columnas nuevas con default; status de texto existentes se conservan)
-- duration: <1s (tablas chicas de demo)

ALTER TABLE `users` ADD COLUMN `updated_at` datetime;

ALTER TABLE `communes` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `communes` ADD COLUMN `updated_at` datetime;

ALTER TABLE `trades` ADD COLUMN `updated_at` datetime;

ALTER TABLE `trade_communes` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `trade_communes` ADD COLUMN `created_at` datetime;
ALTER TABLE `trade_communes` ADD COLUMN `updated_at` datetime;

ALTER TABLE `reviews` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `reviews` ADD COLUMN `updated_at` datetime;

ALTER TABLE `contact_events` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `contact_events` ADD COLUMN `updated_at` datetime;

ALTER TABLE `favorites` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `favorites` ADD COLUMN `updated_at` datetime;

ALTER TABLE `portfolio_images` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `portfolio_images` ADD COLUMN `updated_at` datetime;

ALTER TABLE `admin_audit_log` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `admin_audit_log` ADD COLUMN `updated_at` datetime;

ALTER TABLE `app_settings` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `app_settings` ADD COLUMN `created_at` datetime;

ALTER TABLE `user_views` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `user_views` ADD COLUMN `updated_at` datetime;

ALTER TABLE `user_roles` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `user_roles` ADD COLUMN `created_at` datetime;
ALTER TABLE `user_roles` ADD COLUMN `updated_at` datetime;

ALTER TABLE `events_log` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `events_log` ADD COLUMN `updated_at` datetime;

ALTER TABLE `provider_availability` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `provider_availability` ADD COLUMN `updated_at` datetime;

ALTER TABLE `tickets` ADD COLUMN `updated_at` datetime;

ALTER TABLE `ticket_messages` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `ticket_messages` ADD COLUMN `updated_at` datetime;

ALTER TABLE `expenses` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `expenses` ADD COLUMN `updated_at` datetime;

ALTER TABLE `monthly_reports` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `monthly_reports` ADD COLUMN `updated_at` datetime;

ALTER TABLE `verification_documents` ADD COLUMN `status` tinyint NOT NULL DEFAULT 1;
ALTER TABLE `verification_documents` ADD COLUMN `updated_at` datetime;
