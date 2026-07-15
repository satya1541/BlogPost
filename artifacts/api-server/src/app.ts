import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middleware/auth";
import router from "./routes";
import feedsRouter from "./routes/feeds";

import path from "path";
import { fileURLToPath } from "url";

const app: Express = express();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

app.use(cookieParser(process.env.SESSION_SECRET || "dev-fallback-secret"));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(authMiddleware);

app.use("/uploads", express.static(UPLOADS_DIR));
app.use(feedsRouter); // RSS & Sitemap at root level (/feeds/rss, /sitemap.xml)
app.use("/api", router);

export default app;
