import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-serif text-8xl text-muted mb-6">404</h1>
      <h2 className="font-serif text-3xl mb-4">Page not found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 border border-border hover:border-accent hover:text-accent transition-colors font-medium"
      >
        Return to Home
      </Link>
    </div>
  );
}
