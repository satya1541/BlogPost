import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import { ListTopicsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/topics", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      name: articlesTable.category,
      articleCount: sql<number>`count(*)::int`,
    })
    .from(articlesTable)
    .groupBy(articlesTable.category)
    .orderBy(sql`count(*) desc`);

  const topics = rows.map((row) => ({
    name: row.name,
    slug: row.name.toLowerCase().replace(/\s+/g, "-"),
    articleCount: row.articleCount,
  }));

  res.json(ListTopicsResponse.parse(topics));
});

export default router;
