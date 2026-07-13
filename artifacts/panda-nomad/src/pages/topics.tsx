import React from 'react';
import { Link } from 'wouter';
import { useListTopics } from '@workspace/api-client-react';

export default function Topics() {
  const { data: topics, isLoading } = useListTopics();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-in fade-in duration-500">
      <header className="mb-20 text-center max-w-3xl mx-auto">
        <h1 className="font-serif text-5xl mb-6">Topics</h1>
        <p className="text-xl text-muted-foreground">
          Explore our essays organized by theme. From the mechanics of building to the philosophy of living.
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
              href={`/articles?topic=${topic.slug}`}
              className="group p-10 border border-border hover:border-accent hover:shadow-lg transition-all duration-300 flex flex-col justify-center items-center text-center bg-card"
            >
              <h2 className="font-serif text-2xl mb-2 group-hover:text-accent transition-colors">
                {topic.name}
              </h2>
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">
                {topic.articleCount} Essays
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
