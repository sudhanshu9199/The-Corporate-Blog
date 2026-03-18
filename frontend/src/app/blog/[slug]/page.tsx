import { notFound } from "next/navigation";
import { Metadata } from "next";
import BlockRenderer from "@/components/BlockRenderer";

export const revalidate = 900;

async function getPost(slug: string) {
  // Replace with your actual deployed backend URL later
  const res = await fetch(`http://localhost:8080/api/posts/slug/${slug}`, {
    next: { revalidate: 900 },
  });
  if (!res.ok) return null;
  return res.json();
}

// Generate static routes at build time
export async function generateStaticParams() {
  const res = await fetch("http://localhost:8080/api/posts?status=published");
  const posts = await res.json();
  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

// Dynamic SEO Metadata
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} | The Corporate Blog`,
    description: post.seo_metadata?.description || "Read more on our blog.",
    alternates: {
      canonical: `/blog/${post.slug}`, // Canonical tag
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPost(params.slug);

  // Implement 404 for unpublished/missing posts
  if (!post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-8">By {post.author_name}</p>

      {/* Safe JSON rendering */}
      <BlockRenderer content={post.content} />
    </article>
  );
}




type Props = {
  params: Promise<{ slug: string }>;
};