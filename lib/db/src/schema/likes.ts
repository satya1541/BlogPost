import { mysqlTable, int, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";
import { articlesTable } from "./articles";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const likesTable = mysqlTable("likes", {
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

export const insertLikeSchema = createInsertSchema(likesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type LikeRow = typeof likesTable.$inferSelect;
