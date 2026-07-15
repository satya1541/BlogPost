import { Router } from "express";
import { db, pandaLabsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/panda-labs/ideas", async (_req, res) => {
  try {
    const list = await db
      .select({
        id: pandaLabsTable.id,
        title: pandaLabsTable.title,
        problem: pandaLabsTable.problem,
        solution: pandaLabsTable.solution,
        votes: pandaLabsTable.votes,
        createdAt: pandaLabsTable.createdAt,
        user: {
          id: usersTable.id,
          email: usersTable.email,
        },
      })
      .from(pandaLabsTable)
      .innerJoin(usersTable, eq(pandaLabsTable.userId, usersTable.id))
      .orderBy(desc(pandaLabsTable.votes));
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ideas" });
  }
});

router.post("/panda-labs/ideas", requireAuth, async (req: AuthenticatedRequest, res) => {
  const { title, problem, solution } = req.body;
  if (!title || !problem || !solution) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }
  try {
    const [insertResult] = await db.insert(pandaLabsTable).values({
      userId: req.user!.id,
      title,
      problem,
      solution,
    });
    const [newIdea] = await db
      .select()
      .from(pandaLabsTable)
      .where(eq(pandaLabsTable.id, insertResult.insertId))
      .limit(1);
    res.status(201).json(newIdea);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit idea" });
  }
});

router.post("/panda-labs/ideas/:id/vote", requireAuth, async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const { voteType } = req.body; // "up" or "down"
  if (isNaN(id)) {
    res.status(400).json({ message: "Invalid idea ID" });
    return;
  }
  try {
    const [idea] = await db
      .select()
      .from(pandaLabsTable)
      .where(eq(pandaLabsTable.id, id))
      .limit(1);
    if (!idea) {
      res.status(404).json({ message: "Idea not found" });
      return;
    }
    const delta = voteType === "up" ? 1 : -1;
    await db
      .update(pandaLabsTable)
      .set({ votes: idea.votes + delta })
      .where(eq(pandaLabsTable.id, id));
    res.json({ success: true, votes: idea.votes + delta });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit vote" });
  }
});

export default router;
