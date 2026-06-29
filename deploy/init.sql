CREATE TABLE IF NOT EXISTS `communes` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `region` varchar(100) NOT NULL DEFAULT 'Metropolitana',
  `created_at` datetime,
  UNIQUE INDEX `communes_slug_unique` (`slug`)
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL DEFAULT '',
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `avatar_url` text,
  `commune_id` int,
  `interests` text,
  `onboarded_at` datetime,
  `accepted_terms_at` datetime,
  `consent_email_product` boolean,
  `consent_analytics` boolean,
  `consent_profile_public` boolean,
  `email_verified` boolean NOT NULL DEFAULT false,
  `email_verification_token` text,
  `session_token` text,
  `created_at` datetime,
  UNIQUE INDEX `users_email_unique` (`email`),
  FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `trades` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `symbol` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `category` varchar(30) NOT NULL DEFAULT 'hogar',
  `description` text,
  `base_price_clp` int,
  `image_url` text,
  `whatsapp` varchar(50),
  `verified` boolean NOT NULL DEFAULT false,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `commune_id` int,
  `available_now` boolean NOT NULL DEFAULT false,
  `created_at` datetime,
  UNIQUE INDEX `trades_slug_unique` (`slug`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `trade_communes` (
  `trade_id` int NOT NULL,
  `commune_id` int NOT NULL,
  PRIMARY KEY (`trade_id`, `commune_id`),
  FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `reviews` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `trade_id` int NOT NULL,
  `user_id` int,
  `reviewer_name` varchar(255) NOT NULL,
  `rating` int NOT NULL,
  `body` text NOT NULL,
  `response` text,
  `responded_at` datetime,
  `created_at` datetime,
  FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `contact_events` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `trade_id` int NOT NULL,
  `visitor_id` text,
  `user_id` int,
  `event_type` varchar(20) NOT NULL,
  `created_at` datetime,
  FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `favorites` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `trade_id` int NOT NULL,
  `created_at` datetime,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `portfolio_images` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `trade_id` int NOT NULL,
  `url` text NOT NULL,
  `caption` text,
  `sort_order` int NOT NULL DEFAULT 0,
  `created_at` datetime,
  FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `admin_audit_log` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `admin_id` int NOT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(100),
  `entity_id` int,
  `details` text,
  `created_at` datetime,
  FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `updated_at` datetime,
  UNIQUE INDEX `app_settings_key_unique` (`key`)
);

CREATE TABLE IF NOT EXISTS `user_views` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `trade_id` int NOT NULL,
  `created_at` datetime,
  INDEX `idx_user_views_user_created` (`user_id`, `created_at`),
  UNIQUE INDEX `uq_user_views_user_trade` (`user_id`, `trade_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `donations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `provider` varchar(20) NOT NULL,
  `external_id` varchar(255),
  `amount_clp` int NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `payer_email` varchar(255),
  `user_id` int,
  `recurring` boolean NOT NULL DEFAULT false,
  `created_at` datetime,
  `updated_at` datetime,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` int NOT NULL,
  `role` varchar(20) NOT NULL,
  `granted_at` datetime,
  `granted_by` int,
  PRIMARY KEY (`user_id`, `role`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`granted_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `events_log` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `event` varchar(30) NOT NULL,
  `actor_role` varchar(20) NOT NULL,
  `props_json` text NOT NULL,
  `created_at` datetime,
  INDEX `idx_events_log_event` (`event`),
  INDEX `idx_events_log_event_created` (`event`, `created_at`)
);

CREATE TABLE IF NOT EXISTS `provider_availability` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `day_of_week` int NOT NULL,
  `start_time` varchar(10) NOT NULL,
  `end_time` varchar(10) NOT NULL,
  `created_at` datetime,
  UNIQUE INDEX `uq_provider_availability_slot` (`user_id`, `day_of_week`, `start_time`),
  INDEX `idx_provider_availability_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `kind` varchar(30) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'abierto',
  `assignee_admin_id` int,
  `target_provider_id` int,
  `created_by_user_id` int,
  `contact_email` varchar(255),
  `subject` varchar(255) NOT NULL,
  `created_at` datetime,
  INDEX `idx_tickets_status_created` (`status`, `created_at`),
  INDEX `idx_tickets_assignee` (`assignee_admin_id`),
  INDEX `idx_tickets_kind` (`kind`),
  INDEX `idx_tickets_user_provider` (`created_by_user_id`, `target_provider_id`, `status`),
  FOREIGN KEY (`assignee_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`target_provider_id`) REFERENCES `trades`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` int NOT NULL,
  `sender` varchar(20) NOT NULL,
  `body` text NOT NULL,
  `internal_note` boolean NOT NULL DEFAULT false,
  `created_at` datetime,
  INDEX `idx_ticket_messages_ticket_public` (`ticket_id`, `internal_note`, `created_at`),
  FOREIGN KEY (`ticket_id`) REFERENCES `tickets`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `description` varchar(255) NOT NULL,
  `amount_clp` int NOT NULL,
  `category` varchar(30) NOT NULL DEFAULT 'otros',
  `receipt_url` text,
  `created_by` int,
  `created_at` datetime,
  INDEX `idx_expenses_created` (`created_at`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS `monthly_reports` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `year_month` varchar(7) NOT NULL,
  `total_donations` int NOT NULL DEFAULT 0,
  `total_expenses` int NOT NULL DEFAULT 0,
  `pdf_url` text,
  `created_at` datetime,
  UNIQUE INDEX `monthly_reports_year_month_unique` (`year_month`)
);

CREATE TABLE IF NOT EXISTS `verification_documents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `kind` varchar(30) NOT NULL,
  `r2_key` varchar(255) NOT NULL,
  `content_type` varchar(100) NOT NULL,
  `uploaded_at` datetime,
  `created_at` datetime,
  INDEX `idx_verification_docs_user` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
