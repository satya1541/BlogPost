import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, articlesTable } from "@workspace/db";
import {
  ListArticlesQueryParams,
  ListArticlesResponse,
  GetArticleParams,
  GetArticleResponse,
  ListRelatedArticlesParams,
  ListRelatedArticlesResponse,
  GetFeaturedArticleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/articles", async (req, res): Promise<void> => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, series, tag, featured, sort, limit } = parsed.data;

  const conditions = [];
  if (category) {
    // Accept either the exact category name or its slug form (lowercase, hyphenated).
    conditions.push(
      sql`lower(regexp_replace(${articlesTable.category}, '\\s+', '-', 'g')) = lower(regexp_replace(${category}, '\\s+', '-', 'g'))`,
    );
  }
  if (series) {
    conditions.push(
      sql`lower(regexp_replace(${articlesTable.series}, '\\s+', '-', 'g')) = lower(regexp_replace(${series}, '\\s+', '-', 'g'))`,
    );
  }
  if (featured !== undefined) conditions.push(eq(articlesTable.featured, featured));
  if (tag) {
    conditions.push(sql`${tag} = ANY(${articlesTable.tags})`);
  }

  const orderBy =
    sort === "oldest"
      ? [articlesTable.publishedDate]
      : sort === "popular"
        ? [desc(articlesTable.views)]
        : [desc(articlesTable.publishedDate)];

  const query = db
    .select()
    .from(articlesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy);

  const rows = limit ? await query.limit(limit) : await query;

  res.json(ListArticlesResponse.parse(rows));
});

router.get("/articles/:slug/related", async (req, res): Promise<void> => {
  const params = ListRelatedArticlesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, params.data.slug));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const related = await db
    .select()
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.category, article.category),
        sql`${articlesTable.slug} != ${article.slug}`,
      ),
    )
    .orderBy(desc(articlesTable.publishedDate))
    .limit(3);

  res.json(ListRelatedArticlesResponse.parse(related));
});

router.get("/articles/:slug", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, params.data.slug));

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  await db
    .update(articlesTable)
    .set({ views: article.views + 1 })
    .where(eq(articlesTable.id, article.id));

  res.json(GetArticleResponse.parse({ ...article, views: article.views + 1 }));
});

router.get("/home/featured", async (_req, res): Promise<void> => {
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.featured, true))
    .orderBy(desc(articlesTable.publishedDate))
    .limit(1);

  if (!article) {
    const [fallback] = await db
      .select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.publishedDate))
      .limit(1);
    if (!fallback) {
      res.status(404).json({ error: "No articles available" });
      return;
    }
    res.json(GetFeaturedArticleResponse.parse(fallback));
    return;
  }

  res.json(GetFeaturedArticleResponse.parse(article));
});

export default router;
