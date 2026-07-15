import { Router } from "express";
import {
  db,
  usersTable,
  articlesTable,
  communityThreadsTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
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

router.get("/admin/stats", authMiddleware, requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const [usersCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable);

    const [articlesCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articlesTable);
      
    const [threadsCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityThreadsTable);

    res.json({
      totalUsers: Number(usersCountResult?.count || 0),
      totalArticles: Number(articlesCountResult?.count || 0),
      totalThreads: Number(threadsCountResult?.count || 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

export default router;
