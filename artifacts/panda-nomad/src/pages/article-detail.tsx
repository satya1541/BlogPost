import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  useGetArticle,
  useListRelatedArticles,
  getGetArticleQueryKey,
  getListRelatedArticlesQueryKey,
} from '@workspace/api-client-react';
import { format } from 'date-fns';
import { ArticleCard } from '../components/article-card';
import { NewsletterForm } from '../components/newsletter-form';
import { Twitter, Linkedin, Link as LinkIcon, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [toc, setToc] = useState<TocItem[]>([]);
  const [contentWithIds, setContentWithIds] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

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

  return (
    <article className="animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 max-w-4xl text-center">
        <Link href={`/articles?topic=${article.category}`} className="text-sm font-semibold text-accent tracking-widest uppercase mb-6 inline-block hover:underline">
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
                              window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
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

          {/* Main Content */}
          <div className="lg:col-span-9 xl:col-span-7 prose prose-lg md:prose-xl prose-stone max-w-none">
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
