import React from 'react';
import { Link } from 'wouter';
import { useGetFeaturedArticle, useListArticles, useListTopics } from '@workspace/api-client-react';
import { ArticleCard } from '../components/article-card';
import { NewsletterForm } from '../components/newsletter-form';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  const { data: featuredArticle, isLoading: loadingFeatured } = useGetFeaturedArticle();
  const { data: latestArticles, isLoading: loadingLatest } = useListArticles({ limit: 6 });
  const { data: topics, isLoading: loadingTopics } = useListTopics();

  return (
    <div className="flex flex-col animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24 border-b border-border/50">
        {loadingFeatured ? (
          <div className="h-[60vh] bg-muted animate-pulse rounded-sm" />
        ) : featuredArticle ? (
          <ArticleCard article={featuredArticle} variant="featured" />
        ) : null}
      </section>

      {/* Latest Essays & Topics */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12 border-b border-border pb-4">
              <h2 className="font-serif text-3xl">Latest Essays</h2>
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
                        href={`/articles?topic=${topic.slug}`}
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
                  Join our community of lifelong learners. Get one well-crafted essay every Sunday morning.
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
