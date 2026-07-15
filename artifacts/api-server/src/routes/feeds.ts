import { Router } from "express";
import { db, articlesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// ─── RSS Feed ────────────────────────────
router.get("/feeds/rss", async (_req, res) => {
  try {
    const articles = await db
      .select()
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedDate))
      .limit(50);

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const items = articles
      .map((a) => {
        const pubDate = new Date(a.publishedDate).toUTCString();
        const link = `${siteUrl}/articles/${a.slug}`;
        return `    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${a.excerpt}]]></description>
      <category><![CDATA[${a.category}]]></category>
      <author>${a.author}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Panda Nomad</title>
    <link>${siteUrl}</link>
    <description>High-signal essays for founders building in public.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feeds/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    res.set("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(rss);
  } catch (error) {
    res.status(500).send("Failed to generate RSS feed");
  }
});

// ─── Sitemap ────────────────────────────
router.get("/sitemap.xml", async (_req, res) => {
  try {
    const articles = await db
      .select({ slug: articlesTable.slug, publishedDate: articlesTable.publishedDate })
      .from(articlesTable)
      .where(eq(articlesTable.status, "published"))
      .orderBy(desc(articlesTable.publishedDate));

    const siteUrl = process.env.SITE_URL || "http://localhost:3000";

    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/articles", priority: "0.9", changefreq: "daily" },
      { loc: "/topics", priority: "0.8", changefreq: "weekly" },
      { loc: "/series", priority: "0.8", changefreq: "weekly" },
      { loc: "/founder-stories", priority: "0.7", changefreq: "weekly" },
      { loc: "/resources", priority: "0.7", changefreq: "monthly" },
      { loc: "/community", priority: "0.6", changefreq: "daily" },
      { loc: "/newsletter", priority: "0.6", changefreq: "monthly" },
      { loc: "/about", priority: "0.5", changefreq: "monthly" },
      { loc: "/build-in-public", priority: "0.6", changefreq: "weekly" },
    ];

    const staticEntries = staticPages
      .map(
        (p) => `  <url>
    <loc>${siteUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
      )
      .join("\n");

    const articleEntries = articles
      .map((a) => {
        const lastmod = new Date(a.publishedDate).toISOString().split("T")[0];
        return `  <url>
    <loc>${siteUrl}/articles/${a.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
      .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${articleEntries}
</urlset>`;

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.send(sitemap);
  } catch (error) {
    res.status(500).send("Failed to generate sitemap");
  }
});

export default router;
