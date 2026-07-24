import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { db, articlesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { uploadToS3, deleteFromS3 } from "../services/s3";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// ─── Image Generation via Gemini API (direct REST, no SDK needed) ────
async function generateImageWithGemini(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment");
  }

  const imagePrompt = `Generate a photorealistic, high-quality editorial photograph for a blog article. Cinematic lighting, sharp focus, natural colors. No text, no logos, no watermarks. Scene: ${prompt}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: imagePrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[Gemini Image] API error ${response.status}:`, errorBody);
    throw new Error(`Gemini Image API returned ${response.status}`);
  }

  const data = await response.json() as any;
  const candidates = data.candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini returned no candidates for image generation (possibly due to safety settings).");
  }

  const content = candidates[0].content;
  if (!content || !content.parts) {
    console.error("[Gemini Image] Safety block or empty content returned:", JSON.stringify(candidates[0], null, 2));
    throw new Error("Image generation blocked by safety filters. Try removing real people's names from the prompt.");
  }

  const parts = content.parts;

  for (const part of parts) {
    if (part.inlineData) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }

  throw new Error("Gemini response did not contain an image");
}

// Helper to generate and save an image to S3, returns the S3 URL
async function generateAndSaveImage(prompt: string): Promise<string> {
  console.log(`[Imagen 3] Generating image...`);
  console.log(`[Imagen 3] Prompt: ${prompt.substring(0, 100)}...`);

  const buffer = await generateImageWithGemini(prompt);

  const filename = `cover_${Date.now()}.png`;
  const coverImage = await uploadToS3(buffer, filename, "image/png");
  console.log(`[Imagen 3] Image uploaded to S3: ${coverImage}`);
  return coverImage;
}

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

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
}

function getGroundedGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-3.6-flash",
    tools: [{ googleSearch: {} } as any]
  });
}

