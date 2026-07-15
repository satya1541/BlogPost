import { useState, useEffect } from "react";
import { Sparkles, Plus, ArrowUp, ArrowDown, Send, X, Lightbulb } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

interface Idea {
  id: number;
  title: string;
  problem: string;
  solution: string;
  votes: number;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
}

export default function PandaLabs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<number, "up" | "down">>({});

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const list = await customFetch<Idea[]>("/api/panda-labs/ideas");
      setIdeas(list);
    } catch {}
  };

  const handleVote = async (ideaId: number, type: "up" | "down") => {
    if (!user) {
      toast({ title: "Sign in required", description: "You must be signed in to vote on ideas." });
      return;
    }
    const currentVote = votedIds[ideaId];
    if (currentVote === type) return; // already voted this direction

    try {
      const res = await customFetch<{ success: boolean; votes: number }>(`/api/panda-labs/ideas/${ideaId}/vote`, {
        method: "POST",
        body: JSON.stringify({ voteType: type }),
      });
      setIdeas(prev =>
        prev.map(i => i.id === ideaId ? { ...i, votes: res.votes } : i)
      );
      setVotedIds(prev => ({ ...prev, [ideaId]: type }));
    } catch {
      toast({ title: "Error", description: "Failed to cast vote.", variant: "destructive" });
    }
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !problem.trim() || !solution.trim()) return;
    setSubmitting(true);
    try {
      const newIdea = await customFetch<Idea>("/api/panda-labs/ideas", {
        method: "POST",
        body: JSON.stringify({ title, problem, solution }),
      });
      setIdeas(prev => [
        { ...newIdea, user: { id: user!.id, email: user!.email } },
        ...prev
      ]);
      toast({
        title: "Idea Submitted!",
        description: "Your startup proposal has been posted to Panda Labs.",
      });
      setShowSubmitModal(false);
      setTitle("");
      setProblem("");
      setSolution("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to post idea.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-xs font-semibold uppercase tracking-widest mb-4">
          <Lightbulb className="w-3.5 h-3.5" /> Panda Labs
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
          The Open <span className="italic text-accent">Idea Incubator</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Submit product drafts, micro-SaaS concepts, or deep-tech startup frameworks. Gather validation and crowdsource reviews from our active nomad builders.
        </p>
      </div>

      {/* Control Actions */}
      <div className="flex justify-between items-center border-b border-border/40 pb-6 mb-8">
        <h2 className="font-serif text-2xl">Submitted Startup Proposals</h2>
        <button
          onClick={() => {
            if (!user) {
              toast({ title: "Sign in required", description: "You must be signed in to submit an idea." });
              return;
            }
            setShowSubmitModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white font-semibold text-xs hover:bg-accent/90 transition-colors rounded-sm"
        >
          <Plus className="w-4 h-4" /> Share an Idea
        </button>
      </div>

      {/* Ideas Listing */}
      {ideas.length > 0 ? (
        <div className="space-y-6">
          {ideas.map((idea) => {
            const currentVote = votedIds[idea.id];
            return (
              <div
                key={idea.id}
                className="border border-border/50 p-6 bg-background rounded-sm flex items-start gap-6 hover:border-primary/30 transition-colors"
              >
                {/* Voting Column */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-muted/30 p-2 rounded-sm border border-border/40">
                  <button
                    onClick={() => handleVote(idea.id, "up")}
                    className={`hover:text-accent transition-colors ${currentVote === "up" ? "text-accent" : "text-muted-foreground"}`}
                    title="Upvote"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold font-mono">{idea.votes}</span>
                  <button
                    onClick={() => handleVote(idea.id, "down")}
                    className={`hover:text-accent transition-colors ${currentVote === "down" ? "text-accent" : "text-muted-foreground"}`}
                    title="Downvote"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-foreground mb-1">{idea.title}</h3>
                    <p className="text-xs text-muted-foreground">Proposed by: {idea.user?.email || "Nomad Builder"}</p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">The Problem</h4>
                      <p className="text-muted-foreground leading-relaxed">{idea.problem}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">The Solution</h4>
                      <p className="text-muted-foreground leading-relaxed">{idea.solution}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border p-16 text-center bg-muted/5 rounded-sm">
          <p className="text-sm text-muted-foreground italic mb-2">No startup ideas have been proposed yet.</p>
          <p className="text-xs text-muted-foreground">Be the first to share your micro-SaaS mockup!</p>
        </div>
      )}

      {/* Share Idea Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-lg rounded-sm shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <form onSubmit={handleSubmitIdea} className="p-8 space-y-6">
              <div>
                <h3 className="font-serif text-2xl mb-1">Incubate a New Idea</h3>
                <p className="text-sm text-muted-foreground">Draft your problem validation and technical solution.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Startup / Product Name
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., CodeSnap SaaS, Drizzle Migrator Client"
                  className="w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  What is the target problem?
                </label>
                <textarea
                  required
                  rows={3}
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What is the core user pain point? Who experiences it?"
                  className="w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-accent transition-colors text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  What is your proposed solution?
                </label>
                <textarea
                  required
                  rows={3}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="How does your application validate or solve this pain point?"
                  className="w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-accent transition-colors text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 text-sm"
              >
                <Send className="w-4 h-4" /> {submitting ? "Publishing concept..." : "Submit to Incubator"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
