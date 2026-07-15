import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";
import { signToken } from "../lib/token";

const router = Router();

// Simulate upgrading a user to premium
router.post("/payments/upgrade", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    // 1. Update user role in DB
    await db
      .update(usersTable)
      .set({ role: "premium" })
      .where(eq(usersTable.id, userId));

    // 2. Fetch the updated user record
    const [updatedUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!updatedUser) {
      res.status(404).json({ message: "User not found after update" });
      return;
    }

    // 3. Issue a new token reflecting the premium role
    const token = signToken(updatedUser.id.toString());
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    // We reuse our setCookie helper logic from auth routes
    res.cookie("session_token", String(updatedUser.id), {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ message: "Upgraded to premium!", user: { ...userWithoutPassword, token } });
  } catch (error) {
    res.status(500).json({ message: "Failed to upgrade user role" });
  }
});

export default router;
