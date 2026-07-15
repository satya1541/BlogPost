import { mysqlTable, int, text, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { articlesTable } from "./articles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commentsTable = mysqlTable("comments", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  articleId: int("article_id")
    .notNull()
    .references(() => articlesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertCommentSchema = createInsertSchema(commentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type CommentRow = typeof commentsTable.$inferSelect;
