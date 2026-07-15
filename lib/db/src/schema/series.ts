import { mysqlTable, int, varchar, text } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const seriesTable = mysqlTable("series", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image").notNull(),
});

export const insertSeriesSchema = createInsertSchema(seriesTable).omit({
  id: true,
});
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type SeriesRow = typeof seriesTable.$inferSelect;
