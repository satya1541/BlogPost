import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { useGetFeaturedArticle, useListArticles, useListTopics, ArticleSummary } from '@workspace/api-client-react';
import { ArticleCard } from '../components/article-card';
import { NewsletterForm } from '../components/newsletter-form';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { format } from 'date-fns';

function EditorialHero({ articles }: { articles: ArticleSummary[] }) {
  if (!articles || articles.length === 0) return null;

  // Middle Hero Article (Featured / Main Story)
  const mainArticle = articles[0];
  // Left Column Articles (Editor's Pick)
  const leftArticles = articles.slice(1, 3);
  // Right Column Articles (Just In / All Latest Blogs without images)
  const rightArticles = articles.slice(3, 10);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">
      {/* ─── LEFT COLUMN: EDITOR'S PICK ─── */}
      <div className="lg:col-span-3 space-y-6">
        <div className="border-b border-border/50 pb-2 mb-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground font-sans">
            EDITOR'S PICK
          </h3>
        </div>

        {leftArticles.map((article, idx) => (
          <div key={article.id} className={idx > 0 ? "pt-4 border-t border-border/30" : ""}>
            <Link href={`/articles/${article.slug}`} className="group block">
              {article.coverImage && (
                <div className="w-full aspect-[16/10] overflow-hidden rounded-xs border border-border/20 mb-3 bg-muted">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <span className="text-red-700 dark:text-red-500 font-extrabold text-[11px] uppercase tracking-wider block mb-1">
                {article.category}
              </span>
              <h4 className="font-serif text-base font-bold leading-snug text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-3">
                {article.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-sans">
                <span>{article.author}</span>
                <span>{article.readingTimeMinutes} mins read</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* ─── MIDDLE COLUMN: OUR LATEST NEWS ─── */}
      <div className="lg:col-span-6 lg:px-6 lg:border-x border-border/30 space-y-3">
        <Link href={`/articles/${mainArticle.slug}`} className="group block">
          <span className="text-red-700 dark:text-red-500 font-extrabold text-xs uppercase tracking-wider block mb-1">
            {mainArticle.category}
          </span>
          <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors mb-3">
            {mainArticle.title}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-sans mb-4">
            <span className="font-semibold text-foreground">{mainArticle.author}</span>
            <span>·</span>
            <span>{mainArticle.readingTimeMinutes} mins read</span>
          </div>
          {mainArticle.coverImage && (
            <div className="w-full aspect-[16/10] overflow-hidden rounded-xs border border-border/20 mb-4 bg-muted">
              <img
                src={mainArticle.coverImage}
                alt={mainArticle.title}
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
              />
            </div>
          )}
          {mainArticle.excerpt && (
            <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed font-sans">
              {mainArticle.excerpt}
            </p>
          )}
        </Link>
      </div>

      {/* ─── RIGHT COLUMN: ALL LATEST BLOGS WITHOUT IMAGES ─── */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground font-sans">
              JUST IN
            </h3>
          </div>
          <Link href="/articles" className="text-xs text-muted-foreground hover:text-red-700 transition-colors">
            →
          </Link>
        </div>

        <div className="divide-y divide-border/30">
          {rightArticles.map((article) => (
            <div key={article.id} className="py-2.5 first:pt-0 last:pb-0">
              <Link href={`/articles/${article.slug}`} className="group block">
                <span className="text-red-700 dark:text-red-500 font-extrabold text-[11px] uppercase tracking-wider block mb-1">
                  {article.category}
                </span>
                <h4 className="font-serif text-sm font-bold leading-snug text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <div className="text-[10px] text-muted-foreground mt-1 font-sans">
                  {article.readingTimeMinutes} mins read
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { data: latestArticles, isLoading: loadingLatest } = useListArticles({ limit: 12 });
  const { data: topics, isLoading: loadingTopics } = useListTopics();

  return (
    <div className="flex flex-col animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 lg:pt-8 lg:pb-8 border-b border-border/30">
        {loadingLatest ? (
          <div className="h-[50vh] bg-muted animate-pulse rounded-md" />
        ) : latestArticles && latestArticles.length > 0 ? (
          <EditorialHero articles={latestArticles} />
        ) : null}
      </section>

      {/* Latest Essays & Topics */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 lg:pt-8 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12 border-b border-border pb-4">
              <h2 className="font-serif text-3xl">Latest Articles</h2>
              <Link href="/articles" className="text-sm font-medium text-accent hover:text-foreground transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {loadingLatest ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex flex-col gap-4">
                    <div className="h-48 bg-muted animate-pulse rounded-sm" />
                    <div className="h-6 bg-muted animate-pulse w-3/4 rounded-sm" />
                    <div className="h-4 bg-muted animate-pulse w-full rounded-sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16">
                {latestArticles?.map(article => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32">
              <h2 className="font-serif text-2xl mb-8 border-b border-border pb-4">Explore Topics</h2>
              {loadingTopics ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-6 bg-muted animate-pulse rounded-sm w-full" />)}
                </div>
              ) : (
                <ul className="space-y-4">
                  {topics?.map(topic => (
                    <li key={topic.slug}>
                      <Link 
                        href={`/articles?topic=${encodeURIComponent(topic.slug)}`}
                        className="group flex items-center justify-between text-muted-foreground hover:text-accent transition-colors"
                      >
                        <span className="font-medium">{topic.name}</span>
                        <span className="text-xs bg-muted group-hover:bg-accent/10 px-2 py-1 rounded-full transition-colors">
                          {topic.articleCount}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="mt-16 bg-muted/50 p-8 border border-border">
                <h3 className="font-serif text-xl mb-3">The Panda Nomad Weekly</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Join our community of lifelong learners. Get one well-crafted article every Sunday morning.
                </p>
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
