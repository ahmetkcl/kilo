ALTER TABLE `food_logs` ADD `amount` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `food_logs` ADD `unit` text DEFAULT 'grams' NOT NULL;--> statement-breakpoint
ALTER TABLE `food_logs` ADD `portion_label` text DEFAULT '' NOT NULL;