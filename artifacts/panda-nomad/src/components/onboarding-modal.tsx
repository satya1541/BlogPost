import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Check, Plus } from "lucide-react";

const TOPICS = [
  "ideas", "startups", "technology", "ai", "business", "leadership", "books", 
  "psychology", "productivity", "society", "health", "life", "travel", "finance", 
  "design", "opinion"
];

export function OnboardingModal() {
  const { user, refreshUser, loading } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && user.displayName) {
      setName(user.displayName);
    }
  }, [user]);

  if (loading || !user || user.onboardingCompleted) {
    return null; // Do not render if not needed
  }

  const toggleInterest = (topic: string) => {
    setInterests(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      await customFetch("/api/auth/onboarding", {
        method: "PUT",
        body: JSON.stringify({ name, age, occupation, interests }),
      });
      
      await refreshUser();
      
      toast({
        title: "Welcome aboard!",
        description: "Your profile has been set up successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-background p-8 border border-border/50 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto relative">
        <div className="text-center">
          <h2 className="text-3xl font-serif tracking-tight text-foreground">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us a bit about yourself to get personalized content.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Display Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                placeholder="How should we call you?"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-foreground">
                  Age (optional)
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1 block w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                  placeholder="e.g. 28"
                />
              </div>
              
              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-foreground">
                  Occupation (optional)
                </label>
                <input
                  id="occupation"
                  name="occupation"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="mt-1 block w-full border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              What topics are you interested in?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TOPICS.map((topic) => {
                const isSelected = interests.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleInterest(topic)}
                    className={`flex items-center justify-between p-3 border transition-all rounded-sm text-left ${
                      isSelected
                        ? "border-accent bg-accent/5 text-accent font-medium shadow-sm"
                        : "border-border hover:border-accent/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="capitalize text-xs">{topic}</span>
                    {isSelected ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Plus className="w-3 h-3 opacity-50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 sticky bottom-0 bg-background pb-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-sm shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : "Complete Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
