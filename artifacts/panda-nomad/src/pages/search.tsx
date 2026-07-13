import React, { useState, useEffect, useRef } from 'react';
import { useSearchArticles, getSearchArticlesQueryKey } from '@workspace/api-client-react';
import { ArticleCard } from '../components/article-card';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results, isLoading, isFetching } = useSearchArticles(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 2, queryKey: getSearchArticlesQueryKey({ q: debouncedQuery }) } }
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 min-h-[70vh] animate-in fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-16">
          <SearchIcon className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search essays, topics, or authors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-b-2 border-border py-6 pl-14 pr-12 text-3xl md:text-4xl font-serif outline-none focus:border-accent transition-colors placeholder:text-muted-foreground/50"
          />
          {isFetching && (
            <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 text-accent animate-spin" />
          )}
        </div>

        {debouncedQuery.length <= 2 ? (
          <div className="text-center text-muted-foreground py-20">
            <p className="text-xl">Type at least 3 characters to search.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[1, 2].map(i => (
              <div key={i} className="flex flex-col gap-4">
                <div className="h-48 bg-muted animate-pulse rounded-sm" />
                <div className="h-6 bg-muted animate-pulse w-3/4 rounded-sm" />
                <div className="h-4 bg-muted animate-pulse w-full rounded-sm" />
              </div>
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-8">
              Found {results.length} results for "{debouncedQuery}"
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {results.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-20">
            <p className="text-xl mb-4">No results found for "{debouncedQuery}"</p>
            <p className="text-sm">Try different keywords or browse our topics.</p>
          </div>
        )}
      </div>
    </div>
  );
}
