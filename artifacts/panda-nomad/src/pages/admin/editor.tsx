import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "../../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Eye,
  FileSearch,
  Type,
  Zap,
  ArrowLeft,
  CheckCircle,
  Loader2,
  BookOpen,
  AlignLeft,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Search,
  Globe,
  X
} from "lucide-react";

interface AIReview {
  score: number;
  summary: string;
  suggestions: string[];
  readability: string;
  tone: string;
  source: string;
}

interface AISeo {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  slug: string;
  source: string;
}

export function AdminEditor() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  const params = new URLSearchParams(search);
  const editId = params.get("id");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImagePrompt, setCoverImagePrompt] = useState("");
  const [author, setAuthor] = useState("");
  const [authorTitle, setAuthorTitle] = useState("Contributor");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [series, setSeries] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState("draft");
  const [publishedDate, setPublishedDate] = useState("");
  const [availableSeries, setAvailableSeries] = useState<any[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI state
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [titlesLoading, setTitlesLoading] = useState(false);
  const [review, setReview] = useState<AIReview | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [seo, setSeo] = useState<AISeo | null>(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [excerptLoading, setExcerptLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [fullBlogLoading, setFullBlogLoading] = useState(false);

  const [imageRegenerating, setImageRegenerating] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  // Web image search state
  const [webImageModalOpen, setWebImageModalOpen] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState("");
  const [webImages, setWebImages] = useState<Array<{ url: string; thumbnail: string; title: string }>>([]);
  const [webImagesLoading, setWebImagesLoading] = useState(false);
  const [selectingWebImageUrl, setSelectingWebImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate("/login");
      else if (user.role !== "admin" && user.role !== "super_admin")
        navigate("/");
      else {
        fetchSeries();
        if (editId) loadArticle(parseInt(editId, 10));
      }
    }
  }, [user, authLoading, editId]);

  const fetchSeries = async () => {
    try {
      const data = await customFetch<any[]>("/api/cms/series");
      setAvailableSeries(data);
    } catch {
      console.error("Failed to load series");
    }
  };

  const loadArticle = async (id: number) => {
    try {
      const articles = await customFetch<any[]>("/api/cms/articles");
      const article = articles.find((a) => a.id === id);
      if (article) {
        setTitle(article.title || "");
        setSlug(article.slug || "");
        setContent(article.content || "");
        setExcerpt(article.excerpt || "");
        setCategory(article.category || "");
        setTagsInput(
          Array.isArray(article.tags) ? article.tags.join(", ") : ""
        );
        setCoverImage(article.coverImage || "");
        setAuthor(article.author || "");
        setAuthorTitle(article.authorTitle || "");
        setAuthorAvatar(article.authorAvatar || "");
        setSeries(article.series || "");
        setFeatured(article.featured || false);
        setStatus(article.status || "draft");
        if (article.publishedDate) {
          const date = new Date(article.publishedDate);
          // convert UTC date to Local datetime-local value (YYYY-MM-DDTHH:mm)
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - offset * 60 * 1000);
          setPublishedDate(localDate.toISOString().slice(0, 16));
        } else {
          setPublishedDate("");
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load article.",
        variant: "destructive",
      });
    }
  };

  const autoSlug = useCallback((t: string) => {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editId) setSlug(autoSlug(val));
  };

  const handleSave = async (publishStatus?: string) => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please add a title before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload = {
      title,
      slug: slug || autoSlug(title),
      content,
      excerpt,
      category: category || "Uncategorized",
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      coverImage,
      author: author || user?.email || "Unknown",
      authorTitle,
      authorAvatar,
      series: series || null,
      featured,
      status: publishStatus || status,
      publishedDate: (publishStatus || status) === "scheduled" && publishedDate ? new Date(publishedDate).toISOString() : undefined,
    };

    try {
      if (editId) {
        await customFetch(`/api/cms/articles/${editId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (publishStatus) setStatus(publishStatus);
        toast({
          title: "Saved",
          description: `Article updated${publishStatus === "published" ? " and published" : ""}.`,
        });
      } else {
        const newArticle = await customFetch<any>("/api/cms/articles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Created",
          description: `Article created${publishStatus === "published" ? " and published" : ""}.`,
        });
        navigate(`/admin/editor?id=${newArticle.id}`);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to save article.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── PandaAI Actions ────────────────────────────
  const suggestTitles = async () => {
    if (!content.trim()) {
      toast({ title: "Write some content first", variant: "destructive" });
      return;
    }
    setTitlesLoading(true);
    try {
      const data = await customFetch<{
        titles: string[];
        source: string;
      }>("/api/ai/suggest-titles", {
        method: "POST",
        body: JSON.stringify({ content, category }),
      });
      setSuggestedTitles(data.titles);
      if (data.source === "fallback") {
        toast({
          title: "PandaAI Unavailable",
          description:
            "Using fallback suggestions. Add GEMINI_API_KEY for PandaAI-powered titles.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate titles.",
        variant: "destructive",
      });
    } finally {
      setTitlesLoading(false);
    }
  };

  const runEditorialReview = async () => {
    if (!content.trim()) {
      toast({ title: "Write some content first", variant: "destructive" });
      return;
    }
    setReviewLoading(true);
    try {
      const data = await customFetch<AIReview>("/api/ai/editorial-review", {
        method: "POST",
        body: JSON.stringify({ content, title }),
      });
      setReview(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to run editorial review.",
        variant: "destructive",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const generateSEO = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Need title and content",
        variant: "destructive",
      });
      return;
    }
    setSeoLoading(true);
    try {
      const data = await customFetch<AISeo>("/api/ai/generate-seo", {
        method: "POST",
        body: JSON.stringify({ title, content, category }),
      });
      setSeo(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate SEO.",
        variant: "destructive",
      });
    } finally {
      setSeoLoading(false);
    }
  };

  const generateExcerpt = async () => {
    if (!content.trim()) {
      toast({ title: "Write some content first", variant: "destructive" });
      return;
    }
    setExcerptLoading(true);
    try {
      const data = await customFetch<{ excerpt: string }>(
        "/api/ai/generate-excerpt",
        {
          method: "POST",
          body: JSON.stringify({ content, title }),
        }
      );
      setExcerpt(data.excerpt);
      toast({ title: "Excerpt generated" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate excerpt.",
        variant: "destructive",
      });
    } finally {
      setExcerptLoading(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!title.trim() && !aiTopic.trim()) {
      toast({ title: "Need a topic or title to generate an image", variant: "destructive" });
      return;
    }
    setImageRegenerating(true);
    try {
      toast({ title: "Generating new image...", description: "This might take a few seconds." });
      const data = await customFetch<{ coverImage: string }>("/api/ai/regenerate-image", {
        method: "POST",
        body: JSON.stringify({
          prompt: coverImagePrompt || title || aiTopic,
          oldImagePath: coverImage
        }),
      });
      setCoverImage(data.coverImage);
      toast({ title: "Image regenerated successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to regenerate image", variant: "destructive" });
    } finally {
      setImageRegenerating(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result;
        try {
          const data = await customFetch<{ coverImage: string }>("/api/ai/upload-image", {
            method: "POST",
            body: JSON.stringify({
              imageBase64: base64data,
              oldImagePath: coverImage
            }),
          });
          setCoverImage(data.coverImage);
          toast({ title: "Image uploaded successfully!" });
        } catch (err: any) {
          toast({ title: "Upload Failed", description: err.message || "Failed to upload image", variant: "destructive" });
        } finally {
          setImageUploading(false);
          // Reset file input
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "Error reading file", variant: "destructive" });
      setImageUploading(false);
    }
  };

  const handleOpenWebImageSearch = () => {
    const query = title.trim() || aiTopic.trim() || category.trim() || "editorial news";
    setWebSearchQuery(query);
    setWebImageModalOpen(true);
    handleSearchWebImages(query);
  };

  const handleSearchWebImages = async (queryStr?: string) => {
    const q = (queryStr !== undefined ? queryStr : webSearchQuery).trim();
    if (!q) return;
    setWebImagesLoading(true);
    try {
      const token = localStorage.getItem("session_token");
      const res = await fetch("/api/ai/search-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) throw new Error("Failed to search web images");
      const data = await res.json();
      setWebImages(data.images || []);
    } catch (err: any) {
      toast({ title: "Image Search Failed", description: err.message, variant: "destructive" });
    } finally {
      setWebImagesLoading(false);
    }
  };

  const handleSelectWebImage = async (imgUrl: string) => {
    setSelectingWebImageUrl(imgUrl);
    try {
      const token = localStorage.getItem("session_token");
      const res = await fetch("/api/ai/select-web-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ imageUrl: imgUrl, oldImagePath: coverImage }),
      });
      if (!res.ok) throw new Error("Failed to select web image");
      const data = await res.json();
      setCoverImage(data.coverImage);
      setWebImageModalOpen(false);
      toast({ title: "Cover image set successfully!" });
    } catch (err: any) {
      setCoverImage(imgUrl);
      setWebImageModalOpen(false);
      toast({ title: "Cover image set!" });
    } finally {
      setSelectingWebImageUrl(null);
    }
  };

  const handleGenerateFullBlog = async () => {
    if (!aiTopic.trim()) return;
    setFullBlogLoading(true);
    setProgressModalOpen(true);
    setProgressMessage("Initializing PandaAI Writer...");
    try {
      toast({
        title: "Initiating PandaAI Writer",
        description: "Connecting to PandaAI generation stream...",
      });
      const token = localStorage.getItem("session_token");
      const response = await fetch("/api/ai/write-full-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ topic: aiTopic }),
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.message) errMessage = errData.message;
        } catch (e) { }
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Failed to read stream");

      let finalData = null;
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            if (dataStr.trim()) {
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.event === "progress") {
                  setProgressMessage(parsed.message);
                } else if (parsed.event === "complete") {
                  finalData = parsed;
                } else if (parsed.event === "error") {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                console.error("Failed to parse SSE line:", line);
              }
            }
          }
          boundary = buffer.indexOf("\n\n");
        }
      }

      if (finalData) {
        const data = finalData;
        setTitle(data.title || aiTopic);

        // If we got SEO metadata, save it and use its slug
        if (data.seo) {
          setSeo(data.seo);
          if (!editId) setSlug(data.seo.slug || autoSlug(data.title || aiTopic));
        } else {
          if (!editId) setSlug(autoSlug(data.title || aiTopic));
        }

        setContent(data.content || "");
        setExcerpt(data.excerpt || "");
        setCategory(data.category || "");
        setTagsInput(Array.isArray(data.tags) ? data.tags.join(", ") : "");
        setCoverImage(data.coverImage || "");
        setCoverImagePrompt(data.coverImagePrompt || "");

        toast({
          title: "Success",
          description: "Blog post content, SEO, and cover image loaded into editor.",
        });
        setAiTopic("");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate blog post.",
        variant: "destructive",
      });
    } finally {
      setFullBlogLoading(false);
      setProgressModalOpen(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500 relative">
      {/* Progress Modal */}
      {progressModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border shadow-xl rounded-xl p-8 max-w-sm w-full text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary mb-6" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">PandaAI is Working</h3>
            <p className="text-muted-foreground font-medium">{progressMessage}</p>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/cms")}
              className="p-2 hover:bg-muted transition-colors"
              title="Back to CMS"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              {editId ? "Edit Article" : "New Article"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${status === "published"
                ? "bg-emerald-100 text-emerald-700"
                : status === "scheduled"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
                }`}
            >
              {status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className={`p-2 border transition-colors ${isPreview ? "border-accent text-accent" : "border-border hover:bg-muted"}`}
              title={isPreview ? "Edit Mode" : "Preview"}
            >
              {isPreview ? (
                <AlignLeft className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
              className={`p-2 border transition-colors ${aiPanelOpen ? "border-accent text-accent bg-accent/5" : "border-border hover:bg-muted"}`}
              title="PandaAI Assistant"
            >
              <img src="/panda-ai-logo.png" alt="PandaAI" className="w-8 h-8 object-contain" />
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8">
        <div
          className={`grid gap-8 ${aiPanelOpen ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 max-w-4xl mx-auto"}`}
        >
          {/* ─── Editor Panel ─── */}
          <div className={aiPanelOpen ? "lg:col-span-8" : ""}>
            {isPreview ? (
              <div className="prose prose-lg max-w-none border border-border p-8 bg-background min-h-[600px]">
                <h1 className="font-serif">{title || "Untitled"}</h1>
                {excerpt && (
                  <p className="text-xl text-muted-foreground italic">
                    {excerpt}
                  </p>
                )}
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Article Title"
                    className="w-full text-4xl font-serif border-0 border-b border-border/30 bg-transparent py-4 focus:outline-none focus:border-accent placeholder:text-muted-foreground/30 transition-colors"
                  />
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="url-slug"
                      className="flex-1 text-xs text-muted-foreground bg-transparent border-0 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Excerpt */}
                <div className="relative">
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Write a compelling excerpt that appears in article previews..."
                    rows={2}
                    className="w-full px-4 py-3 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                  <button
                    onClick={generateExcerpt}
                    disabled={excerptLoading}
                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-accent transition-colors"
                    title="PandaAI-generate excerpt"
                  >
                    {excerptLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <img src="/panda-ai-logo.png" alt="PandaAI" className="w-10 h-10 object-contain" />
                    )}
                  </button>
                </div>

                {/* Content Editor (Textarea / Markdown) */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>
                      Write in HTML or Markdown ·{" "}
                      {content.split(/\s+/).filter(Boolean).length} words ·{" "}
                      {Math.ceil(
                        content.split(/\s+/).filter(Boolean).length / 200
                      )}{" "}
                      min read
                    </span>
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing your article content here..."
                    rows={24}
                    className="w-full px-5 py-4 text-base leading-relaxed border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors resize-y font-mono"
                  />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-border/30">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Publish Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {status === "scheduled" && (
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        Schedule Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={publishedDate}
                        onChange={(e) => setPublishedDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Startup, Creativity, Mindset"
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Series
                    </label>
                    <select
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="">None</option>
                      {availableSeries.map((s) => (
                        <option key={s.id} value={s.slug}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="startup, productivity, mindfulness"
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Cover Image
                    </label>
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image Preview Box */}
                      <div className="w-full md:w-1/3 aspect-video bg-muted border border-border/50 flex items-center justify-center relative overflow-hidden group">
                        {coverImage ? (
                          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground/50">
                            <ImageIcon className="w-8 h-8 mb-2" />
                            <span className="text-xs">No image</span>
                          </div>
                        )}
                        {(imageRegenerating || imageUploading) && (
                          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-accent mb-2" />
                            <span className="text-xs font-medium text-accent">
                              {imageRegenerating ? "Generating..." : "Uploading..."}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={coverImage}
                          onChange={(e) => setCoverImage(e.target.value)}
                          placeholder="Image URL or generate one..."
                          className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={handleRegenerateImage}
                            disabled={imageRegenerating || (!title.trim() && !aiTopic.trim())}
                            className="flex items-center gap-2 px-3 py-1.5 border border-border/50 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                            title="Generate a new PandaAI image"
                          >
                            <RefreshCw className={`w-4 h-4 ${imageRegenerating ? "animate-spin" : ""}`} />
                            {coverImage ? "Generate AI Image" : "Generate Image"}
                          </button>

                          <button
                            onClick={handleOpenWebImageSearch}
                            disabled={webImagesLoading || selectingWebImageUrl !== null}
                            className="flex items-center gap-2 px-3 py-1.5 border border-border/50 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 text-primary font-semibold"
                            title="Search public web images on Google"
                          >
                            <Search className="w-4 h-4 text-accent" />
                            Find on Google
                          </button>

                          <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageUploading}
                            className="flex items-center gap-2 px-3 py-1.5 border border-border/50 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-4 h-4" />
                            Upload Image
                          </button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUploadImage}
                            accept="image/*"
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Series
                    </label>
                    <input
                      type="text"
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      placeholder="e.g., Build in Public"
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder={user?.email || "Author name"}
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      Author Title
                    </label>
                    <input
                      type="text"
                      value={authorTitle}
                      onChange={(e) => setAuthorTitle(e.target.value)}
                      placeholder="Contributor"
                      className="w-full px-3 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="accent-accent"
                      />
                      <span className="text-sm font-medium">
                        Mark as Featured Article
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── PandaAI Assistant Sidebar ─── */}
          {aiPanelOpen && (
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-20 space-y-6 max-h-[85vh] overflow-y-auto pr-1">
                <div className="border border-accent/20 bg-accent/5 p-5">
                  <h3 className="flex items-center gap-2 font-serif text-lg mb-1">
                    <img src="/panda-ai-logo.png" alt="PandaAI" className="w-12 h-12 object-contain" />
                    PandaAI Assistant
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Powered by Gemini · Use PandaAI to polish your writing.
                  </p>
                </div>

                {/* Write Entire Blog by PandaAI */}
                <div className="border border-accent/20 bg-accent/5 p-5 space-y-4 rounded-sm">
                  <h4 className="font-serif text-sm font-semibold flex items-center gap-2 text-accent">
                    <img src="/panda-ai-logo.png" alt="PandaAI" className="w-12 h-12 object-contain" /> Write Entire Blog with PandaAI
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter a topic or title. PandaAI will search Google News, draft a complete article, choose categories/tags, and design a custom PandaAI cover image.
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g., Rise of Tokyo Nomad Hubs..."
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                    />
                    <button
                      onClick={handleGenerateFullBlog}
                      disabled={fullBlogLoading || !aiTopic.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {fullBlogLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating Article...</span>
                        </>
                      ) : (
                        <>
                          <img src="/panda-ai-logo.png" alt="PandaAI" className="w-12 h-12 object-contain" />
                          <span>Generate Full Blog Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Title Suggestions */}
                <div className="border border-border p-5 space-y-3">
                  <button
                    onClick={suggestTitles}
                    disabled={titlesLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                  >
                    {titlesLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Type className="w-4 h-4" />
                    )}
                    Suggest Titles
                  </button>
                  {suggestedTitles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {suggestedTitles.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTitle(t);
                            if (!editId) setSlug(autoSlug(t));
                            toast({ title: "Title applied" });
                          }}
                          className="w-full text-left text-sm p-3 border border-border/50 hover:border-accent hover:text-accent transition-colors leading-snug"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Editorial Review */}
                <div className="border border-border p-5 space-y-3">
                  <button
                    onClick={runEditorialReview}
                    disabled={reviewLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                  >
                    {reviewLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSearch className="w-4 h-4" />
                    )}
                    Editorial Review
                  </button>
                  {review && (
                    <div className="pt-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Score
                        </span>
                        <span
                          className={`text-2xl font-bold ${scoreColor(review.score)}`}
                        >
                          {review.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Readability:{" "}
                          <strong className="text-foreground">
                            {review.readability}
                          </strong>
                        </span>
                        <span>
                          Tone:{" "}
                          <strong className="text-foreground">
                            {review.tone}
                          </strong>
                        </span>
                      </div>
                      <div className="pt-2 space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Suggestions
                        </span>
                        {review.suggestions.map((s, i) => (
                          <p
                            key={i}
                            className="text-sm text-muted-foreground pl-3 border-l-2 border-accent/30 py-1"
                          >
                            {s}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* SEO Generator */}
                <div className="border border-border p-5 space-y-3">
                  <button
                    onClick={generateSEO}
                    disabled={seoLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                  >
                    {seoLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Generate SEO
                  </button>
                  {seo && (
                    <div className="pt-2 space-y-3 text-sm">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                          Meta Title
                        </span>
                        <p className="text-foreground">{seo.metaTitle}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                          Meta Description
                        </span>
                        <p className="text-muted-foreground">
                          {seo.metaDescription}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1">
                          Focus Keyword
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {seo.focusKeyword ? (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                              {seo.focusKeyword}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None</span>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground/50">
                        Source: {seo.source}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Web Image Search Modal */}
          {webImageModalOpen && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card border border-border w-full max-w-3xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-lg">Find Cover Image on Google / Web</h3>
                  </div>
                  <button
                    onClick={() => setWebImageModalOpen(false)}
                    className="p-1 hover:bg-muted rounded-md transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-border/30 bg-background">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchWebImages();
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={webSearchQuery}
                        onChange={(e) => setWebSearchQuery(e.target.value)}
                        placeholder="Search for relevant images..."
                        className="w-full pl-9 pr-4 py-2 text-sm border border-border/50 bg-background focus:outline-none focus:border-accent transition-colors"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    </div>
                    <button
                      type="submit"
                      disabled={webImagesLoading}
                      className="px-4 py-2 bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
                    >
                      {webImagesLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </button>
                  </form>
                </div>

                {/* Results Grid */}
                <div className="p-6 overflow-y-auto flex-1">
                  {webImagesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-accent mb-3" />
                      <p className="text-sm text-muted-foreground">Searching public web images for "{webSearchQuery}"...</p>
                    </div>
                  ) : webImages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No web images found for "{webSearchQuery}".</p>
                      <p className="text-xs mt-1">Try a different search term above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {webImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectWebImage(img.url)}
                          className="group relative aspect-video bg-muted border border-border/50 rounded-md overflow-hidden cursor-pointer hover:border-accent transition-all hover:shadow-md"
                        >
                          <img
                            src={img.thumbnail || img.url}
                            alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-xs font-semibold px-3 py-1.5 bg-accent text-accent-foreground rounded-md shadow-md transition-opacity">
                              Select Image
                            </span>
                          </div>
                          {selectingWebImageUrl === img.url && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-accent" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border/40 bg-muted/20 flex justify-between items-center text-xs text-muted-foreground">
                  <span>Click any image to set it as your article cover photo.</span>
                  <button
                    onClick={() => setWebImageModalOpen(false)}
                    className="px-3 py-1 border border-border text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
