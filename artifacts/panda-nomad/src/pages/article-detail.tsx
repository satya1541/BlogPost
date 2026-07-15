import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  useGetArticle,
  useListRelatedArticles,
  getGetArticleQueryKey,
  getListRelatedArticlesQueryKey,
  customFetch,
} from '@workspace/api-client-react';
import { format } from 'date-fns';
import { ArticleCard } from '../components/article-card';
import { NewsletterForm } from '../components/newsletter-form';
import { Twitter, Linkedin, Link as LinkIcon, List, Heart, Bookmark, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../context/AuthContext';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useGetArticle(slug || '', {
    query: { enabled: !!slug, queryKey: getGetArticleQueryKey(slug || '') },
  });
  const { data: related } = useListRelatedArticles(slug || '', {
    query: { enabled: !!slug, queryKey: getListRelatedArticlesQueryKey(slug || '') },
  });
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [toc, setToc] = useState<TocItem[]>([]);
  const [contentWithIds, setContentWithIds] = useState<string>('');
  
  const [likesInfo, setLikesInfo] = useState<{ totalLikes: number; liked: boolean }>({ totalLikes: 0, liked: false });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      customFetch<{ totalLikes: number; liked: boolean }>(`/api/articles/${slug}/likes`)
        .then(setLikesInfo)
        .catch(() => {});

      customFetch<any[]>(`/api/articles/${slug}/comments`)
        .then(setComments)
        .catch(() => {});
    }
  }, [slug]);

  useEffect(() => {
    if (slug && user) {
      customFetch<{ bookmarked: boolean }>(`/api/articles/${slug}/bookmark`)
        .then(data => setIsBookmarked(data.bookmarked))
        .catch(() => {});
    } else {
      setIsBookmarked(false);
    }
  }, [slug, user]);

  useEffect(() => {
    if (!article) return;

    // 1. History tracking
    const localHistory = localStorage.getItem("recently-viewed");
    let historyList = [];
    if (localHistory) {
      try {
        historyList = JSON.parse(localHistory);
      } catch {
        historyList = [];
      }
    }
    historyList = historyList.filter((item: any) => item.slug !== article.slug);
    historyList.unshift({
      title: article.title,
      slug: article.slug,
    });
    localStorage.setItem("recently-viewed", JSON.stringify(historyList.slice(0, 10)));

    // 2. Dynamic SEO Injection
    const prevTitle = document.title;
    document.title = `${article.title} | The Panda Nomad`;

    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement;
      let created = false;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
        created = true;
      }
      const prevContent = meta.getAttribute('content');
      meta.setAttribute('content', content);
      
      return () => {
        if (created) {
          meta.remove();
        } else if (prevContent !== null) {
          meta.setAttribute('content', prevContent);
        } else {
          meta.removeAttribute('content');
        }
      };
    };

    const cleanDescription = setMetaTag('name', 'description', article.excerpt);
    const cleanOgTitle = setMetaTag('property', 'og:title', article.title);
    const cleanOgDesc = setMetaTag('property', 'og:description', article.excerpt);
    const cleanOgImage = setMetaTag('property', 'og:image', article.coverImage || '');
    const cleanOgUrl = setMetaTag('property', 'og:url', window.location.href);
    const cleanTwitterCard = setMetaTag('name', 'twitter:card', 'summary_large_image');
    const cleanTwitterTitle = setMetaTag('name', 'twitter:title', article.title);
    const cleanTwitterDesc = setMetaTag('name', 'twitter:description', article.excerpt);
    const cleanTwitterImage = setMetaTag('name', 'twitter:image', article.coverImage || '');

    // Schema JSON-LD
    let schemaScript = document.getElementById('article-jsonld');
    let schemaCreated = false;
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('id', 'article-jsonld');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
      schemaCreated = true;
    }
    const prevSchema = schemaScript.textContent;
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      'headline': article.title,
      'description': article.excerpt,
      'image': [article.coverImage || ''],
      'datePublished': new Date(article.publishedDate).toISOString(),
      'author': {
        '@type': 'Person',
        'name': article.author,
        'jobTitle': article.authorTitle || 'Contributor',
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'The Panda Nomad',
        'logo': {
          '@type': 'ImageObject',
          'url': window.location.origin + '/logo.png',
        }
      }
    };
    schemaScript.textContent = JSON.stringify(schemaData);

    return () => {
      document.title = prevTitle;
      cleanDescription();
      cleanOgTitle();
      cleanOgDesc();
      cleanOgImage();
      cleanOgUrl();
      cleanTwitterCard();
      cleanTwitterTitle();
      cleanTwitterDesc();
      cleanTwitterImage();
      if (schemaCreated) {
        schemaScript?.remove();
      } else if (schemaScript && prevSchema !== null) {
        schemaScript.textContent = prevSchema;
      }
    };
  }, [article]);

  // Analytics Tracking Effect
  useEffect(() => {
    if (!article) return;

    // Track page_view
    customFetch(`/api/articles/${article.slug}/track`, {
      method: "POST",
      body: JSON.stringify({
        eventType: "page_view",
        metadata: {
          referrer: document.referrer || "Direct",
          userAgent: navigator.userAgent,
        },
      }),
    }).catch(() => {});

    // Track scroll_depth and read_complete
    const sentThresholds = new Set<number>();
    let readCompleteSent = false;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight <= 0) return;

      const percent = Math.round((scrollTop / scrollHeight) * 100);

      // Check thresholds: 25, 50, 75, 100
      [25, 50, 75, 100].forEach((threshold) => {
        if (percent >= threshold && !sentThresholds.has(threshold)) {
          sentThresholds.add(threshold);
          customFetch(`/api/articles/${article.slug}/track`, {
            method: "POST",
            body: JSON.stringify({
              eventType: "scroll_depth",
              metadata: { scrollPercent: threshold },
            }),
          }).catch(() => {});
        }
      });

      // Track read_complete (if scrolled past 90%)
      if (percent >= 90 && !readCompleteSent) {
        readCompleteSent = true;
        customFetch(`/api/articles/${article.slug}/track`, {
          method: "POST",
          body: JSON.stringify({ eventType: "read_complete" }),
        }).catch(() => {});
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once initially to capture if content is short
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [article]);


  const handleLikeToggle = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to like articles.",
      });
      return;
    }
    if (likeLoading || !article) return;
    setLikeLoading(true);
    try {
      const res = await customFetch<{ liked: boolean; totalLikes: number }>("/api/likes/toggle", {
        method: "POST",
        body: JSON.stringify({ articleId: article.id }),
      });
      setLikesInfo(res);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to toggle like.",
        variant: "destructive",
      });
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to bookmark articles.",
      });
      return;
    }
    if (bookmarkLoading || !article) return;
    setBookmarkLoading(true);
    try {
      const res = await customFetch<{ bookmarked: boolean }>("/api/bookmarks/toggle", {
        method: "POST",
        body: JSON.stringify({ articleId: article.id }),
      });
      setIsBookmarked(res.bookmarked);
      toast({
        title: res.bookmarked ? "Bookmarked" : "Removed bookmark",
        description: res.bookmarked ? "Article added to your bookmarks." : "Article removed from your bookmarks.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to toggle bookmark.",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newComment.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const comment = await customFetch<any>(`/api/articles/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newComment }),
      });
      setComments(prev => [comment, ...prev]);
      setNewComment("");
      toast({
        title: "Comment posted",
        description: "Your comment has been added.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to post comment.",
        variant: "destructive",
      });
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (article?.content) {
      // Find all h2 and h3 elements in the content string to build ToC
      const parser = new DOMParser();
      const doc = parser.parseFromString(article.content, 'text/html');
      const headings = Array.from(doc.querySelectorAll('h2, h3'));
      
      const tocItems: TocItem[] = headings.map((h, i) => {
        // Add an ID if it doesn't have one
        const id = h.id || `heading-${i}`;
        h.id = id;
        return {
          id,
          text: h.textContent || '',
          level: h.tagName.toLowerCase() === 'h2' ? 2 : 3
        };
      });
      
      setToc(tocItems);
      setContentWithIds(doc.body.innerHTML);
    }
  }, [article?.content]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl animate-pulse">
        <div className="h-8 bg-muted w-24 mb-8" />
        <div className="h-16 bg-muted w-full mb-6" />
        <div className="h-16 bg-muted w-3/4 mb-12" />
        <div className="aspect-video bg-muted mb-12" />
        <div className="space-y-4">
          <div className="h-4 bg-muted w-full" />
          <div className="h-4 bg-muted w-full" />
          <div className="h-4 bg-muted w-5/6" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">Article not found</h1>
        <Link href="/articles" className="text-accent hover:underline">Return to articles</Link>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Article link copied to clipboard.",
    });
  };

  const handleGenerateSummary = async () => {
    if (!slug || aiLoading) return;
    setAiLoading(true);
    try {
      const data = await customFetch<{ summary: string }>(`/api/articles/${slug}/summarize`, {
        method: 'POST',
      });
      setAiSummary(data.summary);
      toast({
        title: "Summary generated",
        description: "AI summary successfully created.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to generate AI summary.",
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <article className="animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 max-w-4xl text-center">
        <Link href={`/articles?topic=${encodeURIComponent(article.category)}`} className="text-sm font-semibold text-accent tracking-widest uppercase mb-6 inline-block hover:underline">
          {article.category}
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-8">
          {article.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
          {article.authorAvatar && (
            <img src={article.authorAvatar} alt={article.author} className="w-12 h-12 rounded-full object-cover" />
          )}
          <div className="text-left">
            <p className="font-medium text-foreground">{article.author}</p>
            <p className="flex items-center gap-2">
              <span>{format(new Date(article.publishedDate), 'MMMM d, yyyy')}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{article.readingTimeMinutes} min read</span>
            </p>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl mb-16">
          <div className="aspect-[21/9] w-full overflow-hidden bg-muted">
            <img 
              src={article.coverImage} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
          
          {/* Sidebar / Share (Sticky) */}
          <div className="hidden lg:block lg:col-span-3 relative">
            <div className="sticky top-32 flex flex-col gap-10 text-muted-foreground">
              {toc.length > 0 && (
                <div className="hidden xl:block">
                  <h4 className="text-xs font-semibold text-foreground tracking-widest uppercase mb-4 flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Contents
                  </h4>
                  <ul className="space-y-3 text-sm">
                    {toc.map((item) => (
                      <li 
                        key={item.id} 
                        className={`${item.level === 3 ? 'ml-4 text-muted-foreground/80' : 'text-muted-foreground'}`}
                      >
                        <a 
                          href={`#${item.id}`}
                          className="hover:text-accent transition-colors line-clamp-2 leading-relaxed"
                          onClick={(e) => {
                            e.preventDefault();
                            const el = document.getElementById(item.id);
                            if (el) {
                              const y = el.getBoundingClientRect().top + window.scrollY;
                              window.scrollTo({ top: y - 100, behavior: 'smooth' });
                            }
                          }}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-8">
                <div>
                  <h4 className="text-xs font-semibold text-foreground tracking-widest uppercase mb-4">Interactions</h4>
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleLikeToggle} 
                      className={`p-3 border rounded-full hover:bg-muted transition-colors flex flex-col items-center justify-center w-12 h-16 ${likesInfo.liked ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}
                      aria-label="Like article"
                    >
                      <Heart className={`w-5 h-5 ${likesInfo.liked ? 'fill-accent' : ''}`} />
                      <span className="text-[10px] font-semibold mt-1">{likesInfo.totalLikes}</span>
                    </button>
                    
                    <button 
                      onClick={handleBookmarkToggle} 
                      className={`p-3 border rounded-full hover:bg-muted transition-colors flex items-center justify-center w-12 h-12 ${isBookmarked ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}
                      aria-label="Bookmark article"
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-accent' : ''}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-foreground tracking-widest uppercase mb-4">Share</h4>
                  <div className="flex flex-col gap-4">
                    <button onClick={handleShare} className="p-3 border border-border rounded-full hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center w-12 h-12" aria-label="Copy link">
                      <LinkIcon className="w-5 h-5" />
                    </button>
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="p-3 border border-border rounded-full hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center w-12 h-12" aria-label="Share on Twitter">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(article.title)}`} target="_blank" rel="noopener noreferrer" className="p-3 border border-border rounded-full hover:bg-muted hover:text-foreground transition-colors flex items-center justify-center w-12 h-12" aria-label="Share on LinkedIn">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 xl:col-span-7 prose prose-lg md:prose-xl prose-stone max-w-none">
            
            {/* AI Summary Section */}
            <div className="mb-10 bg-accent/5 border border-accent/20 rounded-md p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif text-accent flex items-center gap-2 !m-0">
                  <motion.div
                    animate={aiLoading ? { rotate: 360, scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: aiLoading ? Infinity : 0, duration: 1.5, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  AI Summary
                </h3>
                {!aiSummary && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateSummary}
                    disabled={aiLoading}
                    className="text-xs font-medium bg-accent text-accent-foreground px-3 py-1.5 rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50 relative overflow-hidden group"
                  >
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10">{aiLoading ? "Generating..." : "Generate Summary"}</span>
                  </motion.button>
                )}
              </div>
              
              {aiSummary ? (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.02 } }
                  }}
                  className="text-base text-foreground/80 whitespace-pre-wrap leading-relaxed m-0"
                >
                  {aiSummary.split(/(\s+)/).map((token, index) => {
                    if (/\s+/.test(token)) {
                      return <span key={index}>{token}</span>;
                    }
                    return (
                      <motion.span
                        key={index}
                        variants={{
                          hidden: { opacity: 0, filter: 'blur(4px)', y: 4 },
                          visible: { opacity: 1, filter: 'blur(0px)', y: 0, transition: { duration: 0.3 } }
                        }}
                        className="inline-block"
                      >
                        {token}
                      </motion.span>
                    );
                  })}
                </motion.div>
              ) : (
                <p className="text-sm text-muted-foreground m-0">
                  Too long? Read a quick 3-bullet point AI summary of this article.
                </p>
              )}
            </div>

            <div dangerouslySetInnerHTML={{ __html: contentWithIds || article.content }} />
            
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-border">
                {article.tags.map(tag => (
                  <Link key={tag} href={`/articles?tag=${tag}`} className="text-xs bg-muted px-3 py-1 rounded-full text-foreground hover:bg-accent hover:text-white transition-colors no-underline">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Comments Section */}
            <div className="mt-16 pt-12 border-t border-border">
              <h3 className="font-serif text-3xl mb-8">Comments ({comments.length})</h3>
              
              {/* Comment Input */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="mb-10 space-y-4">
                  <div>
                    <textarea
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add to the discussion..."
                      className="w-full px-4 py-3 border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentLoading || !newComment.trim()}
                      className="px-6 py-3 bg-primary text-primary-foreground font-medium text-sm hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                    >
                      {commentLoading ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-muted/30 border border-border p-6 text-center mb-10">
                  <p className="text-sm text-muted-foreground mb-4">You must be signed in to leave a comment.</p>
                  <Link href="/login" className="inline-block px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm hover:bg-accent hover:text-white transition-colors">
                    Sign In to Comment
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-8">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-border/50 pb-6 last:border-0">
                      <div className="flex items-center gap-3 mb-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                          {comment.user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{comment.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed pl-11 text-sm md:text-base">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm italic">No comments yet. Be the first to share your thoughts!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mid-article Newsletter CTA */}
      <div className="container mx-auto px-4 max-w-3xl my-24">
        <div className="bg-primary text-primary-foreground p-10 md:p-14 text-center">
          <h3 className="font-serif text-3xl mb-4 text-accent">Enjoying the read?</h3>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Get essays like this delivered to your inbox every Sunday. No spam, just signal.
          </p>
          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {related && related.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border">
          <h3 className="font-serif text-3xl mb-10">Read Next</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.slice(0, 3).map(rel => (
              <ArticleCard key={rel.id} article={rel} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
