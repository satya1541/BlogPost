import React, { useMemo } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useListArticles } from '@workspace/api-client-react';
import { ArticleCard } from '../components/article-card';
import { ListArticlesSort } from '@workspace/api-client-react';
import { Filter } from 'lucide-react';

export default function Articles() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const topic = searchParams.get('topic') || undefined;
  const tag = searchParams.get('tag') || undefined;
  const series = searchParams.get('series') || undefined;
  const sort = (searchParams.get('sort') as ListArticlesSort) || 'newest';

  const [location, setLocation] = useLocation();

  const { data: articles, isLoading } = useListArticles({ 
    category: topic, 
    tag, 
    series, 
    sort 
  });

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchString);
    if (value) params.set(key, value);
    else params.delete(key);
    setLocation(`${location}?${params.toString()}`);
  };

  const title = useMemo(() => {
    if (topic) return `Topic: ${topic.charAt(0).toUpperCase() + topic.slice(1)}`;
    if (tag) return `Tag: #${tag}`;
    if (series) return `Series`;
    return 'All Articles';
  }, [topic, tag, series]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 animate-in fade-in duration-500">
      <header className="mb-16 border-b border-border pb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="font-serif font-extrabold text-4xl lg:text-5xl tracking-tight mb-3 text-foreground">{title}</h1>
          <p className="text-muted-foreground max-w-xl text-base font-sans">
            Explore our complete archive of thoughts, analyses, and perspectives.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select 
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="bg-transparent border-none text-foreground font-medium outline-none focus:ring-0 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex flex-col gap-4">
              <div className="aspect-[16/10] bg-muted animate-pulse" />
              <div className="h-6 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-full" />
            </div>
          ))}
        </div>
      ) : articles?.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">No articles found matching your criteria.</p>
          <button 
            onClick={() => setLocation('/articles')}
            className="mt-4 text-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
          {articles?.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
