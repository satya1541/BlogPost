import { Router } from "express";
import {
  db,
  communityThreadsTable,
  communityPostsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// GET all threads
router.get("/community/threads", async (req, res) => {
  try {
    const threads = await db
      .select({
        id: communityThreadsTable.id,
        title: communityThreadsTable.title,
        category: communityThreadsTable.category,
        createdAt: communityThreadsTable.createdAt,
        user: {
          id: usersTable.id,
          email: usersTable.email,
        },
      })
      .from(communityThreadsTable)
      .leftJoin(usersTable, eq(communityThreadsTable.userId, usersTable.id))
      .orderBy(desc(communityThreadsTable.createdAt));

    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch threads" });
  }
});

// GET thread by id with its posts
router.get("/community/threads/:id", async (req, res) => {
  const { id } = req.params;
  const threadId = parseInt(id, 10);
  
  if (isNaN(threadId)) {
    res.status(400).json({ message: "Invalid thread ID" });
    return;
  }

  try {
    const [thread] = await db
      .select({
        id: communityThreadsTable.id,
        title: communityThreadsTable.title,
        content: communityThreadsTable.content,
        category: communityThreadsTable.category,
        createdAt: communityThreadsTable.createdAt,
        user: {
          id: usersTable.id,
          email: usersTable.email,
        },
      })
      .from(communityThreadsTable)
      .leftJoin(usersTable, eq(communityThreadsTable.userId, usersTable.id))
      .where(eq(communityThreadsTable.id, threadId))
      .limit(1);

    if (!thread) {
      res.status(404).json({ message: "Thread not found" });
      return;
    }

    const posts = await db
      .select({
        id: communityPostsTable.id,
        content: communityPostsTable.content,
        createdAt: communityPostsTable.createdAt,
        user: {
          id: usersTable.id,
          email: usersTable.email,
        },
      })
      .from(communityPostsTable)
      .leftJoin(usersTable, eq(communityPostsTable.userId, usersTable.id))
      .where(eq(communityPostsTable.threadId, threadId))
      .orderBy(communityPostsTable.createdAt);

    res.json({ ...thread, posts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch thread details" });
  }
});

// POST new thread
router.post("/community/threads", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { title, content, category } = req.body;

  if (!title || !content || !category) {
    res.status(400).json({ message: "Missing required fields" });
    return;
  }

  try {
    const [result] = await db.insert(communityThreadsTable).values({
      title,
      content,
      category,
      userId,
    });
    
    // In mysql2, insertId is the inserted row ID.
    const threadId = (result as any).insertId;
    res.status(201).json({ message: "Thread created", id: threadId });
  } catch (error) {
    res.status(500).json({ message: "Failed to create thread" });
  }
});

// POST new post (reply) to thread
router.post("/community/threads/:id/posts", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { content } = req.body;
  const idParam = Array.isArray(id) ? id[0] : id;
  const threadId = parseInt(idParam, 10);

  if (isNaN(threadId) || !content) {
    res.status(400).json({ message: "Invalid parameters" });
    return;
  }

  try {
    const [result] = await db.insert(communityPostsTable).values({
      threadId,
      content,
      userId,
    });
    
    res.status(201).json({ message: "Post created", id: (result as any).insertId });
  } catch (error) {
    res.status(500).json({ message: "Failed to create post" });
  }
});

export default router;
