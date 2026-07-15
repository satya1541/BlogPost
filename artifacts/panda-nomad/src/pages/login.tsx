import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

export default function Login() {
  const { login, loginWithGoogle, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleGoogleResponse = async (response: any) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(response.credential, "login");
      setLocation("/");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to sign in with Google.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        google.accounts.id.initialize({
          client_id: "324470354714-ftelttrnvse7q1f95ennl70ii330kou8.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });
        const container = document.getElementById("google-signin-btn");
        if (container) {
          google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: "100%",
          });
        }
      }
    };

    initializeGoogleSignIn();

    const timer = setInterval(() => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to sign in. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotMessage(null);
    try {
      const data = await customFetch<{ message: string; resetLink?: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotMessage(data.message + (data.resetLink ? ` (Dev link: ${data.resetLink})` : ""));
    } catch (err: any) {
      setForgotMessage(err?.message || "Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-md w-full space-y-8 bg-background p-8 border border-border/50">
        <div className="text-center">
          <h2 className="font-serif text-4xl tracking-tight">
            {showForgot ? "Reset Password" : "Sign In"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {showForgot
              ? "Enter your email to receive a password reset link"
              : "Welcome back to The Panda Nomad"}
          </p>
        </div>
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-sm">
            {error}
          </div>
        )}
        {forgotMessage && (
          <div className="bg-accent/10 border border-accent/20 text-accent text-sm p-4 rounded-sm">
            {forgotMessage}
          </div>
        )}

        {showForgot ? (
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <input
                id="forgot-email"
                name="email"
                type="text"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full flex justify-center py-4 px-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 text-sm"
            >
              {forgotLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setShowForgot(false); setForgotMessage(null); }}
                className="text-sm text-accent hover:underline font-medium"
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email-address"
                    className="block text-sm font-medium text-muted-foreground"
                  >
                    Username or Email
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-muted-foreground"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setForgotEmail(email); }}
                      className="text-xs text-accent hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-4 px-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold tracking-wider">
                <span className="bg-background px-3 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <div id="google-signin-btn" className="w-full" />
            </div>

            <div className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-accent hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

