import { Router } from "express";
import { db, bookmarksTable, likesTable, articlesTable, usersTable, newsletterSubscriptionsTable, analyticsEventsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/dashboard/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  try {
    const [bookmarksCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, userId));

    const [likesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(likesTable)
      .where(eq(likesTable.userId, userId));

    const [subscription] = await db
      .select()
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, req.user!.email))
      .limit(1);

    res.json({
      streakCount: req.user!.streakCount,
      lastActiveAt: req.user!.lastActiveAt,
      totalBookmarks: Number(bookmarksCount?.count || 0),
      totalLikes: Number(likesCount?.count || 0),
      isSubscribed: !!subscription,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

router.post("/dashboard/toggle-subscription", requireAuth, async (req: AuthenticatedRequest, res) => {
  const email = req.user!.email.toLowerCase().trim();
  try {
    const [existing] = await db
      .select()
      .from(newsletterSubscriptionsTable)
      .where(eq(newsletterSubscriptionsTable.email, email))
      .limit(1);

    if (existing) {
      await db
        .delete(newsletterSubscriptionsTable)
        .where(eq(newsletterSubscriptionsTable.email, email));
      res.json({ isSubscribed: false });
    } else {
      await db
        .insert(newsletterSubscriptionsTable)
        .values({ email });
      res.json({ isSubscribed: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle subscription" });
  }
});

router.get("/admin/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  try {
    const [usersCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable);

    const [subsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscriptionsTable);

    const [articlesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(articlesTable);

    const [viewsSum] = await db
      .select({ sum: sql<number>`sum(${articlesTable.views})` })
      .from(articlesTable);

    res.json({
      totalUsers: Number(usersCount?.count || 0),
      totalSubscribers: Number(subsCount?.count || 0),
      totalArticles: Number(articlesCount?.count || 0),
      totalViews: Number(viewsSum?.sum || 0),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

// ─── Admin Analytics ────────────────────────────
router.get("/admin/analytics", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (req.user!.role !== "admin" && req.user!.role !== "super_admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  try {
    // Total page views
    const [pageViews] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEventsTable)
      .where(eq(analyticsEventsTable.eventType, "page_view"));

    // Unique readers (distinct user IDs who have page_view events)
    const [uniqueReaders] = await db
      .select({ count: sql<number>`count(distinct ${analyticsEventsTable.userId})` })
      .from(analyticsEventsTable)
      .where(
        and(
          eq(analyticsEventsTable.eventType, "page_view"),
          sql`${analyticsEventsTable.userId} is not null`
        )
      );

    // Average scroll depth (from scroll_depth events metadata)
    const [avgScroll] = await db
      .select({
        avg: sql<number>`avg(json_extract(${analyticsEventsTable.metadata}, '$.scrollPercent'))`,
      })
      .from(analyticsEventsTable)
      .where(eq(analyticsEventsTable.eventType, "scroll_depth"));

    // Read completion rate: read_complete events / total page_view events
    const [readComplete] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEventsTable)
      .where(eq(analyticsEventsTable.eventType, "read_complete"));

    const totalViews = Number(pageViews?.count || 0);
    const readCompleteCount = Number(readComplete?.count || 0);
    const readCompletionRate = totalViews > 0 ? Math.round((readCompleteCount / totalViews) * 100) : 0;

    // Top referrers
    const topReferrers = await db
      .select({
        referrer: sql<string>`json_extract(${analyticsEventsTable.metadata}, '$.referrer')`,
        count: sql<number>`count(*)`,
      })
      .from(analyticsEventsTable)
      .where(
        and(
          eq(analyticsEventsTable.eventType, "page_view"),
          sql`json_extract(${analyticsEventsTable.metadata}, '$.referrer') is not null`,
          sql`json_extract(${analyticsEventsTable.metadata}, '$.referrer') != '""'`,
          sql`json_extract(${analyticsEventsTable.metadata}, '$.referrer') != 'null'`
        )
      )
      .groupBy(sql`json_extract(${analyticsEventsTable.metadata}, '$.referrer')`)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    // Newsletter conversion rate
    const [newsletterConversions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEventsTable)
      .where(eq(analyticsEventsTable.eventType, "newsletter_convert"));

    const newsletterConversionRate = totalViews > 0
      ? Math.round((Number(newsletterConversions?.count || 0) / totalViews) * 100 * 100) / 100
      : 0;

    res.json({
      totalPageViews: totalViews,
      uniqueReaders: Number(uniqueReaders?.count || 0),
      avgScrollDepth: Math.round(Number(avgScroll?.avg || 0)),
      readCompletionRate,
      topReferrers: topReferrers.map((r) => ({
        referrer: r.referrer || "Direct",
        count: Number(r.count),
      })),
      newsletterConversionRate,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

export default router;
