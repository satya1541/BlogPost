import React from 'react';
import { Link } from 'wouter';
import { ArticleSummary } from '@workspace/api-client-react';
import { format } from 'date-fns';

export function ArticleCard({ article, variant = 'default' }: { article: ArticleSummary, variant?: 'default' | 'featured' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.slug}`} className="group flex flex-col gap-2">
        <span className="text-red-700 dark:text-red-500 font-extrabold text-[11px] uppercase tracking-wider block font-sans">
          {article.category}
        </span>
        <h3 className="font-serif font-bold text-base leading-snug text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-[11px] text-muted-foreground font-sans flex items-center gap-2">
          <span>{format(new Date(article.publishedDate), 'MMM d, yyyy')}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{article.readingTimeMinutes} min read</span>
        </p>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.slug}`} className="group relative flex w-full aspect-[4/3] lg:aspect-[21/9] overflow-hidden rounded-xs border border-border/20 shadow-md transition-all duration-500 hover:shadow-xl">
        <div className="absolute inset-0 bg-muted">
          {article.coverImage && (
            <img 
              src={article.coverImage} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/10 lg:to-transparent" />
        </div>
        
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 lg:p-12 xl:p-14">
          <div className="max-w-4xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-red-700 dark:text-red-500 font-extrabold text-xs tracking-wider uppercase font-sans bg-background/80 px-2.5 py-1 rounded-xs border border-border/30">
                {article.category}
              </span>
              <span className="text-xs text-foreground/80 font-sans flex items-center gap-2 font-medium bg-background/60 px-2.5 py-1 rounded-xs border border-border/20">
                <span>{format(new Date(article.publishedDate), 'MMM d, yyyy')}</span>
              </span>
            </div>
            
            <h2 className="font-serif font-extrabold text-3xl md:text-5xl lg:text-5xl leading-tight tracking-tight mb-4 text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors duration-300">
              {article.title}
            </h2>
            
            <p className="text-base md:text-lg text-foreground/80 mb-6 line-clamp-2 leading-relaxed font-sans max-w-3xl">
              {article.excerpt}
            </p>
            
            <div className="flex items-center gap-3">
              {article.authorAvatar && (
                <img src={article.authorAvatar} alt={article.author} className="w-10 h-10 rounded-full object-cover border border-border/40" />
              )}
              <div className="font-sans text-xs">
                <p className="font-bold text-foreground">{article.author}</p>
                <p className="text-muted-foreground">
                  {article.readingTimeMinutes} min read
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col h-full">
      <div className="aspect-[16/10] overflow-hidden bg-muted mb-4 rounded-xs border border-border/20">
        {article.coverImage ? (
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-sans">No Image</div>
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <span className="text-red-700 dark:text-red-500 font-extrabold text-[11px] uppercase tracking-wider block font-sans mb-2">
          {article.category}
        </span>
        <h3 className="font-serif font-extrabold text-xl leading-snug mb-2 text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
          {article.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 mb-4 text-xs font-sans leading-relaxed flex-1">
          {article.excerpt}
        </p>
        <div className="text-[11px] text-muted-foreground font-sans flex items-center gap-2 mt-auto pt-2 border-t border-border/20">
          <span className="font-bold text-foreground">{article.author}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{format(new Date(article.publishedDate), 'MMM d, yyyy')}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{article.readingTimeMinutes} min read</span>
        </div>
      </div>
    </Link>
  );
}
