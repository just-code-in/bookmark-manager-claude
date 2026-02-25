import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const importBatches = sqliteTable("import_batches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileName: text("file_name").notNull(),
  importedAt: integer("imported_at", { mode: "timestamp" }).notNull(),
  totalParsed: integer("total_parsed").notNull().default(0),
  totalNew: integer("total_new").notNull().default(0),
  totalDuplicates: integer("total_duplicates").notNull().default(0),
  validationStatus: text("validation_status", {
    enum: ["pending", "in_progress", "completed"],
  })
    .notNull()
    .default("pending"),
  validationProgress: integer("validation_progress").notNull().default(0),
  validationTotal: integer("validation_total").notNull().default(0),
});

export const bookmarks = sqliteTable("bookmarks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  folderPath: text("folder_path"),
  dateAdded: integer("date_added", { mode: "timestamp" }),
  importBatchId: integer("import_batch_id")
    .notNull()
    .references(() => importBatches.id),

  // URL validation
  urlStatus: text("url_status", {
    enum: ["pending", "live", "redirected", "dead"],
  })
    .notNull()
    .default("pending"),
  redirectUrl: text("redirect_url"),
  httpStatusCode: integer("http_status_code"),
  urlCheckedAt: integer("url_checked_at", { mode: "timestamp" }),
  urlError: text("url_error"),

  // AI triage (later phases)
  category: text("category"),
  tags: text("tags"), // JSON array
  summary: text("summary"),
  triageStatus: text("triage_status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),

  // User organisation (later phases)
  userAction: text("user_action", {
    enum: ["unreviewed", "keep", "archive", "delete"],
  })
    .notNull()
    .default("unreviewed"),

  // Embedding (later phases)
  embedding: text("embedding"), // JSON array of floats

  // Metadata
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const apiCostLog = sqliteTable("api_cost_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  operation: text("operation").notNull(),
  model: text("model").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  estimatedCostUsd: real("estimated_cost_usd").notNull(),
  bookmarkId: integer("bookmark_id").references(() => bookmarks.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
