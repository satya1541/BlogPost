import React from 'react';
import { Link } from 'wouter';
import { ArticleSummary } from '@workspace/api-client-react';
import { format } from 'date-fns';

export function ArticleCard({ article, variant = 'default' }: { article: ArticleSummary, variant?: 'default' | 'featured' | 'compact' }) {
  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.slug}`} className="group flex flex-col gap-3">
        <p className="text-xs font-semibold text-accent tracking-wider uppercase">
          {article.category}
        </p>
        <h3 className="font-serif text-xl group-hover:text-accent transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <span>{format(new Date(article.publishedDate), 'MMM d, yyyy')}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{article.readingTimeMinutes} min read</span>
        </p>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.slug}`} className="group grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div className="aspect-[4/3] lg:aspect-[3/4] overflow-hidden bg-muted">
          {article.coverImage ? (
            <img 
              src={article.coverImage} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-secondary" />
          )}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-accent tracking-widest uppercase mb-4">
            {article.category}
          </p>
          <h2 className="font-serif text-4xl lg:text-5xl leading-tight mb-6 group-hover:text-accent transition-colors">
            {article.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
          <div className="flex items-center gap-4">
            {article.authorAvatar && (
              <img src={article.authorAvatar} alt={article.author} className="w-10 h-10 rounded-full object-cover" />
            )}
            <div>
              <p className="font-medium text-sm">{article.author}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{format(new Date(article.publishedDate), 'MMM d, yyyy')}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{article.readingTimeMinutes} min read</span>
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`} className="group flex flex-col h-full">
      <div className="aspect-[16/10] overflow-hidden bg-muted mb-6">
        {article.coverImage ? (
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <p className="text-xs font-semibold text-accent tracking-wider uppercase mb-3">
          {article.category}
        </p>
        <h3 className="font-serif text-2xl leading-snug mb-3 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 mb-6 text-sm flex-1">
          {article.excerpt}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-auto">
          <span className="font-medium text-foreground">{article.author}</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{format(new Date(article.publishedDate), 'MMM d, yyyy')}</span>
        </p>
      </div>
    </Link>
  );
}
