import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import {
  Users,
  FileText,
  MessageCircle,
  PenTool,
  LayoutDashboard,
  Download,
  Shield,
  TrendingUp,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalArticles: number;
  totalThreads: number;
}

interface AnalyticsStats {
  totalPageViews: number;
  uniqueReaders: number;
  avgScrollDepth: number;
  readCompletionRate: number;
  topReferrers: { referrer: string; count: number }[];
  newsletterConversionRate: number;
}

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/login");
      } else if (user.role !== "admin" && user.role !== "super_admin") {
        navigate("/");
      } else {
        fetchStats();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchStats = async () => {
    try {
      const statsData = await customFetch<AdminStats>("/api/admin/stats");
      setStats(statsData);
      try {
        const analyticsData = await customFetch<AnalyticsStats>("/api/admin/analytics");
        setAnalytics(analyticsData);
      } catch (e) {
        console.error("Failed to fetch analytics", e);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-7xl animate-pulse">
        <div className="h-10 bg-muted w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="h-32 bg-muted" />
          <div className="h-32 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl animate-in fade-in duration-700">
      {/* Header */}
      <div className="mb-10 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-accent" />
          <h1 className="font-serif text-4xl font-light">
            Admin <span className="italic text-accent">Hub</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Welcome back, {user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="border border-border p-6 bg-muted/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
              Total Users
            </p>
            <p className="text-3xl font-serif">
              {stats?.totalUsers || 0}
            </p>
          </div>
          <Users className="w-8 h-8 text-accent/50" />
        </div>
        <div className="border border-border p-6 bg-muted/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
              Published Articles
            </p>
            <p className="text-3xl font-serif">
              {stats?.totalArticles || 0}
            </p>
          </div>
          <FileText className="w-8 h-8 text-accent/50" />
        </div>
        <div className="border border-border p-6 bg-muted/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
              Community Threads
            </p>
            <p className="text-3xl font-serif">
              {stats?.totalThreads || 0}
            </p>
          </div>
          <MessageCircle className="w-8 h-8 text-accent/50" />
        </div>
      </div>

      {/* Advanced Analytics */}
      {analytics && (
        <div className="mb-16">
          <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
            <TrendingUp className="w-5 h-5 text-accent" />
            Reader Engagement & Traffic
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="border border-border p-6 bg-background rounded-sm">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">Total Page Views</p>
              <p className="text-3xl font-serif">{analytics.totalPageViews}</p>
            </div>
            <div className="border border-border p-6 bg-background rounded-sm">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">Unique Readers</p>
              <p className="text-3xl font-serif">{analytics.uniqueReaders}</p>
            </div>
            <div className="border border-border p-6 bg-background rounded-sm">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">Avg. Scroll Depth</p>
              <p className="text-3xl font-serif">{analytics.avgScrollDepth}%</p>
            </div>
            <div className="border border-border p-6 bg-background rounded-sm">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">Read Completion</p>
              <p className="text-3xl font-serif">{analytics.readCompletionRate}%</p>
            </div>
            <div className="border border-border p-6 bg-background rounded-sm">
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">Newsletter Conv.</p>
              <p className="text-3xl font-serif">{analytics.newsletterConversionRate}%</p>
            </div>
          </div>

          <div className="border border-border p-6 bg-background rounded-sm">
            <h3 className="text-sm font-semibold text-foreground tracking-widest uppercase mb-4">Top Traffic Sources</h3>
            {analytics.topReferrers && analytics.topReferrers.length > 0 ? (
              <div className="space-y-3">
                {analytics.topReferrers.map((ref, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground font-mono truncate max-w-lg">{ref.referrer.replace(/"/g, '')}</span>
                    <span className="font-semibold">{ref.count} views</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No external traffic sources detected yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
        <PenTool className="w-5 h-5 text-accent" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/editor"
          className="flex flex-col items-center justify-center gap-3 p-8 border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <PenTool className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
          <span className="text-sm font-medium">New Article</span>
          <span className="text-xs text-muted-foreground text-center">
            PandaAI-powered markdown editor
          </span>
        </Link>
        <Link
          href="/admin/cms"
          className="flex flex-col items-center justify-center gap-3 p-8 border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <LayoutDashboard className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
          <span className="text-sm font-medium">Content Studio</span>
          <span className="text-xs text-muted-foreground text-center">
            Manage & moderate all content
          </span>
        </Link>
        <Link
          href="/admin/cms"
          className="flex flex-col items-center justify-center gap-3 p-8 border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <Download className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
          <span className="text-sm font-medium">Export Subscribers</span>
          <span className="text-xs text-muted-foreground text-center">
            Download newsletter CSV
          </span>
        </Link>
        <Link
          href="/admin/cms"
          className="flex flex-col items-center justify-center gap-3 p-8 border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <MessageCircle className="w-8 h-8 text-muted-foreground group-hover:text-accent transition-colors" />
          <span className="text-sm font-medium">Moderation</span>
          <span className="text-xs text-muted-foreground text-center">
            Review & manage comments
          </span>
        </Link>
      </div>
    </div>
  );
}
