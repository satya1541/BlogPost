import React, { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { customFetch } from "@workspace/api-client-react";

export default function ResetPassword() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const token = params.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await customFetch<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-4 bg-muted/30">
        <div className="max-w-md w-full bg-background p-8 border border-border/50 text-center">
          <h2 className="font-serif text-3xl mb-4">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This password reset link is invalid or missing a token. Please request a new one from the login page.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium text-sm hover:bg-accent hover:text-white transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 px-4 bg-muted/30">
        <div className="max-w-md w-full bg-background p-8 border border-border/50 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-3xl mb-4">Password Reset!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been successfully changed. You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium text-sm hover:bg-accent hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-md w-full space-y-8 bg-background p-8 border border-border/50">
        <div className="text-center">
          <h2 className="font-serif text-4xl tracking-tight">Set New Password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a strong password for your account
          </p>
        </div>
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-sm">
            {error}
          </div>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-muted-foreground">
                New Password
              </label>
              <input
                id="new-password"
                name="password"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-muted-foreground">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                placeholder="Re-enter your new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
