import { mysqlTable, int, varchar, text, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const mentorshipRequestsTable = mysqlTable("mentorship_requests", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  mentorName: varchar("mentor_name", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // "pending", "approved", "declined"
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type MentorshipRequestRow = typeof mentorshipRequestsTable.$inferSelect;
