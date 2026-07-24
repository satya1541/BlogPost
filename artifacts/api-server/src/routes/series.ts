import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, seriesTable, articlesTable } from "@workspace/db";
import {
  ListSeriesResponse,
  GetSeriesParams,
  GetSeriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/series", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      name: seriesTable.name,
      slug: seriesTable.slug,
      description: seriesTable.description,
      coverImage: seriesTable.coverImage,
      articleCount: sql<number>`count(${articlesTable.id})`,
    })
    .from(seriesTable)
    .leftJoin(articlesTable, eq(articlesTable.series, seriesTable.slug))
    .groupBy(
      seriesTable.id,
      seriesTable.name,
      seriesTable.slug,
      seriesTable.description,
      seriesTable.coverImage,
    );

  res.json(ListSeriesResponse.parse(rows));
});

router.get("/series/:slug", async (req, res): Promise<void> => {
  const params = GetSeriesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [series] = await db
    .select()
    .from(seriesTable)
    .where(eq(seriesTable.slug, params.data.slug));

  if (!series) {
    res.status(404).json({ error: "Series not found" });
    return;
  }

  const articles = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.series, series.slug))
    .orderBy(desc(articlesTable.publishedDate));

  res.json(
    GetSeriesResponse.parse({
      name: series.name,
      slug: series.slug,
      description: series.description,
      coverImage: series.coverImage,
      articleCount: articles.length,
      articles,
    }),
  );
});

export default router;
