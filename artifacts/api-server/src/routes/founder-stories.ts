import { Router } from "express";
import { db, founderStoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/founder-stories", async (req, res) => {
  try {
    const list = await db
      .select({
        id: founderStoriesTable.id,
        title: founderStoriesTable.title,
        slug: founderStoriesTable.slug,
        excerpt: founderStoriesTable.excerpt,
        category: founderStoriesTable.category,
        intervieweeName: founderStoriesTable.intervieweeName,
        intervieweeTitle: founderStoriesTable.intervieweeTitle,
        intervieweeAvatar: founderStoriesTable.intervieweeAvatar,
        createdAt: founderStoriesTable.createdAt,
      })
      .from(founderStoriesTable);
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch founder stories" });
  }
});

router.get("/founder-stories/:slug", async (req, res) => {
  const { slug } = req.params;
  if (typeof slug !== "string") {
    res.status(400).json({ message: "Invalid slug parameter" });
    return;
  }
  try {
    const [story] = await db
      .select()
      .from(founderStoriesTable)
      .where(eq(founderStoriesTable.slug, slug))
      .limit(1);

    if (!story) {
      res.status(404).json({ message: "Founder story not found" });
      return;
    }

    res.json(story);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch founder story detail" });
  }
});

export default router;
