CREATE TABLE `weight_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`logged_date` text NOT NULL,
	`current_weight` real NOT NULL,
	`target_weight` real NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weight_logs_date` ON `weight_logs` (`logged_date`);--> statement-breakpoint
ALTER TABLE `food_logs` ADD `cooking_method` text DEFAULT 'Belirtilmedi' NOT NULL;