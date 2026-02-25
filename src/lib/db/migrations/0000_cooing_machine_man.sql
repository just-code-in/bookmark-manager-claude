CREATE TABLE `api_cost_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`operation` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`estimated_cost_usd` real NOT NULL,
	`bookmark_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`bookmark_id`) REFERENCES `bookmarks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`folder_path` text,
	`date_added` integer,
	`import_batch_id` integer NOT NULL,
	`url_status` text DEFAULT 'pending' NOT NULL,
	`redirect_url` text,
	`http_status_code` integer,
	`url_checked_at` integer,
	`url_error` text,
	`category` text,
	`tags` text,
	`summary` text,
	`triage_status` text DEFAULT 'pending' NOT NULL,
	`user_action` text DEFAULT 'unreviewed' NOT NULL,
	`embedding` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`import_batch_id`) REFERENCES `import_batches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);--> statement-breakpoint
CREATE TABLE `import_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_name` text NOT NULL,
	`imported_at` integer NOT NULL,
	`total_parsed` integer DEFAULT 0 NOT NULL,
	`total_new` integer DEFAULT 0 NOT NULL,
	`total_duplicates` integer DEFAULT 0 NOT NULL,
	`validation_status` text DEFAULT 'pending' NOT NULL,
	`validation_progress` integer DEFAULT 0 NOT NULL,
	`validation_total` integer DEFAULT 0 NOT NULL
);
