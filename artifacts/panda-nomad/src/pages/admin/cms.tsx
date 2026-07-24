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
  Star,
  StarOff,
  Layers,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

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

type TabType = "articles" | "comments" | "subscribers" | "series";

export function AdminCMS() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("articles");
  const [isConfirmingGenerate, setIsConfirmingGenerate] = useState(false);
  const [isGeneratingCron, setIsGeneratingCron] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"idle" | "generating" | "completed" | "error">("idle");
  const [cronLogs, setCronLogs] = useState<string[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [seriesToDelete, setSeriesToDelete] = useState<number | null>(null);
  
  // Series modal state
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<any | null>(null);
  const [seriesForm, setSeriesForm] = useState({ name: "", slug: "", description: "", coverImage: "" });

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
      const [articlesData, commentsData, subscribersData, seriesData] = await Promise.all([
        customFetch<Article[]>("/api/cms/articles"),
        customFetch<Comment[]>("/api/cms/comments"),
        customFetch<any[]>("/api/cms/subscribers"),
        customFetch<any[]>("/api/cms/series"),
      ]);
      setArticles(articlesData);
      setComments(commentsData);
      setSubscribers(subscribersData);
      setSeries(seriesData);
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

  const confirmDeleteArticle = async () => {
    if (articleToDelete === null) return;
    try {
      await customFetch(`/api/cms/articles/${articleToDelete}`, { method: "DELETE" });
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete));
      toast({ title: "Deleted", description: "Article deleted." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete article.",
        variant: "destructive",
      });
    } finally {
      setArticleToDelete(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (commentToDelete === null) return;
    try {
      await customFetch(`/api/cms/comments/${commentToDelete}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
      toast({ title: "Removed", description: "Comment removed." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete comment.",
        variant: "destructive",
      });
    } finally {
      setCommentToDelete(null);
    }
  };

  const confirmDeleteSeries = async () => {
    if (seriesToDelete === null) return;
    try {
      await customFetch(`/api/cms/series/${seriesToDelete}`, { method: "DELETE" });
      setSeries((prev) => prev.filter((s) => s.id !== seriesToDelete));
      toast({ title: "Deleted", description: "Series deleted." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete series.",
        variant: "destructive",
      });
    } finally {
      setSeriesToDelete(null);
    }
  };
  
  const handleSaveSeries = async () => {
    if (!seriesForm.name || !seriesForm.slug || !seriesForm.description) {
      toast({ title: "Error", description: "Name, slug, and description are required", variant: "destructive" });
      return;
    }
    
    try {
      if (editingSeries) {
        await customFetch(`/api/cms/series/${editingSeries.id}`, {
          method: "PUT",
          body: JSON.stringify(seriesForm)
        });
        toast({ title: "Updated", description: "Series updated." });
      } else {
        await customFetch("/api/cms/series", {
          method: "POST",
          body: JSON.stringify(seriesForm)
        });
        toast({ title: "Created", description: "Series created." });
      }
      setIsSeriesModalOpen(false);
      loadData(); // reload series
    } catch {
      toast({ title: "Error", description: "Failed to save series.", variant: "destructive" });
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

  const heroArticles = articles.filter((a) => a.status === "published");
  const featuredArticles = heroArticles.filter((a: any) => a.featured);
  const nonFeaturedPublished = heroArticles.filter((a: any) => !a.featured);

  const handleToggleFeatured = async (article: Article, featured: boolean) => {
    try {
      await customFetch(`/api/cms/articles/${article.id}/featured`, {
        method: "PATCH",
        body: JSON.stringify({ featured }),
      });
      setArticles((prev) =>
        prev.map((a) =>
          a.id === article.id ? { ...a, featured } as any : a
        )
      );
      toast({
        title: featured ? "Added to Hero" : "Removed from Hero",
        description: `"${article.title}" ${featured ? "will now appear in the hero slider." : "has been removed from the hero slider."}`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update hero status.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateDailyHero = async () => {
    setIsConfirmingGenerate(false);
    setIsGeneratingCron(true);
    setGenerationStatus("generating");
    setCronLogs(["Starting daily hero generation..."]);

    try {
      const response = await fetch("/api/ai/cron/generate-daily-hero", {
        method: "POST",
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.replace("data: ", ""));
              if (data.event === "progress") {
                setCronLogs(prev => [...prev, data.message]);
              } else if (data.event === "error") {
                setCronLogs(prev => [...prev, "ERROR: " + data.message]);
                setGenerationStatus("error");
              } else if (data.event === "complete") {
                setCronLogs(prev => [...prev, `Completed generating ${data.generatedCount} articles.`]);
                setGenerationStatus("completed");
                toast({ title: "Success", description: "Generated new hero articles." });
                loadData();
              }
            } catch (e) {
              // Ignore parse error
            }
          }
        }
      }
    } catch (error: any) {
      setCronLogs(prev => [...prev, "Fatal error: " + error.message]);
      setGenerationStatus("error");
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
          {
            key: "series" as TabType,
            label: "Series",
            icon: Layers,
            count: series.length,
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
                      onClick={() => setArticleToDelete(article.id)}
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
                  onClick={() => setCommentToDelete(comment.id)}
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

      {/* ─── Series Tab ─── */}
      {activeTab === "series" && (
        <div>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => {
                setEditingSeries(null);
                setSeriesForm({ name: "", slug: "", description: "", coverImage: "" });
                setIsSeriesModalOpen(true);
              }}
              className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Series
            </button>
          </div>

          {series.length === 0 ? (
            <div className="border border-dashed border-border p-12 text-center">
              <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">No series found.</p>
            </div>
          ) : (
            <div className="bg-background border border-border/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Slug</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s, i) => (
                    <tr key={i} className="border-b border-border/30 last:border-0 group hover:bg-muted/10 transition-colors">
                      <td className="py-3 px-4 font-medium">{s.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.slug}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingSeries(s);
                            setSeriesForm({ name: s.name, slug: s.slug, description: s.description || "", coverImage: s.coverImage || "" });
                            setIsSeriesModalOpen(true);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-accent bg-background border border-transparent hover:border-border rounded transition-colors"
                          title="Edit Series"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSeriesToDelete(s.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 bg-background border border-transparent hover:border-border rounded transition-colors"
                          title="Delete Series"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Article Modal */}
      <AlertDialog
        open={articleToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setArticleToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteArticle();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Modal */}
      <AlertDialog
        open={commentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setCommentToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteComment();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Generate Daily Hero Modal */}
      <AlertDialog
        open={isConfirmingGenerate}
        onOpenChange={(open) => {
          if (!open) setIsConfirmingGenerate(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New Hero Articles</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to generate 19 new hero articles via AI? This will replace the current hero articles and take a few minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleGenerateDailyHero();
              }}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              Generate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generation Progress Modal */}
      <AlertDialog open={isGeneratingCron}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {generationStatus === "generating" && <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
              {generationStatus === "completed" && <CheckCircle className="w-6 h-6 text-green-500" />}
              {generationStatus === "error" && <AlertCircle className="w-6 h-6 text-red-500" />}
              
              {generationStatus === "generating" && "Generating Daily Hero Articles..."}
              {generationStatus === "completed" && "Generation Complete!"}
              {generationStatus === "error" && "Generation Error"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {generationStatus === "generating" && "Please wait while PandaAI gathers the latest news and writes the articles. Do not close this window."}
              {generationStatus === "completed" && "Successfully generated 6 new articles and updated the hero slider. Your readers will see them right away."}
              {generationStatus === "error" && "An error occurred during generation. Please check the logs below."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto mt-4 space-y-1">
            {cronLogs.map((log, i) => (
              <div key={i} className={log.includes("ERROR") || log.includes("Fatal error") ? "text-red-400" : ""}>{log}</div>
            ))}
          </div>
          <AlertDialogFooter>
            <button
              onClick={() => {
                setIsGeneratingCron(false);
                if (generationStatus === "completed") {
                  setActiveTab("hero"); // optionally redirect to hero tab
                }
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium ${generationStatus === "completed" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {generationStatus === "completed" ? "View Hero Slider" : "Close / Dismiss"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Series Modal */}
      <AlertDialog
        open={seriesToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setSeriesToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Series</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this series? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteSeries();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create / Edit Series Modal */}
      {isSeriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-semibold">{editingSeries ? "Edit Series" : "New Series"}</h2>
              <button onClick={() => setIsSeriesModalOpen(false)} className="text-muted-foreground hover:text-foreground">&times;</button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={seriesForm.name}
                  onChange={(e) => setSeriesForm({ ...seriesForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent"
                  placeholder="e.g. Travel Diaries"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={seriesForm.slug}
                  onChange={(e) => setSeriesForm({ ...seriesForm, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent"
                  placeholder="e.g. travel-diaries"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent h-24 resize-none"
                  placeholder="Brief description of the series..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                <input
                  type="text"
                  value={seriesForm.coverImage}
                  onChange={(e) => setSeriesForm({ ...seriesForm, coverImage: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/30">
              <button
                onClick={() => setIsSeriesModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSeries}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
              >
                Save Series
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
