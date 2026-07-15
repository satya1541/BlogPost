import { mysqlTable, int, varchar, datetime, boolean } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  role: varchar("role", { length: 50 }).notNull().default("registered"), // "registered", "premium", "admin", "super_admin"
  displayName: varchar("display_name", { length: 255 }),
  age: int("age"),
  occupation: varchar("occupation", { length: 255 }),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  streakCount: int("streak_count").notNull().default(0),
  lastActiveAt: datetime("last_active_at"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: datetime("reset_token_expiry"),
  createdAt: datetime("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserRow = typeof usersTable.$inferSelect;
