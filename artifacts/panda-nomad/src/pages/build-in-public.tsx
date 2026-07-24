import React, { useState } from "react";
import { Flame, CheckCircle, Clock, Award, Hammer, Compass, BarChart } from "lucide-react";

interface Milestone {
  title: string;
  date: string;
  completed: boolean;
}

interface TimelineStage {
  number: number;
  name: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "planned";
  summary: string;
  description: string;
  metrics: string[];
  milestones: Milestone[];
  tools: string[];
}

export default function BuildInPublic() {
  const [activeStage, setActiveStage] = useState<number>(4); // Default to prototype/building stage

  const stages: TimelineStage[] = [
    {
      number: 1,
      name: "Idea & Thesis",
      icon: <Compass className="w-5 h-5" />,
      status: "completed",
      summary: "Mapping out the editorial direction and core values.",
      description: "We set out to build an editorial platform dedicated to deep-dive technology analysis, solopreneur strategies, and scientific discovery. The thesis: builders need actionable insights, not sensational headlines.",
      metrics: ["1 Core Manifesto written", "100+ target topics brainstormed"],
      tools: ["Notion", "Excalidraw"],
      milestones: [
        { title: "Define publication manifesto", date: "Jan 2026", completed: true },
        { title: "Identify primary reader personas", date: "Jan 2026", completed: true },
      ],
    },
    {
      number: 2,
      name: "Market Research",
      icon: <BarChart className="w-5 h-5" />,
      status: "completed",
      summary: "Analyzing competitor landscape and audience channels.",
      description: "We researched current tech newsletters, blogs, and subscription sites. We interviewed 50 creators and founders to understand their reading habits and what premium resources they would value most.",
      metrics: ["50+ founder interviews", "3 competitor analyses completed"],
      tools: ["Google Forms", "Airtable"],
      milestones: [
        { title: "Conduct founder survey", date: "Feb 2026", completed: true },
        { title: "Map competitor pricing tiers", date: "Feb 2026", completed: true },
      ],
    },
    {
      number: 3,
      name: "Validation & Signups",
      icon: <Flame className="w-5 h-5" />,
      status: "completed",
      summary: "Launching the landing page to gauge interest.",
      description: "We launched a minimal email capture page to test our core value proposition. We promoted the landing page on Twitter/X, LinkedIn, and Indie Hackers.",
      metrics: ["1,500+ pre-launch signups", "18.5% conversion rate"],
      tools: ["Vite", "Tailwind CSS", "Resend"],
      milestones: [
        { title: "Deploy initial landing page", date: "Mar 2026", completed: true },
        { title: "Reach 1,000 email subscribers", date: "Apr 2026", completed: true },
      ],
    },
    {
      number: 4,
      name: "Prototype & Core Engine",
      icon: <Hammer className="w-5 h-5" />,
      status: "current",
      summary: "Building the custom blog platform engine.",
      description: "Currently engineering the core Vite + Express + Drizzle MySQL application. We are implementing robust authentication, bookmarking, article streams, and the resource download directory.",
      metrics: ["Vite frontend running", "MySQL database synchronized", "Auth session flow complete"],
      tools: ["React", "Express", "Drizzle ORM", "MySQL"],
      milestones: [
        { title: "Complete database schema push", date: "May 2026", completed: true },
        { title: "Implement token-based auth flow", date: "Jun 2026", completed: true },
        { title: "Develop bookmarks & comments UI", date: "Jul 2026", completed: true },
        { title: "Build resources & stories index", date: "Jul 2026", completed: false },
      ],
    },
    {
      number: 5,
      name: "Official Launch",
      icon: <Award className="w-5 h-5" />,
      status: "planned",
      summary: "Opening the doors to all readers.",
      description: "Launching the production application, unlocking the first 10 articles, loading the initial resource toolkit checklist downloads, and opening up the community discussion forums.",
      metrics: ["Target: 5,000 active readers", "Goal: 20 base articles published"],
      tools: ["Vercel", "Render", "Postgres/MySQL Prod Cluster"],
      milestones: [
        { title: "Migrate database to production", date: "Aug 2026", completed: false },
        { title: "Publish launching newsletter issue", date: "Aug 2026", completed: false },
        { title: "Host launch day Q&A on Product Hunt", date: "Sep 2026", completed: false },
      ],
    },
    {
      number: 6,
      name: "Scaling & Premium Tiers",
      icon: <Clock className="w-5 h-5" />,
      status: "planned",
      summary: "Integrating paywalls, subscriptions, and advanced features.",
      description: "Adding Stripe/Razorpay payment portals to unlock exclusive articles, introducing automated reading streak achievements, and launching community discussion boards.",
      metrics: ["Target: $5k MRR", "Target: 50+ premium toolkits"],
      tools: ["Stripe", "Redis", "Cron Scheduling"],
      milestones: [
        { title: "Integrate Stripe subscription payments", date: "Oct 2026", completed: false },
        { title: "Release first locked premium book", date: "Nov 2026", completed: false },
        { title: "Deploy referral engine rewards", date: "Dec 2026", completed: false },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl animate-in fade-in duration-700">
      <header className="mb-16 border-b border-border/50 pb-6 text-center max-w-3xl mx-auto">
        <span className="text-xs font-semibold text-accent tracking-widest uppercase block mb-3">
          Our Roadmap
        </span>
        <h1 className="font-serif text-4xl mb-3 font-light">
          Building <span className="font-normal italic text-accent">In Public</span>
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We believe in radical transparency. Track our engineering milestones, growth metrics, and tech stack choices as we build The Panda Nomad.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Timeline Navigation */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="font-serif text-2xl mb-6 font-light">Development Stages</h2>
          <div className="space-y-4 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
            {stages.map((stage) => {
              const isActive = activeStage === stage.number;
              return (
                <button
                  key={stage.number}
                  onClick={() => setActiveStage(stage.number)}
                  className="w-full text-left flex items-start gap-4 transition-all duration-300 relative group outline-none"
                >
                  {/* Timeline Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border z-10 shrink-0 transition-colors ${
                      stage.status === "completed"
                        ? "bg-accent/10 border-accent/30 text-accent group-hover:bg-accent/20"
                        : stage.status === "current"
                        ? "bg-primary border-primary text-primary-foreground animate-pulse"
                        : "bg-background border-border text-muted-foreground group-hover:border-foreground/30"
                    }`}
                  >
                    {stage.icon}
                  </div>
                  
                  {/* Content Card */}
                  <div className={`flex-1 p-4 rounded-sm transition-all duration-300 ${
                    isActive
                      ? "bg-muted/10 border border-primary/20 shadow-sm"
                      : "border border-transparent group-hover:bg-muted/5"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold text-accent tracking-wider uppercase">
                        Stage {stage.number}
                      </span>
                      {stage.status === "current" && (
                        <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-medium">{stage.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {stage.summary}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Stage Detail Cards */}
        <div className="lg:col-span-7 bg-muted/5 border border-border/60 p-8 rounded-sm animate-in fade-in slide-in-from-right-4 duration-500">
          {stages
            .filter((stage) => stage.number === activeStage)
            .map((stage) => (
              <div key={stage.number} className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-accent tracking-widest uppercase">
                      Stage {stage.number} Details
                    </span>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
                        stage.status === "completed"
                          ? "bg-accent/15 text-accent"
                          : stage.status === "current"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {stage.status}
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl font-light mb-4">{stage.name}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                {/* Key Metrics */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                    Key Metrics & Highlights
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {stage.metrics.map((metric, i) => (
                      <li
                        key={i}
                        className="text-xs border border-border/40 p-3 bg-background text-foreground/80 rounded-sm font-medium"
                      >
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestones Checklist */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                    Milestones Checklist
                  </h4>
                  <ul className="space-y-3">
                    {stage.milestones.map((milestone, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between border-b border-border/30 pb-2 text-xs"
                      >
                        <span
                          className={`font-medium ${
                            milestone.completed
                              ? "text-foreground line-through decoration-muted-foreground/45"
                              : "text-foreground"
                          }`}
                        >
                          {milestone.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground/60">{milestone.date}</span>
                          <CheckCircle
                            className={`w-4 h-4 ${
                              milestone.completed ? "text-accent fill-accent/5" : "text-muted-foreground/30"
                            }`}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tools & Tech stack */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-widest mb-3">
                    Stage Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {stage.tools.map((tool, i) => (
                      <span
                        key={i}
                        className="text-xs bg-muted border border-border px-3 py-1 text-foreground/80 font-medium rounded-sm"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
