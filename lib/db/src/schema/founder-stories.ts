import { mysqlTable, int, varchar, text, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const founderStoriesTable = mysqlTable("founder_stories", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(), // Q&A array stored as JSON string
  category: varchar("category", { length: 100 }).notNull(),
  intervieweeName: varchar("interviewee_name", { length: 255 }).notNull(),
  intervieweeTitle: varchar("interviewee_title", { length: 255 }).notNull(),
  intervieweeAvatar: varchar("interviewee_avatar", { length: 255 }).notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
