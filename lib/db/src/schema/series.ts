import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seriesTable = pgTable("series", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
});

export const insertSeriesSchema = createInsertSchema(seriesTable).omit({
  id: true,
});
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type SeriesRow = typeof seriesTable.$inferSelect;
