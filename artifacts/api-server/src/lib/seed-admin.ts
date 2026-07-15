import { db, usersTable, articlesTable } from "@workspace/db";
import { eq, or, isNull } from "drizzle-orm";
import { hashPassword } from "./crypto";

const ADMIN_EMAIL = "ADMIN";
const ADMIN_PASSWORD = "ADMIN";

/**
 * Seeds the single admin account and backfills article statuses on startup.
 * Idempotent — safe to call on every boot.
 */
export async function seedAdminUser(): Promise<void> {
  try {
    // --- 1. Seed admin account ---
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, ADMIN_EMAIL))
      .limit(1);

    if (!existing) {
      const passwordHash = hashPassword(ADMIN_PASSWORD);
      await db.insert(usersTable).values({
        email: ADMIN_EMAIL,
        passwordHash,
        role: "admin",
      });
      console.log("  ✓  Admin account seeded (ADMIN / ADMIN)");
    }

    // --- 2. Backfill articles: set any draft/null status to "published" ---
    const result = await db
      .update(articlesTable)
      .set({ status: "published" })
      .where(
        or(
          eq(articlesTable.status, "draft"),
          isNull(articlesTable.status as any),
        ),
      );

    const changed = (result as any)[0]?.affectedRows ?? 0;
    if (changed > 0) {
      console.log(`  ✓  Backfilled ${changed} article(s) to status = "published"`);
    }
  } catch (error) {
    console.error("  ✗  Seed failed:", error);
  }
}
