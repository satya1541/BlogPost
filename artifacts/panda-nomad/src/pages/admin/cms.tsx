import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Filter,
  Download,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  status: string;
  author: string;
  views: number;
  readingTimeMinutes: number;
  createdAt: string;
  publishedDate: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  articleId: number;
  user: { id: number; email: string };
}

type TabType = "articles" | "comments" | "subscribers";

export function AdminCMS() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/login");
      else if (user.role !== "admin" && user.role !== "super_admin")
        navigate("/");
      else loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [articlesData, commentsData, subscribersData] = await Promise.all([
        customFetch<Article[]>("/api/cms/articles"),
        customFetch<Comment[]>("/api/cms/comments"),
        customFetch<any[]>("/api/cms/subscribers"),
      ]);
      setArticles(articlesData);
      setComments(commentsData);
      setSubscribers(subscribersData);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load CMS data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      await customFetch(`/api/cms/articles/${id}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Deleted", description: "Article deleted." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete article.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (id: number) => {
    try {
      await customFetch(`/api/cms/comments/${id}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Removed", description: "Comment removed." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    const csv = [
      "Email,Subscribed At",
      ...subscribers.map(
        (s) =>
          `${s.email},${new Date(s.subscribedAt).toISOString()}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublishToggle = async (article: Article) => {
    const newStatus =
      article.status === "published" ? "draft" : "published";
    try {
      await customFetch(`/api/cms/articles/${article.id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, status: newStatus } : a
        )
      );
      toast({
        title: newStatus === "published" ? "Published" : "Unpublished",
        description: `"${article.title}" is now ${newStatus}.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update article.",
        variant: "destructive",
      });
    }
  };

  const filteredArticles =
    statusFilter === "all"
      ? articles
      : articles.filter((a) => a.status === statusFilter);

  const statusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "draft":
        return <Clock className="w-4 h-4 text-amber-500" />;
      case "scheduled":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-7xl animate-pulse">
        <div className="h-10 bg-muted w-64 mb-8" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b border-border/50 pb-6">
        <div>
          <h1 className="font-serif text-4xl font-light">
            Content <span className="italic text-accent">Studio</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage articles, moderate comments, and export subscribers.
          </p>
        </div>
        <Link
          href="/admin/editor"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Article
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border/30">
        {[
          {
            key: "articles" as TabType,
            label: "Articles",
            icon: FileText,
            count: articles.length,
          },
          {
            key: "comments" as TabType,
            label: "Comments",
            icon: MessageSquare,
            count: comments.length,
          },
          {
            key: "subscribers" as TabType,
            label: "Subscribers",
            icon: Download,
            count: subscribers.length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Articles Tab ─── */}
      {activeTab === "articles" && (
        <div>
          {/* Filter */}
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {["all", "published", "draft", "scheduled"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  statusFilter === f
                    ? "bg-accent text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                No articles found.
              </p>
              <Link
                href="/admin/editor"
                className="text-accent text-sm font-medium hover:underline mt-2 inline-block"
              >
                Create your first article
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-5 border border-border/50 bg-background hover:border-border transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(article.status)}
                      <span className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase">
                        {article.category}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg truncate">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.author} · {article.readingTimeMinutes} min ·{" "}
                      {article.views} views ·{" "}
                      {new Date(article.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="p-2 border border-border hover:bg-muted transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/editor?id=${article.id}`}
                      className="p-2 border border-border hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handlePublishToggle(article)}
                      className={`p-2 border transition-colors ${
                        article.status === "published"
                          ? "border-amber-300 text-amber-600 hover:bg-amber-50"
                          : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={
                        article.status === "published"
                          ? "Unpublish"
                          : "Publish"
                      }
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="p-2 border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Comments Tab ─── */}
      {activeTab === "comments" && (
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                No comments to moderate.
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-4 p-5 border border-border/50 bg-background"
              >
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                  {comment.user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">
                      {comment.user.email}
                    </span>
                    <span>·</span>
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span>Article #{comment.articleId}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comment.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-2 border border-red-200 text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  title="Remove comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Subscribers Tab ─── */}
      {activeTab === "subscribers" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {subscribers.length} subscriber
              {subscribers.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          {subscribers.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground text-sm">
                No subscribers yet.
              </p>
            </div>
          ) : (
            <div className="border border-border/50 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Subscribed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="py-3 px-4 font-medium">
                        {sub.email}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(sub.subscribedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