async function generateWithRetry(model: any, prompt: string, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      const isTemporaryError = error.status === 503 || error.status === 429 || (error.message && error.message.includes("503"));
      if (isTemporaryError && i < maxRetries - 1) {
        const delay = Math.pow(2, i + 1) * 1000;
        console.warn(`[AI] Service busy/unavailable (${error.status || '503'}). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to generate content after max retries");
}

// ─── AI: Suggest Titles ──────────────────────────────────
router.post(
  "/ai/suggest-titles",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { content, category } = req.body;
    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    try {
      const model = getGeminiModel();
      const prompt = `You are a world-class editorial copywriter for "The Panda Nomad", a premium editorial blog about startups, creativity, and thoughtful living. 

Given this article content (first 2000 chars):
---
${content.substring(0, 2000)}
---

Category: ${category || "General"}

Generate exactly 3 compelling, click-worthy but non-clickbait article titles. They should feel premium, intelligent, and slightly poetic. Think New Yorker meets Monocle magazine.

Return ONLY a JSON array of 3 strings, no markdown formatting, no code blocks. Example: ["Title 1", "Title 2", "Title 3"]`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();

      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const titles = JSON.parse(cleaned);
      if (!Array.isArray(titles)) {
        throw new Error("AI returned invalid format: expected an array");
      }

      res.json({ titles, source: "gemini" });
    } catch (error: any) {
      console.error("AI Title Generation failed:", error);
      res.status(500).json({ message: error.message || "AI title generation failed" });
    }
  },
);

// ─── AI: Editorial Review ────────────────────────────────
router.post(
  "/ai/editorial-review",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { content, title } = req.body;
    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    try {
      const model = getGeminiModel();
      const prompt = `You are the chief editor of "The Panda Nomad", a premium editorial blog. Our brand voice is: Calm, Intelligent, Curious, Premium, and Slightly Poetic.

Review this article:
Title: ${title || "Untitled"}
Content (first 3000 chars):
---
${content.substring(0, 3000)}
---

Provide an editorial review as JSON with these exact keys:
{
  "score": <number 1-100>,
  "summary": "<2-3 sentence editorial summary>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>", "<suggestion 4>"],
  "readability": "<Excellent|Good|Fair|Poor>",
  "tone": "<matches/partially matches/does not match> our brand voice"
}

Return ONLY valid JSON, no markdown, no code blocks.`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();

      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const review = JSON.parse(cleaned);

      res.json({ ...review, source: "gemini" });
    } catch (error: any) {
      console.error("AI Editorial Review failed:", error);
      res.status(500).json({ message: error.message || "AI editorial review failed" });
    }
  },
);

// ─── AI: Generate SEO Meta ───────────────────────────────
router.post(
  "/ai/generate-seo",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { title, content, category } = req.body;
    if (!title || !content) {
      res.status(400).json({ message: "Title and content are required" });
      return;
    }

    try {
      const model = getGeminiModel();
      const prompt = `You are an SEO expert for "The Panda Nomad" blog. Generate SEO metadata for this article:

Title: ${title}
Category: ${category || "General"}
Content (first 2000 chars):
---
${content.substring(0, 2000)}
---

Return JSON with these exact keys:
{
  "metaTitle": "<60 chars max, include brand name>",
  "metaDescription": "<155 chars max, compelling description>",
  "focusKeyword": "<primary focus keyword>",
  "slug": "<url slug based on keyword>"
}

Return ONLY valid JSON, no markdown, no code blocks.`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();

      const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const seo = JSON.parse(cleaned);

      res.json({ ...seo, source: "gemini" });
    } catch (error: any) {
      console.error("AI SEO generation failed:", error);
      res.status(500).json({ message: error.message || "SEO generation failed" });
    }
  },
);


// ─── AI: Auto-generate Excerpt ──────────────────────────
router.post(
  "/ai/generate-excerpt",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { content, title } = req.body;
    if (!content) {
      res.status(400).json({ message: "Content is required" });
      return;
    }

    try {
      const model = getGeminiModel();
      const prompt = `Write a compelling 1-2 sentence excerpt (max 200 chars) for this article. It should entice readers to click and read more. Write in the voice of a premium editorial magazine.

Title: ${title || "Untitled"}
Content (first 2000 chars):
---
${content.substring(0, 2000)}
---

Return ONLY the excerpt text, no quotes, no formatting.`;

      const result = await model.generateContent(prompt);
      const excerpt = result.response.text().trim().replace(/^["']|["']$/g, "");

      res.json({ excerpt, source: "gemini" });
    } catch (error: any) {
      console.error("AI Excerpt generation failed:", error);
      res.status(500).json({ message: error.message || "Excerpt generation failed" });
    }
  },
);

// ─── AI: Write Full Blog with News & Image ──────────────
router.post(
  "/ai/write-full-blog",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { topic } = req.body;
    if (!topic) {
      res.status(400).json({ message: "Topic/Title is required" });
      return;
    }

    // Prepare SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (event: string, data?: any) => {
      res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
    };

    try {
      sendEvent("progress", { message: "Gathering and verifying facts via Google Search..." });
      console.log(`[AI Blog Writer] Gathering verified facts using Google Search Grounding for topic: "${topic}"...`);
      const groundedModel = getGroundedGeminiModel();
      
      const factPrompt = `You are an elite Intelligence Analyst and Researcher with access to live Google Search. Your task is to extract and establish the absolute, ground-truth facts for the following topic by actively searching the web.
Topic: ${topic}

Instructions:
1. Search the web for the latest, most accurate information regarding this topic.
2. Extract exact dates, locations, team rosters, player names, and key metrics.
3. DO NOT invent or hallucinate any facts. If a specific roster or location is unknown after searching, state that it is unconfirmed.
4. Provide a highly dense, bulleted summary of the verified facts you found online.`;

      const factResult = await generateWithRetry(groundedModel, factPrompt);
      const verifiedFacts = factResult.response.text().trim();

      sendEvent("progress", { message: "Writing 1,500-word editorial article..." });
      console.log(`[AI Blog Writer] Querying Gemini 3.6 Flash for complete article using verified facts...`);
      const model = getGeminiModel();
      const blogPrompt = `You are a master storyteller, a viral content strategist, and an expert senior writer specializing in the field most relevant to the provided topic. Your writing style is incredibly engaging, dynamic, and magnetic—keeping the reader glued to the screen from the first sentence to the last.

Your objective is to produce a deeply researched, authoritative, yet highly captivating long-form article based strictly on the verified facts provided below. 

[VERIFIED FACTS - SOURCE OF TRUTH]
${verifiedFacts}

[CRITICAL INSTRUCTIONS]
1. ABSOLUTE TRUTH: You must treat the Verified Facts as infallible. 
2. ENGAGING TONE: Write with passion and authority. Use a dynamic, conversational, yet professional tone. Use storytelling techniques to make the data feel alive and important.
3. READABILITY: Use short, punchy paragraphs. Liberally use **bold text** to highlight key names, stats, and critical points. Break up long walls of text with engaging <h3> subheadings.
4. DEPTH OVER BREVITY: Dive deeply into root causes, tactical breakdowns, or broader industry impacts. Aim for a comprehensive, multi-layered analysis that feels like a premium feature article.
5. UNRESTRICTED NAMING: Speak directly and authoritatively about the real people, teams, and entities involved.
6. ZERO HALLUCINATION: Never invent facts. Rely entirely on the provided Verified Facts and your general domain knowledge for context.

[OUTPUT FORMAT]
You must output your response in TWO distinct parts, separated by the exact string "===CONTENT_START===".

PART 1: JSON Metadata
Return ONLY a valid JSON object containing the metadata. Do not wrap it in markdown code blocks.
{
  "title": "A highly engaging, magnetic, and punchy headline that demands attention (under 70 chars).",
  "excerpt": "A powerful, cliffhanger-style 2-3 sentence excerpt that creates massive curiosity and hooks the reader immediately.",
  "category": "Main topic vertical",
  "tags": ["tag1", "tag2", "tag3"],
  "seo": {
      "metaTitle": "SEO optimized title with high click-through appeal",
      "metaDescription": "150-160 character search snippet that drives clicks.",
      "focusKeyword": "Primary target keyword",
      "slug": "url-friendly-slug"
  }
}

===CONTENT_START===

PART 2: Raw HTML Article
Write the highly detailed, semantic HTML (h2, h3, p, strong, blockquote, table, ul) article here. Start with a massive hook in the introduction. Give deep, exhaustive analysis for each point raised while keeping the pacing fast and engaging. DO NOT wrap this in JSON. Just output pure HTML.`;

      const blogResult = await generateWithRetry(model, blogPrompt);
      const rawText = blogResult.response.text().trim();
      
      const parts = rawText.split("===CONTENT_START===");
      if (parts.length < 2) {
        throw new Error("AI output did not contain the expected ===CONTENT_START=== separator.");
      }

      const jsonStr = parts[0].replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const articleData = JSON.parse(jsonStr);
      articleData.content = parts[1].replace(/```html\s*/g, "").replace(/```\s*/g, "").trim();

      sendEvent("progress", { message: "Finalizing editorial content..." });

      const finalData = {
        title: articleData.title,
        excerpt: articleData.excerpt,
        content: articleData.content,
        category: articleData.category,
        tags: articleData.tags,
        coverImage: "",
        coverImagePrompt: "",
        seo: articleData.seo,
        source: "gemini",
      };

      sendEvent("complete", finalData);
      res.end();
    } catch (error: any) {
      console.error("AI Full Blog Generation failed:", error);
      sendEvent("error", { message: error.message || "AI full blog generation failed" });
      res.end();
    }
  },
);

// ─── Regenerate AI Image ──────────────────────────────────
router.post(
  "/ai/regenerate-image",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { prompt, oldImagePath } = req.body;
    if (!prompt) {
      res.status(400).json({ message: "Prompt is required" });
      return;
    }

    try {
      // 1. Delete old image if provided
      if (oldImagePath) {
        if (oldImagePath.includes("amazonaws.com") || oldImagePath.includes("blog-post1541")) {
          await deleteFromS3(oldImagePath);
        } else if (oldImagePath.startsWith("/uploads/")) {
          const oldFileName = oldImagePath.replace("/uploads/", "");
          const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
          try {
            await fs.unlink(oldFilePath);
            console.log(`[AI Image] Deleted old image: ${oldFilePath}`);
          } catch (e: any) {
            console.log(`[AI Image] Could not delete old image (might not exist): ${e.message}`);
          }
        }
      }

      // 2. Generate new image with Imagen 3
      const coverImage = await generateAndSaveImage(prompt);
      res.json({ coverImage });
    } catch (error: any) {
      console.error("AI Image Regeneration failed:", error);
      res.status(500).json({ message: error.message || "AI image regeneration failed" });
    }
  },
);

// ─── Upload Custom Image ──────────────────────────────────
router.post(
  "/ai/upload-image",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { imageBase64, oldImagePath } = req.body;
    if (!imageBase64) {
      res.status(400).json({ message: "Image data is required" });
      return;
    }

    try {
      // 1. Delete old image if provided
      if (oldImagePath) {
        if (oldImagePath.includes("amazonaws.com") || oldImagePath.includes("blog-post1541")) {
          await deleteFromS3(oldImagePath);
        } else if (oldImagePath.startsWith("/uploads/")) {
          const oldFileName = oldImagePath.replace("/uploads/", "");
          const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
          try {
            await fs.unlink(oldFilePath);
            console.log(`[Upload Image] Deleted old image: ${oldFilePath}`);
          } catch (e: any) {
            console.log(`[Upload Image] Could not delete old image: ${e.message}`);
          }
        }
      }

      // 2. Process base64
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ message: "Invalid base64 image format" });
        return;
      }

      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const mimeType = `image/${ext}`;
      const buffer = Buffer.from(matches[2], "base64");

      const filename = `upload_${Date.now()}.${ext}`;
      const coverImage = await uploadToS3(buffer, filename, mimeType);

      res.json({ coverImage });
    } catch (error: any) {
      console.error("Image Upload failed:", error);
      res.status(500).json({ message: error.message || "Image upload failed" });
    }
  },
);

// ─── Public Web Image Search Helper ───────────────────────
async function fetchPublicWebImages(query: string): Promise<Array<{ url: string; thumbnail: string; title: string }>> {
  const images: Array<{ url: string; thumbnail: string; title: string }> = [];

  // 1. Google Custom Search API (if credentials configured)
  const googleApiKey = process.env.GOOGLE_CUSTOM_SEARCH_KEY || process.env.GEMINI_API_KEY;
  const googleCx = process.env.GOOGLE_CX;

  if (googleApiKey && googleCx) {
    try {
      const googleRes = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&searchType=image&q=${encodeURIComponent(query)}&num=8`
      );
      if (googleRes.ok) {
        const data = (await googleRes.json()) as any;
        if (data.items && Array.isArray(data.items)) {
          for (const item of data.items) {
            images.push({
              url: item.link,
              thumbnail: item.image?.thumbnailLink || item.link,
              title: item.title || query,
            });
          }
          if (images.length >= 4) return images;
        }
      }
    } catch (err: any) {
      console.warn("[Web Images] Google Custom Search failed:", err.message);
    }
  }

  // 2. Unsplash Public NAPI Search
  try {
    const unsplashRes = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=8`
    );
    if (unsplashRes.ok) {
      const data = (await unsplashRes.json()) as any;
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          images.push({
            url: item.urls?.regular || item.urls?.full || item.urls?.small,
            thumbnail: item.urls?.small || item.urls?.thumb,
            title: item.alt_description || item.description || query,
          });
        }
      }
    }
  } catch (err: any) {
    console.warn("[Web Images] Unsplash search failed:", err.message);
  }

  // 3. Wikimedia Commons Public Image Search
  if (images.length < 4) {
    try {
      const wikiRes = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&format=json&prop=imageinfo&iiprop=url&gsrlimit=8`
      );
      if (wikiRes.ok) {
        const data = (await wikiRes.json()) as any;
        if (data.query?.pages) {
          const pages = Object.values(data.query.pages) as any[];
          for (const page of pages) {
            const info = page.imageinfo?.[0];
            if (info?.url && !info.url.endsWith(".svg")) {
              images.push({
                url: info.url,
                thumbnail: info.url,
                title: page.title ? page.title.replace(/^File:/, "") : query,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("[Web Images] Wikimedia search failed:", err.message);
    }
  }

  return images;
}

// ─── Route: Search Web Images ─────────────────────────────
router.post(
  "/ai/search-images",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { query } = req.body;
    if (!query) {
      res.status(400).json({ message: "Search query is required" });
      return;
    }

    try {
      const images = await fetchPublicWebImages(query);
      res.json({ images });
    } catch (error: any) {
      console.error("Search Web Images failed:", error);
      res.status(500).json({ message: error.message || "Failed to search images" });
    }
  },
);

// ─── Route: Select & Download Web Image ───────────────────
router.post(
  "/ai/select-web-image",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const { imageUrl, oldImagePath } = req.body;
    if (!imageUrl) {
      res.status(400).json({ message: "Image URL is required" });
      return;
    }

    try {
      // 1. Delete old image if provided
      if (oldImagePath) {
        if (oldImagePath.includes("amazonaws.com") || oldImagePath.includes("blog-post1541")) {
          await deleteFromS3(oldImagePath);
        } else if (oldImagePath.startsWith("/uploads/")) {
          const oldFileName = oldImagePath.replace("/uploads/", "");
          const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
          try {
            await fs.unlink(oldFilePath);
          } catch (e) {}
        }
      }

      // 2. Fetch and upload web image to AWS S3
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        res.json({ coverImage: imageUrl });
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get("content-type") || "image/jpeg";
      let ext = "jpg";
      if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("webp")) ext = "webp";
      else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";

      const filename = `web_${Date.now()}.${ext}`;
      const coverImage = await uploadToS3(buffer, filename, contentType);

      res.json({ coverImage });
    } catch (error: any) {
      console.error("Select Web Image failed:", error);
      res.json({ coverImage: imageUrl });
    }
  },
);

