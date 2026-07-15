import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, req.user!.id))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid notification ID" });
    return;
  }
  try {
    await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, id));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification status" });
  }
});

export default router;
