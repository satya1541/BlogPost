import React from 'react';
import { Link, useLocation } from 'wouter';
import { Search } from 'lucide-react';
import { NewsletterForm } from './newsletter-form';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navLinks = [
    { href: '/articles', label: 'Articles' },
    { href: '/topics', label: 'Topics' },
    { href: '/series', label: 'Series' },
    { href: '/about', label: 'About' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl tracking-tight text-primary flex items-center gap-2">
            <span className="text-accent italic">The</span> Panda Nomad
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground tracking-wide">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-foreground transition-colors ${location.startsWith(link.href) ? 'text-foreground' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/search" className="p-2 hover:bg-muted rounded-full transition-colors text-foreground">
              <Search className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="bg-primary text-primary-foreground pt-20 pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-3xl mb-4"><span className="text-accent italic">The</span> Panda Nomad</h2>
              <p className="text-primary-foreground/70 max-w-sm mb-8 leading-relaxed">
                Where ideas, entrepreneurship, technology, philosophy, and life intersect. A publication for founders, engineers, and lifelong learners.
              </p>
            </div>
            
            <div>
              <h3 className="font-serif text-xl mb-6 text-accent">Explore</h3>
              <ul className="space-y-4 text-primary-foreground/80">
                {navLinks.map(link => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-accent transition-colors">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-xl mb-6 text-accent">Newsletter</h3>
              <p className="text-sm text-primary-foreground/70 mb-4">Get our weekly essays delivered straight to your inbox.</p>
              <div className="bg-primary-foreground/5 p-1">
                <NewsletterForm />
              </div>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-primary-foreground/50">
            <p>© {new Date().getFullYear()} The Panda Nomad. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="cursor-pointer hover:text-primary-foreground transition-colors">Twitter</span>
              <span className="cursor-pointer hover:text-primary-foreground transition-colors">LinkedIn</span>
              <span className="cursor-pointer hover:text-primary-foreground transition-colors">RSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
