import { mysqlTable, int, varchar, text, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { articlesTable } from "./articles";

export const analyticsEventsTable = mysqlTable("analytics_events", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  articleId: int("article_id").references(() => articlesTable.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(), // "page_view", "scroll_depth", "read_complete", "newsletter_convert"
  metadata: text("metadata"), // JSON string: { scrollPercent, timeOnPage, referrer, etc. }
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type AnalyticsEventRow = typeof analyticsEventsTable.$inferSelect;
