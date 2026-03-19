// category/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 900; // 🕒 ISR: Rebuilds page every 15 mins in background

async function getCategoryPosts(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/categories/${slug}/posts`,
    {
      next: { revalidate: 900 },
    },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  return {
    title: `${params.slug.toUpperCase()} Posts | The Corporate Blog`,
    description: `Read the latest published articles in the ${params.slug} category.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const response = await getCategoryPosts(params.slug);
  const posts = response?.data;

  if (!posts || posts.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-black dark:text-white capitalize">
        {params.slug.replace("-", " ")} Posts
      </h1>
      <div className="grid gap-6">
        {posts.map((post: any) => (
          <a
            href={`/blog/${post.slug}`}
            key={post.id}
            className="block p-6 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2 text-black dark:text-white">
              {post.title}
            </h2>
            <p className="text-gray-500 text-sm">
              By {post.author_name} •{" "}
              {new Date(
                post.published_at || post.created_at,
              ).toLocaleDateString()}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
