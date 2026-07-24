import { Router } from "express";
import { db, resourcesTable, founderStoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.post("/seed-phase2", async (req, res) => {
  try {
    // Seed resources if empty
    const existingResources = await db.select().from(resourcesTable).limit(1);
    if (existingResources.length === 0) {
      await db.insert(resourcesTable).values([
        {
          title: "SaaS Launch Checklist",
          slug: "saas-launch-checklist",
          description: "A comprehensive step-by-step checklist for launching your next SaaS product successfully, covering engineering, legal, marketing, and analytics.",
          type: "checklist",
          downloadUrl: "https://raw.githubusercontent.com/dwyl/english-words/master/README.md", // placeholder download url
          isPremium: false,
        },
        {
          title: "The Solopreneur Handbook",
          slug: "solopreneur-handbook",
          description: "The ultimate guide to building a one-person business. Find out how to automate operations, construct an audience, and scale without hiring.",
          type: "book",
          downloadUrl: "https://raw.githubusercontent.com/dwyl/english-words/master/README.md",
          isPremium: true,
        },
        {
          title: "Cold Outreach Email Templates",
          slug: "cold-outreach-templates",
          description: "15 high-converting cold email copy-paste templates that helped us close over $100k in pilot client contracts.",
          type: "template",
          downloadUrl: "https://raw.githubusercontent.com/dwyl/english-words/master/README.md",
          isPremium: false,
        },
        {
          title: "Creator Economy Tech Stack Builder",
          slug: "creator-tech-stack",
          description: "A curated database of the top 100 tools used by elite solo creators to edit, distribute, and monetize their content.",
          type: "toolkit",
          downloadUrl: "https://raw.githubusercontent.com/dwyl/english-words/master/README.md",
          isPremium: true,
        },
      ]);
    }

    // Seed founder stories if empty
    const existingStories = await db.select().from(founderStoriesTable).limit(1);
    if (existingStories.length === 0) {
      await db.insert(founderStoriesTable).values([
        {
          title: "Bootstrapping to $50k MRR: The Story of SimpleAnalytics",
          slug: "bootstrapping-simpleanalytics",
          excerpt: "How Adriaan van Rossum built a privacy-first analytics tool in public, fought Google Analytics, and reached profitability as a solo coder.",
          intervieweeName: "Adriaan van Rossum",
          intervieweeTitle: "Founder, SimpleAnalytics",
          intervieweeAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          category: "Tech & SaaS",
          content: JSON.stringify([
            {
              q: "What was the initial spark that led to SimpleAnalytics?",
              a: "I wanted a way to see my website stats without tracking users across the web or selling their data to ad networks. Google Analytics felt bloated and unethical, so I decided to build a simple, clean dashboard."
            },
            {
              q: "How did you get your first 100 paying users?",
              a: "I built in public on Twitter and Indie Hackers. I shared my server costs, page views, and design sketches. Transparency built trust, and developers who cared about privacy started paying me to support the project."
            },
            {
              q: "What is the hardest part of being a solo founder?",
              a: "Context switching. On any given day, I am writing node scripts, responding to customer support tickets, doing bookkeeping, or writing blog posts. It can get exhausting, but the autonomy is worth it."
            }
          ]),
        },
        {
          title: "From Bio-Lab to VC-Backed Startup: Redesigning Diagnostics",
          slug: "redesigning-diagnostics",
          excerpt: "Dr. Elena Rostova describes her journey leaving academia to build a rapid molecular testing device for rural health clinics.",
          intervieweeName: "Dr. Elena Rostova",
          intervieweeTitle: "CEO, GeneLight",
          intervieweeAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
          category: "BioTech",
          content: JSON.stringify([
            {
              q: "Why did you decide to leave academia?",
              a: "In the lab, we spent years writing papers that only a few dozen peers read. I wanted to build something tangible that would immediately help doctors in rural clinics make lifesaving diagnostics choices."
            },
            {
              q: "What has been the biggest challenge in translating lab tech to the market?",
              a: "Hardware is hard, and biotech hardware is even harder. Regulation, supply chain delays, and clinical trials require massive capital upfront. Transitioning from grant-writing to pitching VCs was a steep learning curve."
            }
          ]),
        }
      ]);
    }

    res.json({ success: true, message: "Phase 2 mock data seeded successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/resources", async (req, res) => {
  try {
    const list = await db.select().from(resourcesTable);
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch resources" });
  }
});

router.get("/resources/:slug/download", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { slug } = req.params;
  if (typeof slug !== "string") {
    res.status(400).json({ message: "Invalid slug parameter" });
    return;
  }
  try {
    const [resource] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.slug, slug))
      .limit(1);

    if (!resource) {
      res.status(404).json({ message: "Resource not found" });
      return;
    }

    if (resource.isPremium) {
      if (!req.user) {
        res.status(403).json({
          message: "Please log in to download this resource.",
        });
        return;
      }
    }

    res.json({ downloadUrl: resource.downloadUrl });
  } catch (error) {
    res.status(500).json({ message: "Failed to download resource" });
  }
});

export default router;
