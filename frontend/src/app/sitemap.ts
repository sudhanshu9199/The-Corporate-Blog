import { MetadataRoute } from 'next';
import axios from 'axios';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`);
  const posts = res.data;

  const postEntries = posts.map((post: any) => ({
    url: `https://the-corporate-blog-rw6q.vercel.app/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: 'https://the-corporate-blog-rw6q.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://the-corporate-blog-rw6q.vercel.app/blog',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Map over your fetched posts here...
  ]
}