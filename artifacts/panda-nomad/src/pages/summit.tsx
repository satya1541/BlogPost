import { useState } from "react";
import { Sparkles, Calendar, MapPin, Award, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Summit() {
  const { toast } = useToast();
  const [registered, setRegistered] = useState(false);
  const [email, setEmail] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setRegistered(true);
    toast({
      title: "Ticket Reserved!",
      description: "You are registered on the waiting list for The Panda Nomad Summit 2026.",
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl animate-in fade-in duration-700">
      {/* Hero Banner */}
      <div className="relative border border-border/60 bg-muted/10 p-12 md:p-20 text-center rounded-sm overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 opacity-50" />
        <div className="relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/15 rounded-full text-accent text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Annual Summit
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-tight">
            The Panda Nomad <span className="italic text-accent">Summit 2026</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The premier global gathering of developers, designers, startup founders, and philosophy operators. Three days of building, keynotes, hacking, and offline connection.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground pt-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-accent" /> October 15-18, 2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-accent" /> Bali, Indonesia
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Detail Column */}
        <div className="space-y-6">
          <h2 className="font-serif text-3xl font-light">Why Attend?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unlike massive corporatized conferences, the Annual Summit is curated to maintain a high level of density, practical building workshops, and genuine offline connections.
          </p>
          <ul className="space-y-4">
            {[
              "Exclusive product building and code audits with expert operators.",
              "Startup hackathon session with a $15,000 cash prize pool.",
              "Vetted peer network of 100+ solopreneurs and independent founders.",
              "Curated evening keynotes on bootstrap finances, AI agents, and philosophy."
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Register Column */}
        <div className="border border-border/60 p-8 bg-background rounded-sm flex flex-col justify-center">
          {registered ? (
            <div className="text-center space-y-4 py-8">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-light">You're on the list!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your reservation has been recorded. We will email you ticket details, hotel partners, and agenda updates as we finalize our speaker list.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <h3 className="font-serif text-xl border-b border-border/40 pb-2">Join the Summit Waitlist</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tickets are limited to 150 attendees to preserve density and relationship-building. Input your email below to reserve early access.
              </p>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nomad@example.com"
                  className="w-full px-4 py-3 border border-border/60 bg-background text-sm focus:outline-none focus:border-accent transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary text-primary-foreground font-medium hover:bg-accent hover:text-white transition-colors text-sm"
              >
                Request Invite
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
