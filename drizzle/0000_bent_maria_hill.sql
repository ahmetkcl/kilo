CREATE TABLE `activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`logged_date` text NOT NULL,
	`activity_name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`calories` real NOT NULL,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_activity_logs_date` ON `activity_logs` (`logged_date`);--> statement-breakpoint
CREATE TABLE `food_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`logged_date` text NOT NULL,
	`food_id` text NOT NULL,
	`food_name` text NOT NULL,
	`grams` real NOT NULL,
	`calories` real NOT NULL,
	`protein` real NOT NULL,
	`carbs` real NOT NULL,
	`fat` real NOT NULL,
	`created_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_food_logs_date` ON `food_logs` (`logged_date`);--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`weight_kg` real DEFAULT 118 NOT NULL,
	`height_cm` real DEFAULT 185 NOT NULL,
	`age` integer DEFAULT 30 NOT NULL,
	`sex` text DEFAULT 'male' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
