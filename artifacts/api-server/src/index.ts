import app from "./app";
import { logger } from "./lib/logger";
import { seedAdminUser } from "./lib/seed-admin";
import os from "os";
import cron from "node-cron";
import { runDailyHeroGeneration } from "./routes/ai";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

function getNetworkAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  console.log(`\n  ➜  Local:   http://localhost:${port}/`);
  const ip = getNetworkAddress();
  if (ip) {
    console.log(`  ➜  Network: http://${ip}:${port}/`);
  }

  // Seed the single admin account into the DB
  await seedAdminUser();

  // Start scheduled publishing checker runner (every 60 seconds)
  const { db, articlesTable } = await import("@workspace/db");
  const { and, eq, lte } = await import("drizzle-orm");
  setInterval(async () => {
    try {
      await db
        .update(articlesTable)
        .set({ status: "published" })
        .where(
          and(
            eq(articlesTable.status, "scheduled"),
            lte(articlesTable.publishedDate, new Date())
          )
        );
    } catch (e) {
      console.error("Scheduled publishing runner error:", e);
    }
  }, 60000);

  // Start cron for daily hero generation (Runs at midnight every day)
  // Disabled per user request - manual generation only
  // cron.schedule("0 0 * * *", async () => {
  //   console.log("[Cron] Running daily hero generation...");
  //   try {
  //     await runDailyHeroGeneration();
  //     console.log("[Cron] Daily hero generation completed successfully.");
  //   } catch (error) {
  //     console.error("[Cron] Failed to run daily hero generation:", error);
  //   }
  // });

  console.log();
});

