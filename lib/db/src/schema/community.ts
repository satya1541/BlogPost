import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
} from "drizzle-orm/mysql-core";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const communityThreadsTable = mysqlTable("community_threads", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  userId: int("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityThreadsRelations = relations(communityThreadsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [communityThreadsTable.userId],
    references: [usersTable.id],
  }),
  posts: many(communityPostsTable),
}));

export const communityPostsTable = mysqlTable("community_posts", {
  id: serial("id").primaryKey(),
  threadId: int("thread_id").notNull(),
  userId: int("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityPostsRelations = relations(communityPostsTable, ({ one }) => ({
  thread: one(communityThreadsTable, {
    fields: [communityPostsTable.threadId],
    references: [communityThreadsTable.id],
  }),
  user: one(usersTable, {
    fields: [communityPostsTable.userId],
    references: [usersTable.id],
  }),
}));
