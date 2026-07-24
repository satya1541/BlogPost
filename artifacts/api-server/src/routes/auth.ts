import { Router } from "express";
import { db, usersTable, followedTopicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../lib/crypto";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";
import { signToken } from "../lib/token";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/register", async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  if (email.toUpperCase() === "ADMIN") {
    res.status(403).json({ message: "This username is reserved" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const passwordHash = hashPassword(password);
    const verificationToken = generateToken();

    const [insertResult] = await db.insert(usersTable).values({
      email,
      passwordHash,
      role: "registered",
      displayName: displayName || null,
      verificationToken,
    });

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, insertResult.insertId))
      .limit(1);

    // Log verification link to console (no SMTP in dev)
    const verifyLink = `/reset-password?verify=${verificationToken}`;
    console.log(`[Auth] Email verification link for ${email}: ${verifyLink}`);

    res.cookie("session_token", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const token = signToken(user.id.toString());
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ ...userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: "Failed to register user" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.cookie("session_token", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const token = signToken(user.id.toString());
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ message: "Failed to log in" });
  }
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("session_token");
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { passwordHash: _, resetToken: _r, resetTokenExpiry: _e, verificationToken: _v, ...userWithoutSensitive } = req.user;
  res.json(userWithoutSensitive);
});

// ─── Onboarding ────────────────────────────
router.put("/auth/onboarding", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { name, age, occupation, interests } = req.body;

  try {
    await db
      .update(usersTable)
      .set({
        displayName: name || null,
        ...(age ? { age: parseInt(age, 10) } : {}),
        ...(occupation ? { occupation } : {}),
        onboardingCompleted: true,
      } as any)
      .where(eq(usersTable.id, req.user.id));

    if (Array.isArray(interests)) {
      // Clear existing topics
      await db.delete(followedTopicsTable).where(eq(followedTopicsTable.userId, req.user.id));
      
      // Insert new topics
      if (interests.length > 0) {
        const topicsData = interests.map((topicSlug: string) => ({
          userId: req.user!.id,
          topicSlug,
        }));
        await db.insert(followedTopicsTable).values(topicsData);
      }
    }

    res.json({ message: "Onboarding completed successfully" });
  } catch (error) {
    console.error("[Onboarding Error]", error);
    res.status(500).json({ message: "Failed to save profile setup" });
  }
});

// ─── Forgot Password ────────────────────────────
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: "If that email exists, a reset link has been sent." });
      return;
    }

    const resetToken = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(usersTable)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(usersTable.id, user.id));

    const resetLink = `/reset-password?token=${resetToken}`;
    console.log(`[Auth] Password reset link for ${email}: ${resetLink}`);

    res.json({
      message: "If that email exists, a reset link has been sent.",
      // Include link in dev mode for easy testing
      ...(process.env.NODE_ENV !== "production" ? { resetLink } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to process password reset request" });
  }
});

// ─── Reset Password ────────────────────────────
router.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || typeof token !== "string" || typeof newPassword !== "string") {
    res.status(400).json({ message: "Token and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.resetToken, token))
      .limit(1);

    if (!user) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    if (!user.resetTokenExpiry || new Date(user.resetTokenExpiry) < new Date()) {
      res.status(400).json({ message: "Reset token has expired. Please request a new one." });
      return;
    }

    const newHash = hashPassword(newPassword);

    await db
      .update(usersTable)
      .set({
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpiry: null,
      })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// ─── Send Email Verification ────────────────────────────
router.post("/auth/send-verification", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.emailVerified) {
      res.json({ message: "Email is already verified." });
      return;
    }

    const verificationToken = generateToken();

    await db
      .update(usersTable)
      .set({ verificationToken })
      .where(eq(usersTable.id, userId));

    const verifyLink = `/api/auth/verify-email?token=${verificationToken}`;
    console.log(`[Auth] Email verification link for ${user.email}: ${verifyLink}`);

    res.json({
      message: "Verification email sent. Check the server console for the link.",
      ...(process.env.NODE_ENV !== "production" ? { verifyLink } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

// ─── Verify Email ────────────────────────────
router.get("/auth/verify-email", async (req, res) => {
  const token = req.query.token;

  if (!token || typeof token !== "string") {
    res.status(400).json({ message: "Verification token is required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.verificationToken, token))
      .limit(1);

    if (!user) {
      res.status(400).json({ message: "Invalid verification token" });
      return;
    }

    await db
      .update(usersTable)
      .set({
        emailVerified: true,
        verificationToken: null,
      })
      .where(eq(usersTable.id, user.id));

    // Redirect to dashboard with success message
    res.json({ message: "Email verified successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Failed to verify email" });
  }
});

router.post("/auth/google", async (req, res) => {
  const { credential, action } = req.body;

  if (!credential) {
    res.status(400).json({ message: "Google credential token is required" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ message: "Invalid Google credential" });
      return;
    }

    const { sub: googleId, email, name: displayName } = payload;

    // 1. Try to find user by googleId
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, googleId))
      .limit(1);

    if (!user) {
      // 2. If not found by googleId, try to find user by email
      const [existingEmailUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .limit(1);

      if (existingEmailUser) {
        // Link googleId to this account
        await db
          .update(usersTable)
          .set({ googleId, emailVerified: true })
          .where(eq(usersTable.id, existingEmailUser.id));

        // Re-query updated user
        const [updatedUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, existingEmailUser.id))
          .limit(1);
        user = updatedUser;
      } else {
        if (action === "login") {
          res.status(400).json({ message: "Account is not registered. Please sign up now." });
          return;
        }

        // 3. Register a new user
        const [insertResult] = await db.insert(usersTable).values({
          email,
          googleId,
          role: "registered",
          displayName: displayName || null,
          emailVerified: true,
        });

        // Query newly registered user
        const [newUser] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, insertResult.insertId))
          .limit(1);
        user = newUser;
      }
    }

    // Login logic
    res.cookie("session_token", String(user.id), {
      signed: true,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const token = signToken(user.id.toString());
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(200).json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error("[Google Auth Error]", error);
    res.status(500).json({ message: "Failed to authenticate with Google" });
  }
});

export default router;

