import { mysqlTable, int, varchar, text, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { usersTable } from "./users";

export const pandaLabsTable = mysqlTable("panda_labs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  problem: text("problem").notNull(),
  solution: text("solution").notNull(),
  votes: int("votes").notNull().default(0),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export type PandaLabsIdeaRow = typeof pandaLabsTable.$inferSelect;