// ─── AI: Generate Daily Hero Articles (Cron/Manual) ────────
export async function runDailyHeroGeneration(sendEvent?: (event: string, data?: any) => void) {
  const sportsTopic = Math.random() > 0.5 ? "Football recent matches and trends (exclusively football, no cricket)" : "Cricket recent matches and trends (exclusively cricket, no football)";
  const topicsList = [
    { name: "Artificial Intelligence globally", category: "Artificial Intelligence" },
    { name: "Entrepreneurship and startups (India or Global)", category: "Entrepreneurship" },
    { name: "Corporate Leadership and management trends (India)", category: "Leadership" },
    { name: sportsTopic, category: "Sports" },
    { name: "Latest bestselling books, publishing trends, or major book releases", category: "Books" },
    { name: "Technology news and developments (India)", category: "Technology" },
    { name: "Business news and trends (India)", category: "Business" },
    { name: "Finance and markets (India or Global)", category: "Finance" },
    { name: "Productivity tips and frameworks (India or Global)", category: "Productivity" },
    { name: "Psychology insights and behavioral trends (India)", category: "Psychology" },
    { name: "Philosophy discussions or thought pieces (India or Global)", category: "Philosophy" },
    { name: "Life advice, lifestyle, and wellbeing (Global or India)", category: "Life" },
    { name: "Esports tournaments, teams, and gaming news (India)", category: "Esports" },
    { name: "Investing strategies, markets, and news (India or Global)", category: "Investing" },
    { name: "Career advice, job market trends, and growth (India)", category: "Career" },
    { name: "Health & Fitness trends and tips (India)", category: "Health & Fitness" },
    { name: "Innovative Ideas and thought experiments (India or Global)", category: "Ideas" },
    { name: "Society & Culture trends and discussions (India)", category: "Society & Culture" },
    { name: "In-depth business or situational Case Studies (India)", category: "Case Studies" }
  ];

  const generatedArticles = [];
  
  if (sendEvent) sendEvent("progress", { message: `Starting generation of ${topicsList.length} articles...` });

  for (let i = 0; i < topicsList.length; i++) {
    const t = topicsList[i];
    if (sendEvent) sendEvent("progress", { message: `Generating [${i+1}/${topicsList.length}]: ${t.category}...` });
    console.log(`[Daily Cron] Processing topic ${i+1}/${topicsList.length}: ${t.category}`);

    try {
      // 1. Gather Grounded Facts
      const groundedModel = getGroundedGeminiModel();
      const factPrompt = `Search the web for the absolute latest, breaking news or major recent developments regarding: ${t.name}. Provide a dense, factual bulleted summary of exactly what happened, dates, and key figures. Do not hallucinate.`;
      const factResult = await generateWithRetry(groundedModel, factPrompt);
      const verifiedFacts = factResult.response.text().trim();

      // 2. Write Article
      const model = getGeminiModel();
      const blogPrompt = `You are a premium editorial journalist for "The Panda Nomad".
Write a highly engaging, thought-leadership article based strictly on these latest facts:
${verifiedFacts}

[OUTPUT FORMAT]
You must output your response in TWO distinct parts, separated by the exact string "===CONTENT_START===".

PART 1: JSON Metadata
{
  "title": "Punchy, attention-grabbing headline (under 70 chars)",
  "excerpt": "2 sentence hook excerpt.",
  "category": "${t.category}",
  "tags": ["news", "latest", "${t.category.toLowerCase()}"],
  "seo": {
      "metaTitle": "SEO title",
      "metaDescription": "SEO description",
      "focusKeyword": "keyword",
      "slug": "url-friendly-slug-daily-${Date.now()}"
  }
}

===CONTENT_START===

PART 2: HTML Article
Write the highly detailed, semantic HTML (h2, h3, p, strong) article here.`;

      const blogResult = await generateWithRetry(model, blogPrompt);
      const parts = blogResult.response.text().split("===CONTENT_START===");
      if (parts.length < 2) throw new Error("Invalid output format");

      const articleData = JSON.parse(parts[0].replace(/```json\s*/g, "").replace(/```\s*/g, "").trim());
      articleData.content = parts[1].replace(/```html\s*/g, "").replace(/```\s*/g, "").trim();

      // 3. Generate Image Prompt & Image
      const promptGenModel = getGeminiModel();
      let imgPrompt = articleData.title || sportsTopic;
      try {
        const imgPromptRes = await generateWithRetry(promptGenModel, `Create a photorealistic, 8K image prompt without any text or real people names for this article: ${articleData.content.substring(0, 1000)}`);
        imgPrompt = imgPromptRes.response.text().trim();
      } catch (pErr: any) {
        console.warn("[Daily Cron] Image prompt generation failed, falling back to article title:", pErr.message);
      }
      const coverImage = await generateAndSaveImage(imgPrompt);

      // 4. Save to DB
      const newArticle = {
        slug: articleData.seo?.slug || `daily-${t.category.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        title: articleData.title,
        excerpt: articleData.excerpt,
        content: articleData.content,
        coverImage,
        category: articleData.category,
        tags: articleData.tags || [],
        author: "PandaAI Daily",
        authorTitle: "Automated News Desk",
        authorAvatar: "/panda-ai-logo.png",
        publishedDate: new Date(),
        readingTimeMinutes: Math.ceil((articleData.content.split(" ").length || 1000) / 200),
        status: "published",
        featured: true, // Will be set to true
        views: 0
      };

      generatedArticles.push(newArticle);
    } catch (e: any) {
      console.error(`[Daily Cron] Failed to generate for topic ${t.category}:`, e.message);
      if (sendEvent) sendEvent("error", { message: `Failed on ${t.category}: ${e.message}` });
    }
  }

  // 5. Unfeature old, feature new
  if (generatedArticles.length > 0) {
    if (sendEvent) sendEvent("progress", { message: "Updating database to rotate hero slider..." });
    await db.update(articlesTable).set({ featured: false });
    for (const article of generatedArticles) {
      await db.insert(articlesTable).values(article);
    }
  }

  if (sendEvent) sendEvent("complete", { generatedCount: generatedArticles.length });
  return generatedArticles;
}

router.post(
  "/ai/cron/generate-daily-hero",
  authMiddleware,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (event: string, data?: any) => {
      res.write(`data: ${JSON.stringify({ event, ...data })}\n\n`);
    };

    try {
      await runDailyHeroGeneration(sendEvent);
      res.end();
    } catch (err: any) {
      sendEvent("error", { message: err.message });
      res.end();
    }
  }
);

export default router;
