import { Router } from "express";
import { db, mentorshipRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/mentorship/requests", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await db
      .select()
      .from(mentorshipRequestsTable)
      .where(eq(mentorshipRequestsTable.userId, req.user!.id))
      .orderBy(desc(mentorshipRequestsTable.createdAt));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch mentorship requests" });
  }
});

router.post("/mentorship/requests", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { mentorName, topic, message } = req.body;
  if (!mentorName || !topic || !message) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }
  try {
    const [insertResult] = await db.insert(mentorshipRequestsTable).values({
      userId: req.user!.id,
      mentorName,
      topic,
      message,
    });
    const [newRequest] = await db
      .select()
      .from(mentorshipRequestsTable)
      .where(eq(mentorshipRequestsTable.id, insertResult.insertId))
      .limit(1);
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit request" });
  }
});

export default router;
