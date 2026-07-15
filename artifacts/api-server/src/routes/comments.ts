import { Router } from "express";
import { db, commentsTable, articlesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/articles/:slug/comments", async (req, res) => {
  const { slug } = req.params;
  if (typeof slug !== "string") {
    res.status(400).json({ message: "Invalid slug parameter" });
    return;
  }

  try {
    const comments = await db
      .select({
        id: commentsTable.id,
        content: commentsTable.content,
        createdAt: commentsTable.createdAt,
        user: {
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
        },
      })
      .from(commentsTable)
      .innerJoin(articlesTable, eq(commentsTable.articleId, articlesTable.id))
      .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(articlesTable.slug, slug))
      .orderBy(desc(commentsTable.createdAt));

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

router.post(
  "/articles/:slug/comments",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const { slug } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (typeof slug !== "string") {
      res.status(400).json({ message: "Invalid slug parameter" });
      return;
    }

    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({ message: "Comment content is required" });
      return;
    }

    try {
      const [article] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.slug, slug))
        .limit(1);

      if (!article) {
        res.status(444).json({ message: "Article not found" });
        return;
      }

      const [insertResult] = await db.insert(commentsTable).values({
        userId,
        articleId: article.id,
        content: content.trim(),
      });

      const [newComment] = await db
        .select({
          id: commentsTable.id,
          content: commentsTable.content,
          createdAt: commentsTable.createdAt,
          user: {
            id: usersTable.id,
            email: usersTable.email,
            role: usersTable.role,
          },
        })
        .from(commentsTable)
        .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
        .where(eq(commentsTable.id, insertResult.insertId))
        .limit(1);

      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ message: "Failed to post comment" });
    }
  },
);

export default router;
