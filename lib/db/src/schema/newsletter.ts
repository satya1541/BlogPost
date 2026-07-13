import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsletterSubscriptionsTable = pgTable(
  "newsletter_subscriptions",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    subscribedAt: timestamp("subscribed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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
