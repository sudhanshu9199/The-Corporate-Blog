import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import BlockRenderer from "@/components/BlockRenderer";
import Script from "next/script";
import RelatedPosts from "@/components/RelatedPosts";

export const revalidate = 900;

const BASE_URL = "https://the-corporate-blog-rw6q.vercel.app";
const API_URL  = "http://localhost:8080/api";

async function getPost(slug: string) {

  const res = await fetch(`${API_URL}/posts/slug/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/posts?status=published`);
    if (!res.ok) return [];
    const posts = await res.json();
    return posts.map((post: { slug: string }) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const title       = post.seo_metadata?.seo_title       || post.title;
  const description = post.seo_metadata?.seo_description || "Expert industry insights.";
  const canonical   = post.seo_metadata?.canonical_url   || `${BASE_URL}/blog/${post.slug}`;
  const ogImage     = post.cover_image_url               || "/default-og.png";

  return {
    title: `${title} | The Corporate Blog`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${BASE_URL}/blog/${post.slug}`,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.cover_image_url,
    author: { "@type": "Person", "name": post.author_name },
    datePublished: post.published_at || post.created_at,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${BASE_URL}/blog/${post.slug}` }
    ]
  };

  return (
    <>
      <Script
        id="json-ld-article"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="json-ld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <article className="max-w-3xl mx-auto py-12 px-4">
        {post.cover_image_url && (
          <div className="mb-8 w-full overflow-hidden rounded-lg">
            <Image
              src={post.cover_image_url}
              alt={post.seo_metadata?.alt_text || post.title}
              width={800}
              height={450}
              sizes="(max-width: 768px) 100vw, 800px"
              priority               // ← hero image: don't lazy-load
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-500 mb-8">By {post.author_name}</p>

        <BlockRenderer content={post.content} />

        <RelatedPosts postId={post.id} />
      </article>
    </>
  );
}