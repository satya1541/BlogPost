import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { Bookmark, Heart, Flame, History, Mail, Bell, Check, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  streakCount: number;
  lastActiveAt?: string | null;
  totalBookmarks: number;
  totalLikes: number;
  isSubscribed: boolean;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [followedTopics, setFollowedTopics] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"essays" | "topics" | "settings">("essays");

  const handleToggleSubscription = async () => {
    if (subscriptionLoading || !stats) return;
    setSubscriptionLoading(true);
    try {
      const res = await customFetch<{ isSubscribed: boolean }>("/api/dashboard/toggle-subscription", {
        method: "POST",
      });
      setStats(prev => prev ? { ...prev, isSubscribed: res.isSubscribed } : null);
      toast({
        title: res.isSubscribed ? "Subscribed" : "Unsubscribed",
        description: res.isSubscribed 
          ? "You will now receive weekly newsletter articles." 
          : "You have unsubscribed from the weekly newsletter.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update newsletter preference.",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLocation("/login");
      return;
    }

    const loadData = async () => {
      try {
        const statsData = await customFetch<Stats>("/api/dashboard/stats");
        setStats(statsData);

        const bookmarksData = await customFetch<any[]>("/api/bookmarks");
        setBookmarks(bookmarksData);

        const likesData = await customFetch<any[]>("/api/likes");
        setLikes(likesData);

        const followedData = await customFetch<string[]>("/api/followed-topics");
        setFollowedTopics(followedData);

        const notificationsData = await customFetch<any[]>("/api/notifications");
        setNotifications(notificationsData);

        try {
          const recRes = await customFetch<any[]>("/api/articles/recommended");
          setRecommended(recRes || []);
        } catch {
          // It's okay if this fails for now
          setRecommended([]);
        }

        // Load recently viewed from localStorage
        const historyKey = `recently-viewed-${user.id}`;
        const localHistory = localStorage.getItem(historyKey);
        if (localHistory) {
          try {
            setRecentlyViewed(JSON.parse(localHistory));
          } catch {
            setRecentlyViewed([]);
          }
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, setLocation, toast]);

  const handleToggleTopic = async (topicSlug: string) => {
    try {
      const res = await customFetch<{ followed: boolean }>("/api/followed-topics/toggle", {
        method: "POST",
        body: JSON.stringify({ topicSlug }),
      });
      setFollowedTopics(prev =>
        res.followed ? [...prev, topicSlug] : prev.filter(t => t !== topicSlug)
      );
      toast({
        title: res.followed ? "Topic Followed" : "Topic Unfollowed",
        description: res.followed 
          ? `You will now receive alerts for ${topicSlug}.`
          : `You unfollowed ${topicSlug}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update topic follow status.",
        variant: "destructive",
      });
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await customFetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-5xl animate-pulse">
        <div className="h-10 bg-muted w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="h-32 bg-muted" />
          <div className="h-32 bg-muted" />
          <div className="h-32 bg-muted" />
        </div>
        <div className="h-64 bg-muted" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl animate-in fade-in duration-700">
      <header className="mb-12 border-b border-border/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl mb-2 font-light">
            Welcome back, <span className="font-normal italic text-accent">{user.displayName || "Nomad"}</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            {user.email} {user.age ? `• ${user.age} years old` : ""} {user.occupation ? `• ${user.occupation}` : ""}
          </p>
        </div>
        {(user.role === "admin" || user.role === "super_admin") && (
          <Link
            href="/admin"
            className="px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm hover:bg-accent hover:text-white transition-colors rounded-sm"
          >
            Go to Admin Panel
          </Link>
        )}
      </header>

      {/* Email Verification Banner */}
      {user.emailVerified === false && (
        <div className="mb-8 border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center justify-between gap-4 rounded-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Verify your email address</p>
              <p className="text-xs text-muted-foreground">Confirm your email to unlock all features and secure your account.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const data = await customFetch<{ message: string; verifyLink?: string }>("/api/auth/send-verification", { method: "POST" });
                toast({
                  title: "Verification Sent",
                  description: data.message + (data.verifyLink ? ` (Dev: ${data.verifyLink})` : ""),
                });
              } catch {
                toast({ title: "Error", description: "Failed to send verification email.", variant: "destructive" });
              }
            }}
            className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors rounded-sm shrink-0"
          >
            Send Verification
          </button>
        </div>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="border border-border p-6 bg-muted/10 flex items-center justify-between rounded-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
              Reading Streak
            </p>
            <p className="text-3xl font-serif">
              {stats?.streakCount || 0} days
            </p>
          </div>
          <Flame className="w-8 h-8 text-accent fill-accent/10" />
        </div>
        <div className="border border-border p-6 bg-muted/10 flex items-center justify-between rounded-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
              Bookmarks
            </p>
            <p className="text-3xl font-serif">
              {stats?.totalBookmarks || 0}
            </p>
          </div>
          <Bookmark className="w-8 h-8 text-accent fill-accent/10" />
        </div>
        <div className="border border-border p-6 bg-muted/10 flex items-center justify-between rounded-sm">
          <div>
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase mb-2">
              Liked Articles
            </p>
            <p className="text-3xl font-serif">{stats?.totalLikes || 0}</p>
          </div>
          <Heart className="w-8 h-8 text-accent fill-accent/10" />
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-border/60 mb-12">
        <button
          onClick={() => setActiveTab("essays")}
          className={`pb-4 px-6 text-sm font-medium border-b-2 transition-all ${
            activeTab === "essays"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          My Library
        </button>
        <button
          onClick={() => setActiveTab("topics")}
          className={`pb-4 px-6 text-sm font-medium border-b-2 transition-all ${
            activeTab === "topics"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Topics & Follows
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-4 px-6 text-sm font-medium border-b-2 transition-all relative ${
            activeTab === "settings"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Alerts & Inbox
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="absolute top-2 right-1.5 w-2 h-2 bg-accent rounded-full" />
          )}
        </button>
      </div>

      {activeTab === "essays" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Bookmarks, Likes, & Recommended Column */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Recommended List */}
            {recommended.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
                  <Flame className="w-5 h-5 text-accent" /> Recommended For You
                </h2>
                <div className="space-y-6">
                  {recommended.map((article) => (
                    <div
                      key={`rec-${article.id}`}
                      className="border border-border/50 p-6 hover:border-primary/50 transition-colors bg-accent/5 rounded-sm"
                    >
                      <span className="text-[10px] font-semibold text-accent tracking-widest uppercase block mb-2">
                        {article.category}
                      </span>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="font-serif text-xl hover:text-accent transition-colors block mb-2"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookmarks List */}
            <div>
              <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
                <Bookmark className="w-5 h-5 text-accent" /> Bookmarked Articles
              </h2>
              {bookmarks.length > 0 ? (
                <div className="space-y-6">
                  {bookmarks.map((article) => (
                    <div
                      key={article.id}
                      className="border border-border/50 p-6 hover:border-primary/50 transition-colors bg-background rounded-sm"
                    >
                      <span className="text-[10px] font-semibold text-accent tracking-widest uppercase block mb-2">
                        {article.category}
                      </span>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="font-serif text-xl hover:text-accent transition-colors block mb-2"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-8 text-center bg-muted/5 rounded-sm">
                  <p className="text-sm text-muted-foreground">
                    No bookmarked articles yet.
                  </p>
                  <Link
                    href="/articles"
                    className="text-sm font-medium text-accent hover:underline mt-2 inline-block"
                  >
                    Explore Articles
                  </Link>
                </div>
              )}
            </div>

            {/* Likes List */}
            <div>
              <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
                <Heart className="w-5 h-5 text-accent" /> Liked Articles
              </h2>
              {likes.length > 0 ? (
                <div className="space-y-6">
                  {likes.map((article) => (
                    <div
                      key={article.id}
                      className="border border-border/50 p-6 hover:border-primary/50 transition-colors bg-background rounded-sm"
                    >
                      <span className="text-[10px] font-semibold text-accent tracking-widest uppercase block mb-2">
                        {article.category}
                      </span>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="font-serif text-xl hover:text-accent transition-colors block mb-2"
                      >
                        {article.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {article.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-8 text-center bg-muted/5 rounded-sm">
                  <p className="text-sm text-muted-foreground">
                    No liked articles yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Recently Viewed */}
          <div className="lg:col-span-4 space-y-12">
            <div>
              <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
                <History className="w-5 h-5 text-accent" /> History
              </h2>
              {recentlyViewed.length > 0 ? (
                <ul className="space-y-4 border-l border-border/60 pl-4">
                  {recentlyViewed.slice(0, 5).map((article, i) => (
                    <li key={i}>
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-sm font-medium hover:text-accent transition-colors block"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No reading history yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "topics" && (
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
            <Check className="w-5 h-5 text-accent" /> Following Topics
          </h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Follow topics to receive personalized recommendations and alert updates on content aligning with your interests.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              "ideas", "startups", "technology", "ai", "business", "leadership", "books", 
              "psychology", "productivity", "society", "health", "life", "travel", "finance", 
              "design", "opinion"
            ].map((topic) => {
              const isFollowed = followedTopics.includes(topic);
              return (
                <button
                  key={topic}
                  onClick={() => handleToggleTopic(topic)}
                  className={`flex items-center justify-between p-4 border transition-all rounded-sm text-left ${
                    isFollowed
                      ? "border-accent bg-accent/5 text-accent font-medium shadow-sm shadow-accent/5"
                      : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="capitalize text-sm">{topic}</span>
                  {isFollowed ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4 opacity-55 hover:opacity-100" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Notifications List */}
          <div className="lg:col-span-8">
            <h2 className="font-serif text-2xl mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
              <Bell className="w-5 h-5 text-accent" /> Inbox Alerts
            </h2>
            {notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`border p-5 rounded-sm flex justify-between items-start gap-4 transition-all ${
                      n.read
                        ? "border-border/50 bg-background/50 opacity-75"
                        : "border-accent/30 bg-accent/5 shadow-sm"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm mb-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground mb-3">{n.message}</p>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          View Updates →
                        </Link>
                      )}
                    </div>
                    {!n.read && (
                      <button
                        onClick={() => handleMarkNotificationRead(n.id)}
                        className="text-xs text-accent hover:underline font-medium shrink-0"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border p-10 text-center bg-muted/5 rounded-sm text-sm text-muted-foreground italic">
                No alerts or notifications at this time.
              </div>
            )}
          </div>

          {/* Preferences Column */}
          <div className="lg:col-span-4">
            <div className="border border-border p-6 bg-muted/5 rounded-sm">
              <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" /> Digest Subscriptions
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Manage your preferences for weekly articles and announcements.
              </p>
              <div className="flex items-center justify-between text-sm mb-6">
                <span className="font-medium text-foreground">Weekly Digest</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  stats?.isSubscribed 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {stats?.isSubscribed ? "Active" : "Inactive"}
                </span>
              </div>
              <button
                onClick={handleToggleSubscription}
                disabled={subscriptionLoading}
                className={`w-full py-2 text-sm font-medium transition-colors border ${
                  stats?.isSubscribed
                    ? "border-red-200 text-red-500 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/20"
                    : "border-accent text-accent hover:bg-accent/5"
                }`}
              >
                {subscriptionLoading ? "Updating..." : stats?.isSubscribed ? "Unsubscribe" : "Subscribe Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
