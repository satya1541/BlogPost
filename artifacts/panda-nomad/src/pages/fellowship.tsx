import { useState } from "react";
import { Award, ShieldCheck, Check, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

export default function Fellowship() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [startupName, setStartupName] = useState("");
  const [startupStage, setStartupStage] = useState("idea");
  const [teamSize, setTeamSize] = useState("1");
  const [pitch, setPitch] = useState("");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupName.trim() || !pitch.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Application Received!",
        description: "Thank you for applying to the Founder Fellowship. We will review and reach out within 7 days.",
      });
    }, 1200);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-4xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-xs font-semibold uppercase tracking-widest mb-4">
          <Award className="w-3.5 h-3.5" /> Fellowship
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
          The Founder <span className="italic text-accent">Fellowship</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          An elite, equity-free 8-week virtual accelerator program matching top-tier nomad software engineers and bootstrap founders with resources, operators, and distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Core Perks */}
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-semibold border-b border-border/40 pb-2">Program Offerings</h3>
          <ul className="space-y-4">
            {[
              {
                title: "$10,000 Equity-Free Grant",
                desc: "Non-dilutive capital to get your servers running and bootstrap initial marketing scripts."
              },
              {
                title: "1-on-1 Dedicated Mentorship",
                desc: "Weekly audits of your technical stack, database schemas, and growth funnels with vetted operators."
              },
              {
                title: "Vetted Nomad Network",
                desc: "Collaborate in a private channel with 20 other elite founders bootstrapping software products globally."
              },
              {
                title: "Exclusive Partner Credits",
                desc: "Over $50,000 in partner credits (AWS, Stripe, OpenAI, Drizzle, etc.)."
              }
            ].map((perk, idx) => (
              <li key={idx} className="flex gap-3">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{perk.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{perk.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Application Form */}
        <div className="border border-border/60 p-8 bg-background/50 rounded-sm">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl">Application Submitted!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your application for the upcoming cohort has been registered. Our admissions board will evaluate your pitch and contact you via email shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleApply} className="space-y-5">
              <h3 className="font-serif text-xl border-b border-border/40 pb-2 mb-4">Apply for Cohort 2026</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Startup / Project Name
                </label>
                <input
                  type="text"
                  required
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  placeholder="e.g., Panda Analytics Client"
                  className="w-full px-4 py-2.5 border border-border/60 bg-background text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Startup Stage
                  </label>
                  <select
                    value={startupStage}
                    onChange={(e) => setStartupStage(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border/60 bg-background text-xs focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="idea">Idea Stage</option>
                    <option value="mvp">Prototype / MVP</option>
                    <option value="revenue">Generating Revenue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Team Size
                  </label>
                  <select
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border/60 bg-background text-xs focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="1">Solo Founder (1)</option>
                    <option value="2-4">Small Team (2-4)</option>
                    <option value="5+">Established (5+)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Elevator Pitch & What are you building?
                </label>
                <textarea
                  required
                  rows={4}
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Explain the problem, your solution, and your technical stack."
                  className="w-full px-4 py-2.5 border border-border/60 bg-background text-sm focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 text-sm"
              >
                <Send className="w-4 h-4" /> {submitting ? "Submitting application..." : "Submit Application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
