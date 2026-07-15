import { mysqlTable, int, varchar, datetime } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsletterSubscriptionsTable = mysqlTable(
  "newsletter_subscriptions",
  {
    id: int("id").primaryKey().autoincrement(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    subscribedAt: datetime("subscribed_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
);

export const insertNewsletterSubscriptionSchema = createInsertSchema(
  newsletterSubscriptionsTable,
).omit({ id: true, subscribedAt: true });
export type InsertNewsletterSubscription = z.infer<
  typeof insertNewsletterSubscriptionSchema
>;
export type NewsletterSubscriptionRow =
  typeof newsletterSubscriptionsTable.$inferSelect;
