import { Router } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

// Helper to generate and save an image, returns the URL path
async function generateAndSaveImage(prompt: string): Promise<string> {
  console.log(`[Imagen 3] Generating image...`);
  console.log(`[Imagen 3] Prompt: ${prompt.substring(0, 100)}...`);

  const buffer = await generateImageWithGemini(prompt);

  const filename = `cover_${Date.now()}.png`;
  const filepath = path.join(UPLOADS_DIR, filename);

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(filepath, buffer);

  const coverImage = `/uploads/${filename}`;
  console.log(`[Imagen 3] Image saved to ${coverImage}`);
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
  return genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
}

function getGroundedGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash",
    tools: [{ googleSearch: {} } as any]
  });
}

async function generateWithRetry(model: any, prompt: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await model.generateContent(prompt);
    } catch (error: any) {
      if (error.status === 503 && i < maxRetries - 1) {
        console.warn(`[AI] 503 Service Unavailable. Retrying in ${Math.pow(2, i)}s...`);
        await new Promise(res => setTimeout(res, Math.pow(2, i) * 1000));
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
      console.log(`[AI Blog Writer] Querying Gemini 3.5 Flash for complete article using verified facts...`);
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

      sendEvent("progress", { message: "Generating 8K photorealistic cover image..." });
      console.log(`[AI Blog Writer] Analyzing the written article to generate a highly accurate image prompt...`);
      const promptGenModel = getGeminiModel();
      const imagePromptInstruction = `You are an expert AI image prompt engineer. Read the following blog post about "${topic}".
Create a highly detailed, photorealistic image-generation prompt that perfectly captures the specific scene, subjects, teams, players, or mood mentioned in the article.

Requirements for the image prompt:
- Photorealistic, Cinematic lighting, Editorial photography, 8K, Ultra realistic
- Accurate to the topic and the specific details mentioned in the article
- NEVER include the names of real people, celebrities, or politicians. Describe them generically (e.g., "a visionary tech CEO", "a young esports athlete") to bypass safety filters.
- Sharp focus, Natural colors
- No text, No logos, No watermark, Professional composition, Documentary photography style

Return ONLY the plain text prompt. Do not include markdown, explanations, or introductory text.

Article Content:
${articleData.content.substring(0, 5000)}`;

      const promptGenResult = await promptGenModel.generateContent(imagePromptInstruction);
      const highlyAccuratePrompt = promptGenResult.response.text().trim();
      console.log(`[AI Blog Writer] Generated Image Prompt: ${highlyAccuratePrompt}`);

      const cleanPrompt = highlyAccuratePrompt || (articleData.coverImagePrompt || topic).trim();
      let coverImage = "";

      try {
        coverImage = await generateAndSaveImage(cleanPrompt);
      } catch (imgError: any) {
        console.error("[AI Blog Writer] Imagen 3 failed:", imgError.message);
      }

      sendEvent("progress", { message: "Finalizing..." });

      const finalData = {
        title: articleData.title,
        excerpt: articleData.excerpt,
        content: articleData.content,
        category: articleData.category,
        tags: articleData.tags,
        coverImage,
        coverImagePrompt: cleanPrompt,
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
      if (oldImagePath && oldImagePath.startsWith("/uploads/")) {
        const oldFileName = oldImagePath.replace("/uploads/", "");
        const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
        try {
          await fs.unlink(oldFilePath);
          console.log(`[AI Image] Deleted old image: ${oldFilePath}`);
        } catch (e: any) {
          console.log(`[AI Image] Could not delete old image (might not exist): ${e.message}`);
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
      if (oldImagePath && oldImagePath.startsWith("/uploads/")) {
        const oldFileName = oldImagePath.replace("/uploads/", "");
        const oldFilePath = path.join(UPLOADS_DIR, oldFileName);
        try {
          await fs.unlink(oldFilePath);
          console.log(`[Upload Image] Deleted old image: ${oldFilePath}`);
        } catch (e: any) {
          console.log(`[Upload Image] Could not delete old image: ${e.message}`);
        }
      }

      // 2. Process base64
      // imageBase64 should be something like "data:image/png;base64,iVBORw0KGgo..."
      const matches = imageBase64.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ message: "Invalid base64 image format" });
        return;
      }

      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const buffer = Buffer.from(matches[2], "base64");

      const filename = `upload_${Date.now()}.${ext}`;
      const filepath = path.join(UPLOADS_DIR, filename);

      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      await fs.writeFile(filepath, buffer);

      res.json({ coverImage: `/uploads/${filename}` });
    } catch (error: any) {
      console.error("Image Upload failed:", error);
      res.status(500).json({ message: error.message || "Image upload failed" });
    }
  },
);

export default router;
