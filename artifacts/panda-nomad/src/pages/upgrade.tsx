import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { CheckCircle2, Shield, Zap, Sparkles } from "lucide-react";

export function Upgrade() {
  const { user, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const data = await customFetch<{ user: any }>("/api/payments/upgrade", {
        method: "POST",
      });
      if (data.user) {
        await refreshUser();
        alert("Success! You are now a Premium Member 🎉");
        navigate("/dashboard");
      }
    } catch (err: any) {
      alert(err.message || "Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-xs font-semibold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Premium Tiers
        </div>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light mb-4">
          Accelerate your <span className="italic text-accent">Nomad</span> journey
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Unlock unlimited access to high-signal founder playbooks, exclusive member directories, and premium startup resources.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
        {/* Registered Tier */}
        <div className="border border-border bg-background p-8 flex flex-col justify-between rounded-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl font-light">Registered</h3>
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Perfect for casual readers who want basic tracking.
            </p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-serif">$0</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Free Forever</span>
            </div>
            <ul className="space-y-4 text-sm text-muted-foreground border-t border-border/40 pt-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Read all public essays</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Bookmark and Like articles</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Basic reading history tracking</span>
              </li>
            </ul>
          </div>
          <Link
            href="/signup"
            className="mt-8 block w-full py-3 bg-muted text-foreground text-center font-medium text-sm hover:bg-muted/80 transition-colors"
          >
            Sign Up Free
          </Link>
        </div>

        {/* Premium Tier */}
        <div className="border border-primary bg-background p-8 flex flex-col justify-between rounded-sm relative shadow-lg shadow-accent/5">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-sm">
            Recommended
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl font-light">Premium</h3>
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Unlock our complete toolkit and direct founder networking hub.
            </p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-serif">$15</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">/ month</span>
            </div>
            <ul className="space-y-4 text-sm text-foreground border-t border-border/40 pt-6">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>Everything in Registered</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">Download Premium Startup Toolkits & Guides</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">Full access to Community Forum boards & posting</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span className="font-medium">Read exclusive detailed founder case studies</span>
              </li>
            </ul>
          </div>
          {user?.role === "premium" || user?.role === "admin" || user?.role === "super_admin" ? (
            <div className="mt-8 block w-full py-3 bg-accent/15 text-accent text-center text-sm font-semibold">
              You are on Premium!
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-8 block w-full py-3 bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : "Upgrade to Premium (Simulated)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
