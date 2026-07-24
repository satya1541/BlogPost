import React from 'react';
import { Link } from 'wouter';
import { useListSeries } from '@workspace/api-client-react';

export default function Series() {
  const { data: series, isLoading } = useListSeries();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-in fade-in duration-500">
      <header className="mb-20 max-w-3xl border-b border-border pb-10">
        <h1 className="font-serif font-extrabold text-4xl lg:text-5xl mb-4 tracking-tight text-foreground">Featured Series</h1>
        <p className="text-lg text-muted-foreground font-sans">
          Deep dives into complex subjects. Curated collections of articles designed to be read together.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-20">
          {[1, 2].map(i => (
            <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-[16/9] bg-muted animate-pulse" />
              <div className="flex flex-col justify-center gap-4">
                <div className="h-8 bg-muted animate-pulse w-1/2" />
                <div className="h-4 bg-muted animate-pulse w-full" />
                <div className="h-4 bg-muted animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-24">
          {series?.map(s => (
            <div key={s.slug} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center group">
              <Link href={`/series/${s.slug}`} className="block overflow-hidden aspect-[16/10] bg-muted rounded-xs border border-border/20">
                {s.coverImage ? (
                  <img 
                    src={s.coverImage} 
                    alt={s.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground font-serif font-bold text-2xl">
                    {s.name}
                  </div>
                )}
              </Link>
              <div>
                <span className="text-red-700 dark:text-red-500 font-extrabold text-xs tracking-wider uppercase mb-2 block font-sans">
                  {s.articleCount} Parts
                </span>
                <h2 className="font-serif font-extrabold text-3xl lg:text-4xl mb-4">
                  <Link href={`/series/${s.slug}`} className="hover:text-red-700 dark:hover:text-red-400 transition-colors">
                    {s.name}
                  </Link>
                </h2>
                <p className="text-base text-muted-foreground mb-6 leading-relaxed font-sans">
                  {s.description}
                </p>
                <Link 
                  href={`/series/${s.slug}`}
                  className="inline-flex items-center justify-center px-6 py-3 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors font-medium text-sm"
                >
                  Start Reading
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
