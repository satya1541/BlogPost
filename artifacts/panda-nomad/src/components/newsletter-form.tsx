import React, { useState } from 'react';
import { useSubscribeNewsletter, customFetch } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const subscribe = useSubscribeNewsletter();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    subscribe.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          toast({
            title: "Subscribed successfully",
            description: "Welcome to The Panda Nomad Weekly.",
          });
          
          // Send newsletter_convert analytics event
          const pathname = window.location.pathname;
          const slugMatch = pathname.match(/^\/articles\/([^/]+)/);
          const slug = slugMatch ? slugMatch[1] : "global";
          
          customFetch("/api/analytics/track", {
            method: "POST",
            body: JSON.stringify({
              eventType: "newsletter_convert",
              slug,
              metadata: { email: email.toLowerCase().trim() }
            })
          }).catch(() => {});
          
          setEmail('');
        },
        onError: () => {
          toast({
            title: "Subscription failed",
            description: "Please try again later or check your email format.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
      <input
        type="email"
        placeholder="Enter your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 bg-transparent border-b border-foreground/20 px-0 py-3 outline-none focus:border-accent transition-colors text-foreground placeholder:text-muted-foreground"
        required
        disabled={subscribe.isPending}
      />
      <button
        type="submit"
        disabled={subscribe.isPending}
        className="flex items-center gap-2 justify-center px-6 py-3 bg-primary text-primary-foreground font-medium text-sm hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
      >
        {subscribe.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
        {!subscribe.isPending && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  );
}
