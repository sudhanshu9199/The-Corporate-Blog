import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import BlockRenderer from "@/components/BlockRenderer";
import Script from "next/script";

export const revalidate = 900;

async function getPost(slug: string) {

  const res = await fetch(`http://localhost:8080/api/posts/slug/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function generateStaticParams() {
  const res = await fetch("http://localhost:8080/api/posts?status=published");
  const posts = await res.json();
  return posts.map((post: any) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug); // Using your existing fetch logic
  if (!post) return {};

  const title = post.seo_metadata?.seo_title || post.title;
  const description = post.seo_metadata?.seo_description || "Expert industry insights.";

  return {
    title: `${title} | The Corporate Blog`,
    description: description,
    alternates: {
      canonical: post.seo_metadata?.canonical_url || `https://the-corporate-blog-rw6q.vercel.app/blog/${post.slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://the-corporate-blog-rw6q.vercel.app/blog/${post.slug}`,
      images: [post.cover_image_url || "/default-og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://the-corporate-blog-rw6q.vercel.app/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://the-corporate-blog-rw6q.vercel.app/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://the-corporate-blog-rw6q.vercel.app/blog/${post.slug}` }
    ]
  };

  return (
    <article className="max-w-3xl mx-auto py-12 px-4">
      {post.cover_image_url && (
        <div className="mb-8 w-full overflow-hidden rounded-lg">
          <Image 
            src={post.cover_image_url} 
            alt={post.seo_metadata?.alt_text || post.title} 
            width={800} 
            height={450} 
            sizes="(max-width: 768px) 100vw, 800px"
            loading="lazy"
            className="w-full h-auto object-cover" // Tailwind classes for better look
          />
        </div>
      )}

      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-8">By {post.author_name}</p>

      <BlockRenderer content={post.content} />
    </article>
  );
}


type Props = {
  params: Promise<{ slug: string }>;
};