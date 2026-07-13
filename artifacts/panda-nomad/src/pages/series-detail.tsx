import React, { useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useGetSeries, getGetSeriesQueryKey } from '@workspace/api-client-react';
import { ArticleCard } from '../components/article-card';
import { ArrowLeft } from 'lucide-react';

export default function SeriesDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: series, isLoading } = useGetSeries(slug || '', {
    query: { enabled: !!slug, queryKey: getGetSeriesQueryKey(slug || '') },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 animate-pulse">
        <div className="max-w-3xl mx-auto mb-20 text-center">
          <div className="h-4 bg-muted w-24 mx-auto mb-6" />
          <div className="h-12 bg-muted w-3/4 mx-auto mb-6" />
          <div className="h-4 bg-muted w-full mb-2" />
          <div className="h-4 bg-muted w-5/6 mx-auto" />
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <h1 className="font-serif text-3xl mb-4">Series not found</h1>
        <Link href="/series" className="text-accent hover:underline">Return to all series</Link>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-20 lg:py-32 text-center relative overflow-hidden">
        {series.coverImage && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <img src={series.coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
          </div>
        )}
        <div className="container mx-auto px-4 relative z-10 max-w-4xl">
          <Link href="/series" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-accent transition-colors text-sm mb-8">
            <ArrowLeft className="w-4 h-4" /> All Series
          </Link>
          <p className="text-sm font-semibold text-accent tracking-widest uppercase mb-4">
            A {series.articleCount}-Part Series
          </p>
          <h1 className="font-serif text-5xl lg:text-6xl mb-8 leading-tight">
            {series.name}
          </h1>
          <p className="text-xl text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto">
            {series.description}
          </p>
        </div>
      </header>

      {/* Articles Timeline */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 max-w-5xl">
        <div className="space-y-16">
          {series.articles.map((article, index) => (
            <div key={article.id} className="relative flex flex-col md:flex-row gap-8 lg:gap-16 group">
              {/* Part Number Indicator */}
              <div className="hidden md:flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-border flex items-center justify-center font-serif text-xl bg-background group-hover:border-accent group-hover:text-accent transition-colors z-10">
                  {index + 1}
                </div>
                {index !== series.articles.length - 1 && (
                  <div className="w-px h-full bg-border absolute top-12 bottom-[-4rem] left-[23px] group-hover:bg-accent/30 transition-colors" />
                )}
              </div>
              
              <div className="md:hidden text-accent font-serif text-2xl mb-[-1rem]">
                Part {index + 1}
              </div>

              <div className="flex-1">
                <ArticleCard article={article} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
