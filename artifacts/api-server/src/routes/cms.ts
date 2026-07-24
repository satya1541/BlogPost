import { Router } from "express";
import {
  db,
  articlesTable,
  commentsTable,
  usersTable,
  newsletterSubscriptionsTable,
  seriesTable,
} from "@workspace/db";
import { eq, desc, sql, and, count } from "drizzle-orm";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Middleware to ensure user is admin
const requireAdmin = (req: AuthenticatedRequest, res: any, next: any) => {
  if (
    !req.user ||
    (req.user.role !== "admin" && req.user.role !== "super_admin")
  ) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// List all articles (admin view – includes drafts)
router.get(
  "/cms/articles",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const status = req.query.status as string | undefined;
      const conditions = [];
      if (status && ["draft", "published", "scheduled"].includes(status)) {
        conditions.push(eq(articlesTable.status, status));
      }

      const articles = await db
        .select()
        .from(articlesTable)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(articlesTable.createdAt));

      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  },
);

// Create article
router.post(
  "/cms/articles",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
        tags,
        author,
        authorTitle,
        authorAvatar,
        readingTimeMinutes,
        featured,
        series,
        status,
        publishedDate,
      } = req.body;

      if (!title || !slug || !content) {
        res
          .status(400)
          .json({ message: "Title, slug, and content are required" });
        return;
      }

      // Auto-generate slug from title if not provided
      const finalSlug =
        slug ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      // Calculate reading time if not provided
      const wordCount = (content || "").split(/\s+/).length;
      const estimatedReadTime = readingTimeMinutes || Math.ceil(wordCount / 200);

      const [insertResult] = await db.insert(articlesTable).values({
        title,
        slug: finalSlug,
        excerpt: excerpt || "",
        content,
        coverImage: coverImage || "",
        category: category || "Uncategorized",
        tags: tags || [],
        author: author || req.user!.email,
        authorTitle: authorTitle || "Contributor",
        authorAvatar: authorAvatar || "",
        readingTimeMinutes: estimatedReadTime,
        featured: featured || false,
        series: series || null,
        status: status || "draft",
        publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
      });

      const [newArticle] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, insertResult.insertId))
        .limit(1);

      res.status(201).json(newArticle);
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        res.status(409).json({ message: "An article with this slug already exists" });
        return;
      }
      res.status(500).json({ message: "Failed to create article" });
    }
  },
);

// Update article
router.put(
  "/cms/articles/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const articleId = parseInt(req.params.id as string, 10);
      if (isNaN(articleId)) {
        res.status(400).json({ message: "Invalid article ID" });
        return;
      }

      const [existing] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, articleId))
        .limit(1);

      if (!existing) {
        res.status(404).json({ message: "Article not found" });
        return;
      }

      const {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        category,
        tags,
        author,
        authorTitle,
        authorAvatar,
        readingTimeMinutes,
        featured,
        series,
        status,
        publishedDate,
      } = req.body;

      // If transitioning to published, auto-calculate reading time
      let estimatedReadTime = readingTimeMinutes;
      if (content && !readingTimeMinutes) {
        const wordCount = content.split(/\s+/).length;
        estimatedReadTime = Math.ceil(wordCount / 200);
      }

      await db
        .update(articlesTable)
        .set({
          ...(title !== undefined && { title }),
          ...(slug !== undefined && { slug }),
          ...(excerpt !== undefined && { excerpt }),
          ...(content !== undefined && { content }),
          ...(coverImage !== undefined && { coverImage }),
          ...(category !== undefined && { category }),
          ...(tags !== undefined && { tags }),
          ...(author !== undefined && { author }),
          ...(authorTitle !== undefined && { authorTitle }),
          ...(authorAvatar !== undefined && { authorAvatar }),
          ...(estimatedReadTime !== undefined && {
            readingTimeMinutes: estimatedReadTime,
          }),
          ...(featured !== undefined && { featured }),
          ...(series !== undefined && { series }),
          ...(status !== undefined && { status }),
          ...(publishedDate !== undefined && {
            publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
          }),
        })
        .where(eq(articlesTable.id, articleId));

      const [updated] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, articleId))
        .limit(1);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update article" });
    }
  },
);

