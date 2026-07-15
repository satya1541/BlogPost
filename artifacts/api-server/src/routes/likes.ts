import { Router } from "express";
import { db, likesTable, articlesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/articles/:slug/likes", async (req: AuthenticatedRequest, res) => {
  const { slug } = req.params;
  const userId = req.user?.id;

  if (typeof slug !== "string") {
    res.status(400).json({ message: "Invalid slug parameter" });
    return;
  }

  try {
    const [article] = await db
      .select({ id: articlesTable.id })
      .from(articlesTable)
      .where(eq(articlesTable.slug, slug))
      .limit(1);

    if (!article) {
      res.status(444).json({ message: "Article not found" });
      return;
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(likesTable)
      .where(eq(likesTable.articleId, article.id));

    const totalLikes = Number(countResult?.count || 0);

    let liked = false;
    if (userId) {
      const [existing] = await db
        .select()
        .from(likesTable)
        .where(
          and(eq(likesTable.userId, userId), eq(likesTable.articleId, article.id)),
        )
        .limit(1);
      liked = !!existing;
    }

    res.json({ totalLikes, liked });
  } catch (error) {
    res.status(505).json({ message: "Failed to fetch likes" });
  }
});

router.get("/likes", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const likedArticles = await db
      .select({
        article: articlesTable,
      })
      .from(likesTable)
      .innerJoin(articlesTable, eq(likesTable.articleId, articlesTable.id))
      .where(eq(likesTable.userId, userId));

    res.json(likedArticles.map((row) => row.article));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch liked articles" });
  }
});

router.post(
  "/likes/toggle",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const { articleId } = req.body;

    if (!articleId || typeof articleId !== "number") {
      res
        .status(400)
        .json({ message: "articleId is required and must be a number" });
      return;
    }

    try {
      const [existing] = await db
        .select()
        .from(likesTable)
        .where(
          and(
            eq(likesTable.userId, userId),
            eq(likesTable.articleId, articleId),
          ),
        )
        .limit(1);

      let liked = false;
      if (existing) {
        await db
          .delete(likesTable)
          .where(
            and(
              eq(likesTable.userId, userId),
              eq(likesTable.articleId, articleId),
            ),
          );
      } else {
        await db.insert(likesTable).values({
          userId,
          articleId,
        });
        liked = true;
      }

      // Get total likes for this article
      const totalLikesResult = await db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(likesTable)
        .where(eq(likesTable.articleId, articleId));

      res.json({ liked, totalLikes: Number(totalLikesResult[0]?.count || 0) });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle like" });
    }
  },
);

export default router;
