ALTER TABLE `payments` ADD `voided` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` ADD `voided_reason` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `voided_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `payments` ADD `voided_at` integer;