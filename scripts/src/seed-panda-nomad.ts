import { db, articlesTable, seriesTable } from "@workspace/db";

const series = [
  {
    slug: "founder-journal",
    name: "Founder Journal",
    description:
      "Unfiltered dispatches from the founder's chair -- the decisions, doubts, and small wins that never make it into a pitch deck.",
    coverImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
  },
  {
    slug: "idea-vault",
    name: "Idea Vault",
    description:
      "A running archive of half-formed ideas worth thinking about -- some will become companies, most will just make you a sharper thinker.",
    coverImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80",
  },
  {
    slug: "building-in-public",
    name: "Building in Public",
    description:
      "A real-time record of building something from zero -- the metrics, the missteps, and the reasoning behind every pivot.",
    coverImage:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
  },
];

const articles = [
  {
    slug: "the-quiet-discipline-of-shipping",
    title: "The Quiet Discipline of Shipping",
    excerpt:
      "Most founders don't fail from a lack of ideas. They fail from a lack of finishing. Notes on the unglamorous habit that actually compounds.",
    category: "Entrepreneurship",
    tags: ["founders", "discipline", "shipping"],
    author: "Subham Panda",
    authorTitle: "Founder, The Panda Nomad",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&q=80",
    publishedDate: "2026-06-02T09:00:00Z",
    readingTimeMinutes: 7,
    featured: true,
    series: "Founder Journal",
    views: 4210,
    content: `
      <p>Every founder I admire has one thing in common, and it is not vision. It is the willingness to ship something imperfect on a Tuesday instead of a perfect version that never arrives.</p>
      <h2>The myth of the big unveiling</h2>
      <p>We are trained by movies and product launches to believe that great work arrives all at once, polished and complete. In reality, almost nothing worth building happened that way. The products you admire shipped ugly first drafts, then iterated in public, absorbing feedback like a sponge.</p>
      <blockquote>Ideas are cheap. Execution compounds. The gap between the two is where most companies quietly die.</blockquote>
      <h2>A simple test</h2>
      <p>Ask yourself: what did I ship this week that a stranger could actually use? Not a deck. Not a plan. Something real, in someone else's hands.</p>
      <p>If the answer is nothing, the problem usually isn't ambition. It's that ambition without a shipping cadence is just anxiety with better branding.</p>
      <h2>Building the muscle</h2>
      <p>Start absurdly small. A one-paragraph newsletter. A single working feature. A landing page with a waitlist. The goal isn't scale, it's proof that you can close the loop between idea and reality, repeatedly, without waiting for permission.</p>
      <p>Do that enough times and shipping stops being an event. It becomes a rhythm. That rhythm, more than any framework, is what separates founders who build things from founders who talk about building things.</p>
    `,
  },
  {
    slug: "why-your-best-ideas-arrive-sideways",
    title: "Why Your Best Ideas Arrive Sideways",
    excerpt:
      "Breakthroughs rarely show up when you're staring directly at the problem. A short exploration of lateral thinking and where good ideas actually come from.",
    category: "Ideas",
    tags: ["creativity", "thinking", "psychology"],
    author: "Subham Panda",
    authorTitle: "Founder, The Panda Nomad",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80",
    publishedDate: "2026-06-09T09:00:00Z",
    readingTimeMinutes: 6,
    featured: false,
    series: "Idea Vault",
    views: 2870,
    content: `
      <p>The shower, the long walk, the half-asleep moment before an alarm goes off -- these are not distractions from thinking. They are thinking, in a different register.</p>
      <h2>Diffuse mode versus focused mode</h2>
      <p>Neuroscientists describe two modes of attention: focused, where you bear down on a specific problem, and diffuse, where your mind wanders and makes distant, unlikely connections. Most of us only train the first.</p>
      <p>The breakthrough insight almost never happens during the eighth hour of staring at a whiteboard. It happens on the walk afterward, when the pressure lifts and the brain is free to associate.</p>
      <h2>How to invite sideways thinking</h2>
      <ul>
        <li>Load the problem deliberately, then walk away from it completely.</li>
        <li>Read something unrelated to your field -- history, biology, poetry.</li>
        <li>Keep a low-friction capture tool for the idea that arrives at an inconvenient time.</li>
      </ul>
      <p>Treat idle time as part of the process, not a break from it. The best ideas are rarely summoned. They're received, if you leave room for them to arrive.</p>
    `,
  },
  {
    slug: "the-ai-files-what-changed-this-quarter",
    title: "The AI Files: What Actually Changed This Quarter",
    excerpt:
      "A grounded look past the hype cycle -- which AI capabilities genuinely moved forward, and which announcements were just noise.",
    category: "Artificial Intelligence",
    tags: ["ai", "technology", "research"],
    author: "Meera Krishnan",
    authorTitle: "Contributing Writer, Technology",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80",
    publishedDate: "2026-06-16T09:00:00Z",
    readingTimeMinutes: 9,
    featured: true,
    series: null,
    views: 5630,
    content: `
      <p>It is easy to lose the signal in a field that produces a headline every single day. Here is what genuinely moved the needle this quarter, stripped of the marketing language.</p>
      <h2>Reasoning got cheaper, not just smarter</h2>
      <p>The more consequential shift wasn't a single model release -- it was the collapse in cost per unit of reasoning. Capabilities that required frontier-scale compute a year ago are now viable at a fraction of the price, which changes who can build with them, not just what's possible.</p>
      <h2>Tool use stopped being a demo</h2>
      <p>Agentic workflows moved from conference-stage demos to genuinely reliable production behavior for narrow, well-scoped tasks. The unlock wasn't a smarter model -- it was better guardrails, retries, and evaluation harnesses around the model.</p>
      <blockquote>The interesting engineering problem in AI right now isn't the model. It's everything you build around it.</blockquote>
      <h2>What to actually pay attention to</h2>
      <p>Ignore benchmark leaderboards. Watch for teams shipping narrow, reliable products that quietly replace a manual workflow. That is where the real progress compounds -- not in the next flashy announcement, but in the boring, dependable automation nobody talks about.</p>
    `,
  },
  {
    slug: "a-letter-to-my-past-self-before-the-first-hire",
    title: "A Letter to My Past Self, Before the First Hire",
    excerpt:
      "What I wish someone had told me before I brought another person into a company that, until then, only existed in my head.",
    category: "Leadership",
    tags: ["hiring", "leadership", "founders"],
    author: "Subham Panda",
    authorTitle: "Founder, The Panda Nomad",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80",
    publishedDate: "2026-06-23T09:00:00Z",
    readingTimeMinutes: 5,
    featured: false,
    series: "Founder Journal",
    views: 1980,
    content: `
      <p>Dear past self -- the person you are about to hire is not joining your idea. They are joining your ability to communicate that idea clearly, under pressure, on a bad day.</p>
      <h2>Clarity is a form of kindness</h2>
      <p>You will be tempted to keep things vague, because vague feels safer when you're not sure yourself. Resist it. A confused first hire will build confused things, and untangling that costs far more than the discomfort of being specific up front.</p>
      <h2>Culture is set on day one, not year one</h2>
      <p>Whatever you tolerate in the first thirty days becomes the standard. Whatever you praise becomes the incentive. You are not just hiring a person, you are writing the first paragraph of your culture document in real time, whether you mean to or not.</p>
      <p>Take the hire seriously. It is the first time your company becomes larger than your own head, and it will never be that small again.</p>
    `,
  },
  {
    slug: "book-notes-antifragile",
    title: "Book Notes: Antifragile, and Why Stability Can Be a Trap",
    excerpt:
      "Nassim Taleb's core idea distilled -- some systems don't just survive disorder, they need it. Notes for founders building through uncertainty.",
    category: "Books",
    tags: ["books", "philosophy", "risk"],
    author: "Aarav Mehta",
    authorTitle: "Contributing Writer, Books & Ideas",
    authorAvatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1600&q=80",
    publishedDate: "2026-06-30T09:00:00Z",
    readingTimeMinutes: 8,
    featured: false,
    series: "Idea Vault",
    views: 2340,
    content: `
      <p>Taleb's central claim is deceptively simple: some things break under stress, some things merely survive it, and a rare few actually get stronger because of it. He calls the last category antifragile.</p>
      <h2>Three states of a system</h2>
      <p>Fragile systems degrade under volatility. Robust systems are indifferent to it. Antifragile systems improve because of it -- much like a muscle that grows stronger from the controlled stress of resistance training.</p>
      <blockquote>Wind extinguishes a candle and energizes a fire.</blockquote>
      <h2>Applying it to early-stage companies</h2>
      <p>A startup optimized purely for stability -- long roadmaps, rigid processes, minimal experimentation -- is quietly fragile. It looks orderly right up until the moment reality disagrees with the plan, and then it breaks all at once.</p>
      <p>An antifragile company treats small, contained failures as information. It runs many cheap experiments so that when a big shock arrives, it has already adapted in a hundred small ways nobody noticed.</p>
      <h2>The practical takeaway</h2>
      <p>Don't just build a plan that survives uncertainty. Build one that gets better because of it -- optionality over prediction, small bets over grand strategy.</p>
    `,
  },
  {
    slug: "the-productivity-system-that-finally-stuck",
    title: "The Productivity System That Finally Stuck",
    excerpt:
      "After a decade of app-hopping, here's the unremarkable system that actually survived contact with a busy, unpredictable week.",
    category: "Productivity",
    tags: ["productivity", "habits", "systems"],
    author: "Priya Nair",
    authorTitle: "Contributing Writer, Productivity",
    authorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=1600&q=80",
    publishedDate: "2026-07-04T09:00:00Z",
    readingTimeMinutes: 6,
    featured: false,
    series: null,
    views: 3120,
    content: `
      <p>I have used every productivity app that has ever trended on the internet. What finally worked had nothing to do with software.</p>
      <h2>One list, reviewed twice a day</h2>
      <p>Every task lives in exactly one place. I review it once in the morning to choose three priorities, and once at night to close the loop. No categories, no elaborate tagging, no second-guessing which app owns which task.</p>
      <h2>The three-task rule</h2>
      <p>Only three things count as "the plan" for any given day. Everything else is a bonus. This sounds absurdly small until you notice how rarely you actually complete even three meaningful things in a day that felt busy.</p>
      <h2>Why simplicity survives</h2>
      <p>Complex systems fail during your busiest, most stressful weeks -- exactly when you need a system the most. A system you can run from memory, with no setup cost, is the only kind that survives contact with real life.</p>
    `,
  },
  {
    slug: "building-in-public-week-one-the-empty-repository",
    title: "Building in Public, Week One: The Empty Repository",
    excerpt:
      "Starting a new company from a completely blank slate -- no name, no code, no customers. Here's the plan, and the honest odds.",
    category: "Entrepreneurship",
    tags: ["startups", "build-in-public", "founders"],
    author: "Subham Panda",
    authorTitle: "Founder, The Panda Nomad",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&q=80",
    publishedDate: "2026-07-07T09:00:00Z",
    readingTimeMinutes: 5,
    featured: false,
    series: "Building in Public",
    views: 1540,
    content: `
      <p>No name yet. No code yet. Just a recurring itch and a Sunday afternoon with nothing else on the calendar.</p>
      <h2>The itch</h2>
      <p>Every founder journey I trust starts with a specific, personal frustration rather than a market opportunity slide. Mine: the tools I use for tracking long-term reading and thinking are either too simple to be useful or too complex to actually open every day.</p>
      <h2>The plan for week one</h2>
      <ul>
        <li>Talk to ten people who read seriously and ask what they currently use.</li>
        <li>Sketch the smallest possible version that solves my own daily frustration.</li>
        <li>Ship something ugly by Friday, even if it only works for me.</li>
      </ul>
      <p>I will report back honestly, including the parts where this doesn't work. That is the entire point of building in public -- the record has to include the stumbles, or it isn't a record of anything real.</p>
    `,
  },
  {
    slug: "the-economics-of-attention-in-a-crowded-market",
    title: "The Economics of Attention in a Crowded Market",
    excerpt:
      "Every category is crowded now. A practical framework for earning attention honestly, without resorting to noise.",
    category: "Business",
    tags: ["marketing", "business", "strategy"],
    author: "Meera Krishnan",
    authorTitle: "Contributing Writer, Technology",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&q=80",
    publishedDate: "2026-07-09T09:00:00Z",
    readingTimeMinutes: 7,
    featured: false,
    series: null,
    views: 2210,
    content: `
      <p>Attention is the actual scarce resource in almost every market today -- not capital, not talent, not even good ideas. Here is how to think about earning it honestly.</p>
      <h2>Rented attention versus owned attention</h2>
      <p>Rented attention -- ads, algorithm-fed feeds, borrowed audiences -- disappears the moment you stop paying for it. Owned attention -- an email list, a direct relationship, a reputation built over years -- compounds and survives platform changes entirely outside your control.</p>
      <blockquote>Build the kind of attention that doesn't evaporate when a platform changes its algorithm.</blockquote>
      <h2>A simple test for any growth tactic</h2>
      <p>Ask: does this tactic leave me with a durable asset, or does it just rent visibility for a moment? Newsletters, communities, and genuinely useful content pass this test. Most paid growth hacks do not.</p>
      <p>Play the long game. In a crowded market, consistency reads as credibility, and credibility is the only moat that compounds without a budget behind it.</p>
    `,
  },
  {
    slug: "on-solitude-and-the-nomadic-life",
    title: "On Solitude and the Nomadic Life",
    excerpt:
      "A reflection on choosing distance -- from a fixed desk, a fixed city, a fixed idea of what a working life should look like.",
    category: "Life",
    tags: ["travel", "life", "solitude"],
    author: "Subham Panda",
    authorTitle: "Founder, The Panda Nomad",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1600&q=80",
    publishedDate: "2026-07-10T09:00:00Z",
    readingTimeMinutes: 6,
    featured: false,
    series: null,
    views: 2790,
    content: `
      <p>There is a particular kind of clarity that only shows up when you are far from your usual desk, your usual habits, your usual sense of who you are supposed to be.</p>
      <h2>Distance as a thinking tool</h2>
      <p>Moving through unfamiliar places strips away the automatic scripts we run at home. You notice what you actually value, stripped of the routines that usually do your thinking for you.</p>
      <p>This isn't a case for permanent rootlessness. It's a case for deliberately choosing distance often enough to keep your assumptions honest.</p>
      <h2>What travel actually teaches</h2>
      <p>Not the postcard version -- the quieter lesson that almost everything you assumed was universal is, in fact, local. Once you see that clearly, you start questioning which of your own beliefs are truth and which are just habit wearing a costume.</p>
    `,
  },
  {
    slug: "the-psychology-of-almost-quitting",
    title: "The Psychology of Almost Quitting",
    excerpt:
      "The specific mental state right before most founders give up -- and the difference between quitting wisely and quitting from exhaustion.",
    category: "Psychology",
    tags: ["psychology", "resilience", "founders"],
    author: "Aarav Mehta",
    authorTitle: "Contributing Writer, Books & Ideas",
    authorAvatar:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1600&q=80",
    publishedDate: "2026-07-11T09:00:00Z",
    readingTimeMinutes: 7,
    featured: false,
    series: "Founder Journal",
    views: 3480,
    content: `
      <p>Almost every founder who eventually succeeds can point to a specific week where they nearly stopped. Understanding that moment is more useful than pretending it doesn't exist.</p>
      <h2>Exhaustion masquerading as clarity</h2>
      <p>When you are depleted, your brain produces a very convincing feeling of certainty -- "this isn't working" -- that is actually just fatigue wearing the costume of insight. The two feel identical from the inside.</p>
      <blockquote>Never make a permanent decision from a temporary state.</blockquote>
      <h2>A better test</h2>
      <p>Before quitting anything important, remove the immediate exhaustion from the equation. Sleep, rest, take the pressure off for a week, and then ask the question again. If the answer is the same when you're rested, it was a real signal. If it changes, you were listening to tiredness, not truth.</p>
      <p>Quitting wisely and quitting from exhaustion can look identical from the outside. Only you can tell the difference, and usually only after you've actually rested.</p>
    `,
  },
  {
    slug: "a-founders-guide-to-saying-no",
    title: "A Founder's Guide to Saying No",
    excerpt:
      "Every yes has a cost you don't see until later. A short framework for protecting the few things that actually matter.",
    category: "Leadership",
    tags: ["leadership", "focus", "founders"],
    author: "Priya Nair",
    authorTitle: "Contributing Writer, Productivity",
    authorAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1600&q=80",
    publishedDate: "2026-07-12T09:00:00Z",
    readingTimeMinutes: 5,
    featured: false,
    series: null,
    views: 1650,
    content: `
      <p>Every opportunity you accept quietly displaces something else -- usually something you can't see the cost of until months later.</p>
      <h2>The hidden ledger</h2>
      <p>Time is the one resource you cannot raise more of. Every meeting, every side project, every "quick favor" is drawn from the exact same finite account as your most important work.</p>
      <h2>A simple filter</h2>
      <p>Before saying yes, ask: does this directly serve the one or two things I've decided matter most this quarter? If not, a polite no protects more than your calendar -- it protects your focus, which is the only genuinely scarce resource a founder has.</p>
      <p>Saying no is not a rejection of the person asking. It is a statement about what you have already decided matters more.</p>
    `,
  },
  {
    slug: "lessons-learned-from-a-failed-launch",
    title: "Lessons Learned From a Launch That Fell Flat",
    excerpt:
      "A candid post-mortem on a product launch that generated exactly nine signups -- and the uncomfortable truths it revealed.",
    category: "Entrepreneurship",
    tags: ["startups", "failure", "lessons"],
    author: "Subham Panda",
    authorTitle: "Founder, The Panda Nomad",
    authorAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1600&q=80",
    publishedDate: "2026-07-13T08:00:00Z",
    readingTimeMinutes: 8,
    featured: false,
    series: "Building in Public",
    views: 980,
    content: `
      <p>Nine signups. That was the entire result of six weeks of building and a launch day I had genuinely looked forward to. Here is what it actually revealed.</p>
      <h2>The plan looked reasonable on paper</h2>
      <p>A landing page, a waitlist, a modest but real social following, a launch post timed for a weekday morning. By every checklist I had read, this should have worked reasonably well.</p>
      <h2>What actually went wrong</h2>
      <p>I had validated the idea with people who liked me, not people who had the problem. Encouragement is not demand. Nine signups wasn't a marketing failure -- it was the market telling me, politely, that the problem wasn't as urgent as I'd convinced myself it was.</p>
      <blockquote>A quiet launch is not always a marketing problem. Sometimes it's an honest signal.</blockquote>
      <h2>What happens next</h2>
      <p>Not abandoning the idea, but re-testing the actual premise with strangers who have no reason to be kind to me. That is uncomfortable, and it is exactly the discomfort building in public is supposed to include.</p>
    `,
  },
];

async function main() {
  console.log("Seeding series...");
  for (const s of series) {
    await db.insert(seriesTable).ignore().values(s);
  }

  console.log("Seeding articles...");
  for (const a of articles) {
    await db
      .insert(articlesTable)
      .ignore()
      .values({
        ...a,
        publishedDate: new Date(a.publishedDate),
      });
  }

  console.log(`Seeded ${series.length} series and ${articles.length} articles.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
