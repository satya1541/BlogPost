import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register, loginWithGoogle, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = async (response: any) => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(response.credential, "signup");
      setLocation("/");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to register with Google.";
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
        const container = document.getElementById("google-signup-btn");
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
      await register(email, password);
      setLocation("/");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Failed to register. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-md w-full space-y-8 bg-background p-8 border border-border/50">
        <div className="text-center">
          <h2 className="font-serif text-4xl tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join the global founder & creator community
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
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-muted-foreground"
              >
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-muted-foreground"
              >
                Password
              </label>
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
              {loading ? "Creating account..." : "Sign Up"}
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
          <div id="google-signup-btn" className="w-full" />
        </div>

        <div className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-accent hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
