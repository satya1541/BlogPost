import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Search, ChevronDown } from 'lucide-react';
import { NewsletterForm } from './newsletter-form';
import { useAuth } from '../context/AuthContext';
import { OnboardingModal } from './onboarding-modal';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainLinks = [
    { href: '/articles', label: 'Articles' },
    { href: '/topics', label: 'Topics' },
    { href: '/series', label: 'Series' },
    { href: '/resources', label: 'Resources' },
    { href: '/academy', label: 'Academy' },
    { href: '/build-in-public', label: 'Roadmap' },
    { href: '/community', label: 'Community' },
  ];

  const dropdownLinks = [
    { href: '/podcasts', label: 'Podcasts' },
    { href: '/videos', label: 'Videos' },
    { href: '/mentorship', label: 'Mentorship' },
    { href: '/panda-labs', label: 'Panda Labs' },
    { href: '/fellowship', label: 'Fellowship' },
    { href: '/summit', label: 'Summit' },
    { href: '/founder-stories', label: 'Founder Stories' },
    { href: '/about', label: 'About' },
  ];

  const allLinks = [...mainLinks, ...dropdownLinks];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl tracking-tight text-primary flex items-center gap-2">
            <span className="text-accent italic">The</span> Panda Nomad
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground tracking-wide">
            {mainLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-foreground transition-colors ${location.startsWith(link.href) ? 'text-foreground' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="hover:text-foreground transition-colors flex items-center gap-1 focus:outline-none"
              >
                More <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {moreOpen && (
                <div className="absolute top-8 left-0 w-44 bg-background border border-border shadow-lg py-2 flex flex-col z-50 rounded-sm">
                  {dropdownLinks.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className={`px-4 py-2 hover:bg-muted text-sm text-left transition-colors ${location.startsWith(link.href) ? 'text-foreground font-semibold' : ''}`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/search" className="p-2 hover:bg-muted rounded-full transition-colors text-foreground">
              <Search className="w-5 h-5" />
            </Link>
            {user ? (
              <div className="flex items-center gap-4 text-sm">
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link href="/admin" className="hover:text-primary transition-colors font-medium text-accent">
                    Admin
                  </Link>
                )}
                {user.role !== 'premium' && user.role !== 'admin' && user.role !== 'super_admin' && (
                  <Link href="/upgrade" className="hover:text-primary transition-colors font-medium text-blue-500">
                    Upgrade
                  </Link>
                )}
                <Link href="/dashboard" className="hover:text-primary transition-colors font-medium">
                  Dashboard
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors font-medium text-xs rounded-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors text-sm rounded-sm"
              >
                Sign In
              </Link>
            )}
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
              <ul className="grid grid-cols-2 gap-x-8 gap-y-4 text-primary-foreground/80 text-sm">
                {allLinks.map(link => (
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
              <a href="/feeds/rss" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground transition-colors">RSS</a>
            </div>
          </div>
        </div>
      </footer>
      <OnboardingModal />
    </div>
  );
}
