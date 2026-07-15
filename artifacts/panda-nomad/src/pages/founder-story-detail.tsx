import React, { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface QAItem {
  q: string;
  a: string;
}

interface FounderStory {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // JSON Q&As
  category: string;
  intervieweeName: string;
  intervieweeTitle: string;
  intervieweeAvatar: string;
  createdAt: string;
}

export default function FounderStoryDetail() {
  const [, params] = useRoute("/founder-stories/:slug");
  const slug = params?.slug;
  const { toast } = useToast();
  const [story, setStory] = useState<FounderStory | null>(null);
  const [loading, setLoading] = useState(true);
  const [qaItems, setQaItems] = useState<QAItem[]>([]);

  useEffect(() => {
    if (!slug) return;
    customFetch<FounderStory>(`/api/founder-stories/${slug}`)
      .then((data) => {
        setStory(data);
        try {
          setQaItems(JSON.parse(data.content));
        } catch {
          setQaItems([]);
        }
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load founder story.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl animate-pulse">
        <div className="h-6 w-24 bg-muted mb-8" />
        <div className="h-10 bg-muted w-3/4 mb-4" />
        <div className="h-20 bg-muted mb-12" />
        <div className="space-y-6">
          <div className="h-24 bg-muted" />
          <div className="h-24 bg-muted" />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h2 className="font-serif text-3xl mb-4">Interview Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The story you are looking for does not exist.
        </p>
        <Link
          href="/founder-stories"
          className="text-accent font-medium hover:underline"
        >
          Back to Stories
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl animate-in fade-in duration-700">
      <Link
        href="/founder-stories"
        className="inline-flex items-center gap-2 text-sm text-accent hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to stories
      </Link>

      <header className="mb-12 border-b border-border/40 pb-8">
        <span className="text-xs font-semibold text-accent tracking-widest uppercase block mb-3">
          {story.category}
        </span>
        <h1 className="font-serif text-3xl md:text-4xl mb-6 leading-tight font-light text-foreground">
          {story.title}
        </h1>

        <div className="flex items-center gap-4 bg-muted/20 p-5 border border-border/40 rounded-sm">
          <img
            src={story.intervieweeAvatar}
            alt={story.intervieweeName}
            className="w-12 h-12 rounded-full object-cover border border-border"
          />
          <div>
            <h4 className="font-semibold text-foreground">
              {story.intervieweeName}
            </h4>
            <p className="text-sm text-muted-foreground">
              {story.intervieweeTitle}
            </p>
          </div>
        </div>
      </header>

      {/* Q&A Thread Layout */}
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        {qaItems.map((item, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="font-serif text-xl text-accent font-semibold leading-none select-none">
                Q
              </span>
              <h3 className="font-serif text-lg md:text-xl font-medium text-foreground leading-relaxed">
                {item.q}
              </h3>
            </div>
            <div className="flex items-start gap-4 pl-0 md:pl-6 border-l-0 md:border-l border-border/40">
              <span className="font-serif text-xl text-muted-foreground font-semibold leading-none select-none hidden md:inline">
                A
              </span>
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {item.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