// Delete article
router.delete(
  "/cms/articles/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const articleId = parseInt(req.params.id as string, 10);
      if (isNaN(articleId)) {
        res.status(400).json({ message: "Invalid article ID" });
        return;
      }

      const [existing] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, articleId))
        .limit(1);

      if (!existing) {
        res.status(404).json({ message: "Article not found" });
        return;
      }

      await db.delete(articlesTable).where(eq(articlesTable.id, articleId));
      res.json({ message: "Article deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  },
);

// Toggle featured status for hero slider
router.patch(
  "/cms/articles/:id/featured",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const articleId = parseInt(req.params.id as string, 10);
      if (isNaN(articleId)) {
        res.status(400).json({ message: "Invalid article ID" });
        return;
      }

      const [existing] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, articleId))
        .limit(1);

      if (!existing) {
        res.status(404).json({ message: "Article not found" });
        return;
      }

      const newFeatured = req.body.featured !== undefined ? req.body.featured : !existing.featured;

      await db
        .update(articlesTable)
        .set({ featured: newFeatured })
        .where(eq(articlesTable.id, articleId));

      const [updated] = await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.id, articleId))
        .limit(1);

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle featured status" });
    }
  },
);

// Export newsletter subscribers as JSON (for CSV export on frontend)
router.get(
  "/cms/subscribers",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const subscribers = await db
        .select()
        .from(newsletterSubscriptionsTable)
        .orderBy(desc(newsletterSubscriptionsTable.subscribedAt));

      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscribers" });
    }
  },
);

// Comment moderation: list all comments
router.get(
  "/cms/comments",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const comments = await db
        .select({
          id: commentsTable.id,
          content: commentsTable.content,
          createdAt: commentsTable.createdAt,
          articleId: commentsTable.articleId,
          user: {
            id: usersTable.id,
            email: usersTable.email,
          },
        })
        .from(commentsTable)
        .innerJoin(usersTable, eq(commentsTable.userId, usersTable.id))
        .orderBy(desc(commentsTable.createdAt))
        .limit(100);

      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  },
);

// Delete comment (moderation)
router.delete(
  "/cms/comments/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const commentId = parseInt(req.params.id as string, 10);
      if (isNaN(commentId)) {
        res.status(400).json({ message: "Invalid comment ID" });
        return;
      }

      await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
      res.json({ message: "Comment deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  },
);

// --- Series Management ---

// List all series (admin view)
router.get(
  "/cms/series",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const series = await db.select().from(seriesTable).orderBy(seriesTable.name);
      res.json(series);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch series" });
    }
  },
);

// Create series
router.post(
  "/cms/series",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, slug, description, coverImage } = req.body;
      if (!name || !slug || !description) {
        res.status(400).json({ message: "Name, slug, and description are required" });
        return;
      }
      
      const [insertResult] = await db.insert(seriesTable).values({
        name,
        slug,
        description,
        coverImage: coverImage || "",
      });
      
      res.status(201).json({ id: insertResult.insertId, message: "Series created" });
    } catch (error) {
      res.status(500).json({ message: "Failed to create series" });
    }
  },
);

// Update series
router.put(
  "/cms/series/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const seriesId = parseInt(req.params.id as string, 10);
      if (isNaN(seriesId)) {
        res.status(400).json({ message: "Invalid series ID" });
        return;
      }
      const { name, slug, description, coverImage } = req.body;
      
      await db.update(seriesTable)
        .set({
          ...(name && { name }),
          ...(slug && { slug }),
          ...(description && { description }),
          ...(coverImage !== undefined && { coverImage }),
        })
        .where(eq(seriesTable.id, seriesId));
        
      res.json({ message: "Series updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update series" });
    }
  },
);

// Delete series
router.delete(
  "/cms/series/:id",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const seriesId = parseInt(req.params.id as string, 10);
      if (isNaN(seriesId)) {
        res.status(400).json({ message: "Invalid series ID" });
        return;
      }
      
      await db.delete(seriesTable).where(eq(seriesTable.id, seriesId));
      res.json({ message: "Series deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete series" });
    }
  },
);

export default router;
