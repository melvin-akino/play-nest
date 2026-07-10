CREATE TABLE `booking_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`method` text NOT NULL,
	`received_by` text NOT NULL,
	`paid_at` integer DEFAULT (unixepoch()) NOT NULL,
	`voided` integer DEFAULT false NOT NULL,
	`voided_reason` text,
	`voided_by` text,
	`voided_at` integer,
	FOREIGN KEY (`booking_id`) REFERENCES `venue_bookings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voided_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `venue_packages` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`pricing_type` text NOT NULL,
	`amount` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `venue_bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`package_id` text,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`event_name` text,
	`scheduled_start` integer NOT NULL,
	`scheduled_end` integer NOT NULL,
	`actual_start` integer,
	`actual_end` integer,
	`guest_count_estimate` integer,
	`pricing_type` text NOT NULL,
	`total_amount` integer NOT NULL,
	`exclusive` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'RESERVED' NOT NULL,
	`cancel_reason` text,
	`cancelled_by` text,
	`cancelled_at` integer,
	`notes` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`package_id`) REFERENCES `venue_packages`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
