import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { useAuth } from "../context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

interface Post {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
}

interface Thread {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
  };
  posts: Post[];
}

export function CommunityThread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchThread();
  }, [id]);

  const fetchThread = async () => {
    try {
      const data = await customFetch<Thread>(`/api/community/threads/${id}`);
      setThread(data);
    } catch (err: any) {
      setError(err.message || "Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await customFetch(`/api/community/threads/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });
      setReplyContent("");
      fetchThread();
    } catch (err: any) {
      alert(err.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="py-24 text-center text-neutral-500">Loading thread...</div>
      </>
    );
  }

  if (error || !thread) {
    return (
      <>
        <div className="py-24 text-center">
          <p className="text-red-600 mb-4">{error || "Thread not found"}</p>
          <Link to="/community" className="text-blue-600 hover:underline">
            &larr; Back to Forums
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="mb-6">
          <Link to="/community" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
            &larr; Back to Forums
          </Link>
        </div>

        {/* Original Post */}
        <div className="mb-8 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 p-6 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                {thread.category}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Posted by {thread.user?.email?.split("@")[0] || "Unknown"} on{" "}
                {new Date(thread.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white md:text-3xl mb-4">
              {thread.title}
            </h1>
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{thread.content}</p>
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {thread.posts.length} {thread.posts.length === 1 ? "Reply" : "Replies"}
          </h2>
          {thread.posts.map((post) => (
            <div key={post.id} className="rounded-lg border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {post.user?.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <span className="block text-sm font-medium text-neutral-900 dark:text-white">
                    {post.user?.email?.split("@")[0] || "Unknown"}
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                    {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Leave a Reply</h3>
          {user ? (
            <form onSubmit={handlePostReply}>
              <textarea
                required
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="mb-4 block w-full rounded-md border border-neutral-300 px-3 py-2 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500 sm:text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                placeholder="Write your reply here..."
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                {submitting ? "Posting..." : "Post Reply"}
              </button>
            </form>
          ) : (
            <div>
              <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
                You must be logged in to reply to this thread.
              </p>
              <Link
                to="/login"
                className="inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus:outline-none dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Log In
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
