import { queryDb } from '../config/db';

export const getPostBySlug = async (slug: string) => {
  // ✅ Parameterized query: Prevents SQL Injection
  const query = `
    SELECT id, title, content, status, seo_metadata 
    FROM posts 
    WHERE slug = $1 AND status = 'published'
  `;
  const result = await queryDb(query, [slug]);
  return result.rows[0];
};