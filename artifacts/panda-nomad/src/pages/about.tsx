import React from 'react';
import { Link } from 'wouter';

export default function About() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-in fade-in duration-700">
      <div className="max-w-3xl mx-auto">
        <header className="mb-16 text-center">
          <h1 className="font-serif text-5xl md:text-6xl mb-6">About Us</h1>
          <p className="text-2xl text-accent font-serif italic">
            Explore Ideas. Build Knowledge. Inspire Action.
          </p>
        </header>

        <div className="prose prose-lg md:prose-xl prose-stone mx-auto">
          <p className="lead text-2xl text-muted-foreground leading-relaxed mb-10">
            The Panda Nomad is an independent digital publication exploring the intersection of technology, entrepreneurship, philosophy, and modern life.
          </p>

          <h2>Our Philosophy</h2>
          <p>
            We believe that the best ideas are found at the boundaries between disciplines. An engineer who studies philosophy builds differently. A founder who understands history leads differently.
          </p>
          <p>
            In a digital landscape optimized for outrage and brief attention spans, we are building a quiet corner optimized for deep thought and lasting insight. We do not chase the news cycle. We publish essays that will be as relevant in five years as they are today.
          </p>

          <h2>Who This Is For</h2>
          <p>
            Our readers are builders, thinkers, and lifelong learners. They are people who read to understand, not just to react. If you find yourself constantly asking "why" and "how," you belong here.
          </p>

          <hr className="my-12 border-border" />

          <div className="bg-muted p-10 text-center">
            <h3 className="font-serif text-3xl mb-4 mt-0">Join the Journey</h3>
            <p className="text-muted-foreground mb-8">
              The best way to experience The Panda Nomad is through our weekly newsletter.
            </p>
            <Link 
              href="/newsletter"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors"
            >
              Subscribe to The Weekly
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
