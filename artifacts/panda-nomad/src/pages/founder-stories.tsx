import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Quote } from "lucide-react";

interface StorySummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  intervieweeName: string;
  intervieweeTitle: string;
  intervieweeAvatar: string;
  createdAt: string;
}

export default function FounderStories() {
  const { toast } = useToast();
  const [stories, setStories] = useState<StorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customFetch<StorySummary[]>("/api/founder-stories")
      .then(setStories)
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load founder stories.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-5xl animate-pulse">
        <div className="h-10 bg-muted w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 bg-muted" />
          <div className="h-64 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl animate-in fade-in duration-700">
      <header className="mb-12 border-b border-border/50 pb-6">
        <h1 className="font-serif text-4xl mb-3 font-light">
          Founder <span className="font-normal italic text-accent">Stories</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Deep-dive, unfiltered Q&A interviews with developers,
          bio-technologists, creators, and builders who are forging the future.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {stories.map((story) => (
          <div
            key={story.id}
            className="border border-border/50 p-8 hover:border-primary/40 transition-colors bg-background flex flex-col justify-between rounded-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold text-accent tracking-widest uppercase">
                  {story.category}
                </span>
                <Quote className="w-5 h-5 text-accent/20" />
              </div>
              <Link
                href={`/founder-stories/${story.slug}`}
                className="font-serif text-2xl hover:text-accent transition-colors block mb-4 leading-snug"
              >
                {story.title}
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {story.excerpt}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-6 border-t border-border/40">
              <img
                src={story.intervieweeAvatar}
                alt={story.intervieweeName}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {story.intervieweeName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {story.intervieweeTitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
