import React from 'react';
import { NewsletterForm } from '../components/newsletter-form';
import { Check } from 'lucide-react';

export default function Newsletter() {
  const benefits = [
    "One deep-dive article every Sunday morning.",
    "Curated links to fascinating reads across the web.",
    "Early access to new series and special projects.",
    "Zero spam. Zero corporate jargon. Just pure signal."
  ];

  return (
    <div className="min-h-[80vh] flex items-center py-20 animate-in fade-in duration-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1">
            <h1 className="font-serif text-5xl lg:text-6xl mb-6 leading-tight">
              The Panda Nomad <span className="text-accent italic">Weekly</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              Join thousands of founders, engineers, and lifelong learners who receive our finest articles directly in their inbox.
            </p>
            
            <div className="bg-muted/30 p-8 border border-border mb-10">
              <NewsletterForm />
              <p className="text-xs text-muted-foreground mt-4">
                We respect your inbox. Unsubscribe at any time with one click.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium text-foreground mb-4 uppercase tracking-widest text-sm">What to expect</h3>
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="order-1 lg:order-2 bg-primary p-12 lg:p-16 text-primary-foreground shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="50" fill="currentColor"/>
              </svg>
            </div>
            <p className="text-sm font-medium tracking-widest text-accent mb-8 uppercase">A Note from the Editor</p>
            <div className="font-serif text-2xl lg:text-3xl leading-relaxed italic text-primary-foreground/90 space-y-6 relative z-10">
              <p>
                "In an era of infinite scroll and algorithmic noise, attention is our most valuable asset."
              </p>
              <p>
                "The Weekly is designed to be a quiet place on the internet. A Sunday morning ritual accompanied by a good cup of coffee."
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
