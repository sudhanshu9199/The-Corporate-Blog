import { Suspense } from "react";
import Image from "next/image";
import TrendingWidget from "@/components/TrendingWidget";
import { getPublishedPosts } from "@/lib/api";

interface Post {
  id: string;
  title: string;
  excerpt?: string;
  published_at: string;
  slug: string; 
}

function PostCard({ post }: { post: Post }) {
  return (
    <article className="group p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl transition-colors hover:border-zinc-400 dark:hover:border-zinc-600">
      <a href={`/posts/${post.slug}`} className="block space-y-2">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 group-hover:underline underline-offset-4">
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <time
          dateTime={post.published_at}
          className="block text-xs text-zinc-400 dark:text-zinc-500"
        >
          {new Date(post.published_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </a>
    </article>
  )
}

function PostCardSkeleton() {
  return (
    <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse space-y-3">
      <div className="h-5 w-3/4 rounded bg-zinc-200 dark:bg-zinc-700" />
      <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
      <div className="h-3 w-1/4 rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}

function PostsFeed({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-zinc-400 dark:text-zinc-500 text-sm">
        No posts published yet. Check back soon.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export default async function Home() {
  const posts: Post[] = await getPublishedPosts();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-5xl mx-auto px-4 py-12 sm:px-8">
        
        {/* Page Header */}
        <header className="mb-10 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            The Corporate Blog
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Insights, updates, and stories from our team.
          </p>
        </header>

        {/* Main content + Sidebar layout */}
        <div className="flex flex-col gap-10 md:flex-row md:gap-8">

          {/* Left: Posts Feed */}
          <section className="flex-1 min-w-0">
            <Suspense
              fallback={
                <div className="grid gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <PostsFeed posts={posts} />
            </Suspense>
          </section>

          {/* Right: Sidebar */}
          <aside className="w-full md:w-72 shrink-0 hidden md:block">
            <Suspense
              fallback={
                <div className="h-48 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
              }
            >
              <TrendingWidget />
            </Suspense>
          </aside>
          
        </div>
      </main>
    </div>
  );
}
