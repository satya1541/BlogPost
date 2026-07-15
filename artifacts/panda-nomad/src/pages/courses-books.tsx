import { useState } from "react";
import { BookOpen, Award, CheckCircle, Clock, Book } from "lucide-react";

interface Course {
  id: number;
  title: string;
  duration: string;
  lessons: number;
  description: string;
  instructor: string;
}

interface BookNote {
  id: number;
  title: string;
  author: string;
  rating: string;
  summary: string;
}

const COURSES: Course[] = [
  {
    id: 1,
    title: "Fullstack Architecture with Drizzle & Express",
    duration: "6.5 hours",
    lessons: 18,
    description: "Learn to design production-grade relational schemas, handle multi-tenant routing architectures, implement session security, and deploy database migrations.",
    instructor: "Alex Rivera",
  },
  {
    id: 2,
    title: "SaaS Growth Loops: From Zero to $10K MRR",
    duration: "4 hours",
    lessons: 12,
    description: "A tactical product course focusing on building dynamic virality loops, designing optimal user conversion checkouts, optimizing churn, and scaling SEO channels.",
    instructor: "Sophia Zhang",
  }
];

const BOOKS: BookNote[] = [
  {
    id: 1,
    title: "Zero to One",
    author: "Peter Thiel",
    rating: "4.8/5",
    summary: "Thiel unpacks how to build companies that create new things (going from 0 to 1) rather than copy existing models. A masterclass in technology strategy, building monopolies, and vertical progress.",
  },
  {
    id: 2,
    title: "The Almanack of Naval Ravikant",
    author: "Eric Jorgenson",
    rating: "4.9/5",
    summary: "A synthesis of Naval's wisdom on wealth creation, happiness, and leverage. Highlights the importance of productizing yourself, building specific knowledge, and long-term compound interest.",
  }
];

export default function CoursesBooks() {
  const [activeTab, setActiveTab] = useState<"courses" | "books">("courses");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-xs font-semibold uppercase tracking-widest mb-4">
          <BookOpen className="w-3.5 h-3.5" /> Academy
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
          The Nomad <span className="italic text-accent">Knowledge Base</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Level up your execution. Browse expert-led video courses or read curated notes summarizing the best startup, philosophy, and productivity literature.
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex justify-center border-b border-border/60 mb-12 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab("courses")}
          className={`pb-4 px-8 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "courses"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="w-4 h-4" /> Video Courses
        </button>
        <button
          onClick={() => setActiveTab("books")}
          className={`pb-4 px-8 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "books"
              ? "border-accent text-accent font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Book className="w-4 h-4" /> Book Notes
        </button>
      </div>

      {/* Course Listing */}
      {activeTab === "courses" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {COURSES.map((course) => (
            <div
              key={course.id}
              className="border border-border/60 p-6 bg-background rounded-sm flex flex-col justify-between hover:border-accent/40 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {course.duration}
                  </span>
                  <span>•</span>
                  <span>{course.lessons} Lessons</span>
                </div>
                <h3 className="font-serif text-xl font-semibold">{course.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{course.description}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Instructor: {course.instructor}</span>
                <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold cursor-pointer hover:underline">
                  Enroll Course →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book Notes Listing */}
      {activeTab === "books" && (
        <div className="grid grid-cols-1 gap-6">
          {BOOKS.map((book) => (
            <div
              key={book.id}
              className="border border-border/60 p-6 bg-background rounded-sm flex flex-col md:flex-row gap-6 hover:border-accent/45 transition-colors"
            >
              <div className="w-16 h-24 bg-accent/10 border border-accent/20 flex flex-col items-center justify-center text-accent rounded-sm shrink-0 shadow-sm">
                <Book className="w-8 h-8 opacity-75" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-lg font-semibold">{book.title}</h3>
                  <span className="text-xs font-semibold text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded-full font-mono">
                    Rating: {book.rating}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">By: {book.author}</p>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">{book.summary}</p>
                <span className="inline-flex items-center gap-1 text-xs text-accent font-semibold cursor-pointer hover:underline pt-2">
                  Read Full Notes →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
