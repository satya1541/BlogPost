import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("cover_image").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  author: text("author").notNull(),
  authorTitle: text("author_title").notNull(),
  authorAvatar: text("author_avatar").notNull(),
  publishedDate: timestamp("published_date", { withTimezone: true }).notNull(),
  readingTimeMinutes: integer("reading_time_minutes").notNull(),
  featured: boolean("featured").notNull().default(false),
  series: text("series"),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type ArticleRow = typeof articlesTable.$inferSelect;
