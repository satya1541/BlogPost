import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

interface Thread {
  id: number;
  title: string;
  category: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
}

export function Community() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New thread form state
  const [showNewThread, setShowNewThread] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const data = await customFetch<Thread[]>("/api/community/threads");
      setThreads(data);
    } catch (err: any) {
      setError(err.message || "Failed to load threads");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    setSubmitting(true);
    try {
      const data = await customFetch<{ id: number }>("/api/community/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      setShowNewThread(false);
      setTitle("");
      setContent("");
      fetchThreads();
      if (data.id) {
        navigate(`/community/${data.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to create thread");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 md:text-4xl">
              Community Forums
            </h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">
              Discuss ideas, ask questions, and connect with other founders.
            </p>
          </div>
          {user ? (
            <button
              onClick={() => setShowNewThread(!showNewThread)}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {showNewThread ? "Cancel" : "New Thread"}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Log In to Post
            </Link>
          )}
        </div>

        {/* New Thread Form */}
        {showNewThread && (
          <form
            onSubmit={handleCreateThread}
            className="mb-8 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
              Create New Thread
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="General Discussion">General Discussion</option>
                <option value="Idea Validation">Idea Validation</option>
                <option value="Milestones">Milestones</option>
                <option value="Questions & Answers">Questions & Answers</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter thread title..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Content
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your content..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewThread(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {submitting ? "Posting..." : "Create Thread"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="py-12 text-center text-neutral-500">Loading threads...</div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
              No threads yet
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              Be the first to start a conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/community/${thread.id}`}
                className="group block rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                      {thread.category}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {thread.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                    {thread.user?.email?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {thread.user?.email?.split("@")[0] || "Unknown"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
