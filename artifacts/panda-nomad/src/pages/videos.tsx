import { useState } from "react";
import { Play, Tv, X, BookOpen } from "lucide-react";

interface Video {
  id: number;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
  embedId: string;
  description: string;
}

const VIDEOS: Video[] = [
  {
    id: 1,
    title: "Next.js 15 App Router Deep-Dive & Architecture",
    category: "Engineering",
    duration: "18:45",
    thumbnail: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&q=80&w=600",
    embedId: "dQw4w9WgXcQ", // Rickroll as fallback, can embed real dev talk
    description: "An advanced engineering workshop covering Next.js 15 Server Actions, dynamic caching states, nested layouts, and optimizing hydration speeds."
  },
  {
    id: 2,
    title: "How to Build a Multi-Tenant SaaS with Drizzle ORM",
    category: "Databases",
    duration: "24:10",
    thumbnail: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=600",
    embedId: "dQw4w9WgXcQ",
    description: "In this session, we code a secure multi-tenant schema partitioning architecture using Drizzle ORM, row-level security concepts, and MySQL connection pooling."
  },
  {
    id: 3,
    title: "Bootstrap to $50K MRR: No VC, No Permissions",
    category: "Foundership",
    duration: "15:30",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600",
    embedId: "dQw4w9WgXcQ",
    description: "A case study walkthrough on launching, marketing, and scaling a single-person SaaS application without spending a dollar on paid ads or seeking venture funding."
  }
];

export default function Videos() {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-6xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-700/10 rounded-full text-red-700 dark:text-red-500 text-xs font-bold uppercase tracking-widest mb-4">
          <Tv className="w-3.5 h-3.5" /> Videos
        </div>
        <h1 className="font-serif font-extrabold text-4xl md:text-5xl mb-4 tracking-tight">
          Premium <span className="italic text-red-700 dark:text-red-500">Video Lessons</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans">
          Unlock high-fidelity screen-shares and developer walk-throughs covering database schemas, UI frameworks, and product design secrets.
        </p>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {VIDEOS.map((video) => (
          <div
            key={video.id}
            className="border border-border/50 bg-background hover:border-primary/50 transition-all rounded-sm overflow-hidden flex flex-col group"
          >
            {/* Thumbnail Box */}
            <div className="relative aspect-video overflow-hidden bg-muted shrink-0 cursor-pointer" onClick={() => setActiveVideo(video)}>
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/30 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 bg-background/90 text-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
              <span className="absolute bottom-2 right-2 px-2 py-1 bg-primary/80 text-primary-foreground font-mono text-xs font-semibold rounded-sm">
                {video.duration}
              </span>
            </div>

            {/* Info */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-red-700 dark:text-red-500 font-extrabold text-[11px] uppercase tracking-wider block font-sans">
                  {video.category}
                </span>
                <h3
                  className="font-serif font-extrabold text-lg text-foreground hover:text-red-700 dark:hover:text-red-400 cursor-pointer transition-colors"
                  onClick={() => setActiveVideo(video)}
                >
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{video.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Dialog */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-4xl rounded-sm shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
              title="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideo.embedId}?autoplay=1`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-semibold text-accent tracking-widest uppercase mb-1 block">
                {activeVideo.category}
              </span>
              <h3 className="font-serif text-2xl font-light mb-2">{activeVideo.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{activeVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
