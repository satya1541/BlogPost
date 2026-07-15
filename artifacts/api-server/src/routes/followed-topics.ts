import { Router } from "express";
import { db, followedTopicsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/followed-topics", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await db
      .select()
      .from(followedTopicsTable)
      .where(eq(followedTopicsTable.userId, req.user!.id));
    res.json(list.map((item) => item.topicSlug));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch followed topics" });
  }
});

router.post("/followed-topics/toggle", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { topicSlug } = req.body;
  if (!topicSlug || typeof topicSlug !== "string") {
    res.status(400).json({ message: "Topic slug is required" });
    return;
  }
  try {
    const [existing] = await db
      .select()
      .from(followedTopicsTable)
      .where(
        and(
          eq(followedTopicsTable.userId, req.user!.id),
          eq(followedTopicsTable.topicSlug, topicSlug)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .delete(followedTopicsTable)
        .where(
          and(
            eq(followedTopicsTable.userId, req.user!.id),
            eq(followedTopicsTable.topicSlug, topicSlug)
          )
        );
      res.json({ followed: false });
    } else {
      await db.insert(followedTopicsTable).values({
        userId: req.user!.id,
        topicSlug,
      });
      res.json({ followed: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle topic follow status" });
  }
});

export default router;
