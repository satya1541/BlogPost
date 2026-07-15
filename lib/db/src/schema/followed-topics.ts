import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const followedTopicsTable = mysqlTable("followed_topics", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  topicSlug: varchar("topic_slug", { length: 255 }).notNull(),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type FollowedTopicRow = typeof followedTopicsTable.$inferSelect;
