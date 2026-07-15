import { Router, type IRouter } from "express";
import { desc, sql } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import { SearchArticlesQueryParams, SearchArticlesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const term = `%${parsed.data.q.toLowerCase()}%`;

  const rows = await db
    .select()
    .from(articlesTable)
    .where(
      sql`lower(${articlesTable.title}) like ${term}
        or lower(${articlesTable.excerpt}) like ${term}
        or lower(${articlesTable.category}) like ${term}
        or lower(${articlesTable.author}) like ${term}
        or lower(${articlesTable.tags}) like ${term}`,
    )
    .orderBy(desc(articlesTable.publishedDate))
    .limit(30);

  res.json(SearchArticlesResponse.parse(rows));
});

export default router;
