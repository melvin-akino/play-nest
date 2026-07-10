CREATE TABLE `qr_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`status` text DEFAULT 'AVAILABLE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qr_codes_code_unique` ON `qr_codes` (`code`);--> statement-breakpoint
DROP INDEX `sessions_qr_code_unique`;