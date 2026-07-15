import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, articlesTable, analyticsEventsTable, followedTopicsTable } from "@workspace/db";
import {
  ListArticlesQueryParams,
  ListArticlesResponse,
  GetArticleParams,
  GetArticleResponse,
  ListRelatedArticlesParams,
  ListRelatedArticlesResponse,
  GetFeaturedArticleResponse,
} from "@workspace/api-zod";
import { AuthenticatedRequest } from "../middleware/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const router: IRouter = Router();

router.get("/articles/recommended", async (req: AuthenticatedRequest, res): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Get followed topics
  const followed = await db
    .select({ topicSlug: followedTopicsTable.topicSlug })
    .from(followedTopicsTable)
    .where(eq(followedTopicsTable.userId, req.user.id));

  const topics = followed.map(f => f.topicSlug);
  
  if (topics.length === 0) {
    // If no topics, just return latest articles
    const latest = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedDate))
      .limit(10);
    res.json(ListArticlesResponse.parse(latest));
    return;
  }

  // Find articles matching any of the followed topics (by category)
  // Since categories are stored as text and topics are slugs, we compare them loosely or strictly.
  // We'll use a simple IN clause, assuming category matches the topic slug or name.
  // Wait, if category is "Idea" and topic is "idea", we need lowercase comparison.
  // A simple way is to use inArray on lowercase categories if possible, or just exact match if slugs.
  
  const recommended = await db
    .select()
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.status, "published"),
        sql`lower(replace(${articlesTable.category}, ' ', '-')) IN (${sql.join(topics.map(t => sql`${t}`), sql`, `)})`
      )
    )
    .orderBy(desc(articlesTable.publishedDate))
    .limit(10);

  // Fallback if no matching articles
  if (recommended.length === 0) {
    const latest = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedDate))
      .limit(10);
    res.json(ListArticlesResponse.parse(latest));
    return;
  }

  res.json(ListArticlesResponse.parse(recommended));
});


router.get("/articles", async (req, res): Promise<void> => {
  const parsed = ListArticlesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, series, tag, featured, sort, limit } = parsed.data;

  const conditions = [eq(articlesTable.status, "published")];
  if (category) {
    // Accept either the exact category name or its slug form (lowercase, hyphenated).
    conditions.push(
      sql`lower(replace(${articlesTable.category}, ' ', '-')) = lower(replace(${category}, ' ', '-'))`,
    );
  }
  if (series) {
    conditions.push(
      sql`lower(replace(${articlesTable.series}, ' ', '-')) = lower(replace(${series}, ' ', '-'))`,
    );
  }
  if (featured !== undefined) conditions.push(eq(articlesTable.featured, featured));
  if (tag) {
    conditions.push(sql`json_contains(${articlesTable.tags}, json_quote(${tag}))`);
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
        eq(articlesTable.status, "published"),
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
    .where(
      and(
        eq(articlesTable.slug, params.data.slug),
        eq(articlesTable.status, "published"),
      ),
    );

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

router.post("/articles/:slug/summarize", async (req, res): Promise<void> => {
  const params = GetArticleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [article] = await db
    .select()
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.slug, params.data.slug),
        eq(articlesTable.status, "published")
      )
    );

  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: "AI summarization is not configured." });
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Please provide a concise, 3-bullet point summary of the following article titled "${article.title}". Do not include any introductory or concluding remarks, just the 3 bullet points.\n\nArticle Content:\n${article.content}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ summary: text });
  } catch (error) {
    console.error("Gemini AI error:", error);
    res.status(500).json({ error: "Failed to generate AI summary." });
  }
});

router.get("/home/featured", async (_req, res): Promise<void> => {
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.featured, true),
        eq(articlesTable.status, "published"),
      ),
    )
    .orderBy(desc(articlesTable.publishedDate))
    .limit(1);

  if (!article) {
    const [fallback] = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
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

// ─── Analytics Tracking ────────────────────────────
router.post("/analytics/track", async (req: AuthenticatedRequest, res): Promise<void> => {
  const { eventType, slug, metadata } = req.body;

  const validEvents = ["page_view", "scroll_depth", "read_complete", "newsletter_convert"];
  if (!eventType || !validEvents.includes(eventType)) {
    res.status(400).json({ error: "Invalid event type" });
    return;
  }

  try {
    let articleId: number | null = null;
    if (slug && slug !== "global") {
      const [article] = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(eq(articlesTable.slug, slug as string))
        .limit(1);
      if (article) {
        articleId = article.id;
      }
    }

    await db.insert(analyticsEventsTable).values({
      userId: req.user?.id || null,
      articleId,
      eventType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    res.json({ ok: true });
  } catch (error) {
    res.json({ ok: true });
  }
});

router.post("/articles/:slug/track", async (req: AuthenticatedRequest, res): Promise<void> => {
  const { slug } = req.params;
  const { eventType, metadata } = req.body;

  const validEvents = ["page_view", "scroll_depth", "read_complete", "newsletter_convert"];
  if (!eventType || !validEvents.includes(eventType)) {
    res.status(400).json({ error: "Invalid event type" });
    return;
  }

  try {
    const [article] = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.slug, slug as string))
      .limit(1);

    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    await db.insert(analyticsEventsTable).values({
      userId: req.user?.id || null,
      articleId: article.id,
      eventType,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    res.json({ ok: true });
  } catch (error) {
    res.json({ ok: true });
  }
});

export default router;
