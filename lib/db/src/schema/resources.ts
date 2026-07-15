import { mysqlTable, int, varchar, text, boolean, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const resourcesTable = mysqlTable("resources", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'book', 'checklist', 'template', 'toolkit'
  downloadUrl: varchar("download_url", { length: 255 }).notNull(),
  isPremium: boolean("is_premium").notNull().default(false),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
