import { Router } from "express";
import { db, bookmarksTable, articlesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get(
  "/articles/:slug/bookmark",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const userId = req.user!.id;

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

      const [existing] = await db
        .select()
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, userId),
            eq(bookmarksTable.articleId, article.id),
          ),
        )
        .limit(1);

      res.json({ bookmarked: !!existing });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmark status" });
    }
  },
);

router.get("/bookmarks", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const bookmarkedArticles = await db
      .select({
        article: articlesTable,
      })
      .from(bookmarksTable)
      .innerJoin(articlesTable, eq(bookmarksTable.articleId, articlesTable.id))
      .where(eq(bookmarksTable.userId, userId));

    res.json(bookmarkedArticles.map((row) => row.article));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bookmarks" });
  }
});

router.post(
  "/bookmarks/toggle",
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
        .from(bookmarksTable)
        .where(
          and(
            eq(bookmarksTable.userId, userId),
            eq(bookmarksTable.articleId, articleId),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .delete(bookmarksTable)
          .where(
            and(
              eq(bookmarksTable.userId, userId),
              eq(bookmarksTable.articleId, articleId),
            ),
          );
        res.json({ bookmarked: false });
      } else {
        await db.insert(bookmarksTable).values({
          userId,
          articleId,
        });
        res.json({ bookmarked: true });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  },
);

export default router;
