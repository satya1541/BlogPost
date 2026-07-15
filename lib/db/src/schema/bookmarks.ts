import { mysqlTable, int, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { articlesTable } from "./articles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookmarksTable = mysqlTable("bookmarks", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  articleId: int("article_id")
    .notNull()
    .references(() => articlesTable.id, { onDelete: "cascade" }),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertBookmarkSchema = createInsertSchema(bookmarksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type BookmarkRow = typeof bookmarksTable.$inferSelect;
