import { useState, useEffect } from "react";
import { UserCheck, ShieldCheck, Mail, Send, X, Users } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

interface Mentor {
  id: number;
  name: string;
  role: string;
  company: string;
  bio: string;
  avatar: string;
  topics: string[];
}

const MENTORS: Mentor[] = [
  {
    id: 1,
    name: "Alex Rivera",
    role: "Founding Engineer",
    company: "ScaleTech AI",
    bio: "Ex-Stripe staff engineer. Specialized in distributed databases, API design, Node/Go service architecture, and bootstrapping product infrastructure.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    topics: ["Backend Scaling", "System Design", "Bootstrap Engineering"],
  },
  {
    id: 2,
    name: "Sophia Zhang",
    role: "VP of Product",
    company: "FlowSaaS",
    bio: "Operator who scaled multiple products from $100K to $15M ARR. Expert in growth hacking, user conversion optimization, and product analytics.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    topics: ["Growth & Funnels", "Product Discovery", "Pricing Strategy"],
  },
];

export default function Mentorship() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      customFetch<any[]>("/api/mentorship/requests")
        .then(setMyRequests)
        .catch(() => {});
    }
  }, [user]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMentor || !topic.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const newReq = await customFetch<any>("/api/mentorship/requests", {
        method: "POST",
        body: JSON.stringify({
          mentorName: activeMentor.name,
          topic,
          message,
        }),
      });
      setMyRequests(prev => [newReq, ...prev]);
      toast({
        title: "Request Sent!",
        description: `Your mentorship request to ${activeMentor.name} has been submitted.`,
      });
      setActiveMentor(null);
      setTopic("");
      setMessage("");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-xs font-semibold uppercase tracking-widest mb-4">
          <Users className="w-3.5 h-3.5" /> Mentorship
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
          Founder <span className="italic text-accent">Office Hours</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Book 1-on-1 chats with vetted operators, technical architects, and product veterans to audit your architecture or pricing.
        </p>
      </div>

      {/* Vetted Mentors Listing */}
      <h2 className="font-serif text-2xl border-b border-border/40 pb-3 mb-8">Vetted Operators</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {MENTORS.map((m) => (
          <div
            key={m.id}
            className="border border-border/60 p-6 bg-background rounded-sm flex flex-col md:flex-row gap-6 hover:border-accent/40 transition-colors"
          >
            <img src={m.avatar} alt={m.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
            <div className="flex-1 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold">{m.name}</h3>
                  <div className="inline-flex items-center gap-1 text-[10px] text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-full font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Vetted
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{m.role} @ {m.company}</p>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{m.bio}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {m.topics.map((t, idx) => (
                    <span key={idx} className="bg-muted px-2 py-1 text-xs text-muted-foreground rounded-sm">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    toast({ title: "Sign in required", description: "You must be signed in to request mentorship." });
                    return;
                  }
                  setActiveMentor(m);
                }}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs hover:bg-accent hover:text-white transition-colors rounded-sm"
              >
                <Mail className="w-4 h-4" /> Request Office Hours
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submitted Requests */}
      {user && myRequests.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl border-b border-border/40 pb-3 mb-8">My Office Hour Requests</h2>
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div key={req.id} className="border border-border/60 p-6 bg-muted/5 rounded-sm flex justify-between items-start gap-4">
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-semibold">Session with {req.mentorName}</h4>
                  <p className="text-xs text-muted-foreground">Topic: {req.topic}</p>
                  <p className="text-sm text-muted-foreground">{req.message}</p>
                </div>
                <span className={`text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full ${
                  req.status === "approved"
                    ? "bg-emerald-100 text-emerald-800"
                    : req.status === "declined"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Modal Form */}
      {activeMentor && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-lg rounded-sm shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setActiveMentor(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <form onSubmit={handleSubmitRequest} className="p-8 space-y-6">
              <div>
                <h3 className="font-serif text-2xl mb-1">Request Office Hours</h3>
                <p className="text-sm text-muted-foreground">Submit a direct session proposal to {activeMentor.name}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Discussion Topic
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Growth tactics, database design review"
                  className="w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-accent transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Session Details & Problem Statement
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your startup, stack, and the specific blockers you are facing."
                  className="w-full px-4 py-3 border border-border/60 bg-background text-foreground focus:outline-none focus:border-accent transition-colors text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 text-sm"
              >
                <Send className="w-4 h-4" /> {submitting ? "Sending..." : "Submit Proposal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
