import {
  boolean,
  int,
  mysqlTable,
  text,
  datetime,
  varchar,
  customType,
  longtext,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const jsonText = customType<{ data: string[] }>({
  dataType() {
    return "text";
  },
  toDriver(val: string[]): string {
    return JSON.stringify(val);
  },
  fromDriver(val: unknown): string[] {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return [];
  },
});

export const articlesTable = mysqlTable("articles", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 255 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: longtext("content").notNull(),
  coverImage: text("cover_image").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  tags: jsonText("tags").notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  authorTitle: varchar("author_title", { length: 255 }).notNull(),
  authorAvatar: text("author_avatar").notNull(),
  publishedDate: datetime("published_date").notNull(),
  readingTimeMinutes: int("reading_time_minutes").notNull(),
  featured: boolean("featured").notNull().default(false),
  series: varchar("series", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  views: int("views").notNull().default(0),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type ArticleRow = typeof articlesTable.$inferSelect;
