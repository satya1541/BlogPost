import React, { useEffect, useState } from "react";
import { customFetch } from "@workspace/api-client-react";
import { Download, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface Resource {
  id: number;
  title: string;
  slug: string;
  description: string;
  type: string;
  downloadUrl: string;
  isPremium: boolean;
}

export default function Resources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);

  useEffect(() => {
    customFetch<Resource[]>("/api/resources")
      .then(setResources)
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to load resources.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const handleDownload = async (resource: Resource) => {
    if (
      resource.isPremium &&
      (!user ||
        (user.role !== "premium" &&
          user.role !== "admin" &&
          user.role !== "super_admin"))
    ) {
      toast({
        title: "Premium Required",
        description:
          "This resource is locked for Premium Members. Please upgrade to download.",
        variant: "destructive",
      });
      return;
    }

    setDownloadingSlug(resource.slug);
    try {
      const res = await customFetch<{ downloadUrl: string }>(
        `/api/resources/${resource.slug}/download`,
      );
      window.open(res.downloadUrl, "_blank");
      toast({
        title: "Starting Download",
        description: `Downloading "${resource.title}"...`,
      });
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download this resource.",
        variant: "destructive",
      });
    } finally {
      setDownloadingSlug(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-5xl animate-pulse">
        <div className="h-10 bg-muted w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-48 bg-muted" />
          <div className="h-48 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl animate-in fade-in duration-700">
      <header className="mb-12 border-b border-border/50 pb-6">
        <h1 className="font-serif text-4xl mb-3 font-light">
          Founder <span className="font-normal italic text-accent">Resource Directory</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Premium toolkits, actionable checklists, and comprehensive frameworks
          curated to help you build and scale in public.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {resources.map((resource) => {
          const isLocked = resource.isPremium && !user;
          return (
            <div
              key={resource.id}
              className="border border-border/60 p-6 bg-muted/5 flex flex-col justify-between hover:border-primary/40 transition-colors rounded-sm relative overflow-hidden"
            >
              {resource.isPremium && (
                <div className="absolute top-3 right-3 bg-accent/15 text-accent text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Premium
                </div>
              )}

              <div>
                <span className="text-[10px] font-semibold text-accent tracking-widest uppercase block mb-3">
                  {resource.type}
                </span>
                <h3 className="font-serif text-xl mb-3 pr-16">
                  {resource.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {resource.description}
                </p>
              </div>

              <button
                onClick={() => handleDownload(resource)}
                disabled={downloadingSlug === resource.slug}
                className={`w-full py-3 px-4 flex items-center justify-center gap-2 border text-sm font-medium transition-all ${
                  isLocked
                    ? "border-border text-muted-foreground bg-muted/10 cursor-not-allowed hover:bg-muted/15"
                    : "border-primary/20 bg-background text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 text-accent" />
                    <span>Locked for Premium</span>
                  </>
                ) : downloadingSlug === resource.slug ? (
                  <span>Preparing...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {resource.type}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {!user ? (
        <div className="mt-16 border border-accent/20 bg-accent/5 p-8 text-center max-w-2xl mx-auto rounded-sm">
          <ShieldAlert className="w-8 h-8 text-accent mx-auto mb-4" />
          <h3 className="font-serif text-2xl mb-2">Unlock All Resources</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
            Join The Panda Nomad to get instant access to all our toolkits, frameworks, and actionable guides for free.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-accent text-white font-medium text-sm hover:bg-accent/90 transition-colors rounded-sm"
          >
            Create Free Account
          </Link>
        </div>
      ) : null}
    </div>
  );
}
