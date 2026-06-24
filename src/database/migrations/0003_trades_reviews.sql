CREATE TABLE `trades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`symbol` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`category` text DEFAULT 'hogar' NOT NULL,
	`description` text,
	`base_price_clp` integer,
	`image_url` text,
	`verified` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`commune_id` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trades_slug_unique` ON `trades` (`slug`);--> statement-breakpoint
CREATE INDEX `trades_user_id_idx` ON `trades` (`user_id`);--> statement-breakpoint
CREATE INDEX `trades_commune_id_idx` ON `trades` (`commune_id`);--> statement-breakpoint

CREATE TABLE `trade_communes` (
	`trade_id` integer NOT NULL,
	`commune_id` integer NOT NULL,
	PRIMARY KEY(`trade_id`, `commune_id`),
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`commune_id`) REFERENCES `communes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trade_id` integer NOT NULL,
	`reviewer_name` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`trade_id`) REFERENCES `trades`(`id`) ON UPDATE no action ON DELETE cascade
);