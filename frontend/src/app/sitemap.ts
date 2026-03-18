import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Yahan apna backend API call karke SIRF published posts lani hain
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts?status=published`);
  const { posts } = await res.json();

  const blogUrls = posts.map((post: any) => ({
    url: `https://the-corporate-blog.vercel.app/blog/${post.slug}`,
    lastModified: post.updated_at,
  }));

  return [
    {
      url: 'https://the-corporate-blog.vercel.app',
      lastModified: new Date(),
    },
    ...blogUrls,
  ];
}