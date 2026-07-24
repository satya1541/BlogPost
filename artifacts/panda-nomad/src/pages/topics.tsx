import React from 'react';
import { Link } from 'wouter';
import { useListTopics } from '@workspace/api-client-react';

export default function Topics() {
  const { data: topics, isLoading } = useListTopics();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-in fade-in duration-500">
      <header className="mb-20 text-center max-w-3xl mx-auto">
        <h1 className="font-serif font-extrabold text-4xl lg:text-5xl mb-4 tracking-tight text-foreground">Topics</h1>
        <p className="text-lg text-muted-foreground font-sans">
          Explore our articles organized by theme. From the mechanics of building to the philosophy of living.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-muted animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {topics?.map(topic => (
            <Link 
              key={topic.slug} 
              href={`/articles?topic=${encodeURIComponent(topic.slug)}`}
              className="group p-10 border border-border hover:border-red-700/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-center items-center text-center bg-card"
            >
              <h2 className="font-serif font-extrabold text-2xl mb-2 text-foreground group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                {topic.name}
              </h2>
              <p className="text-red-700 dark:text-red-500 font-extrabold text-[11px] uppercase tracking-wider font-sans">
                {topic.articleCount} Articles
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
