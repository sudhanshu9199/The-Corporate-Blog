import { queryDb } from '../config/db';

// 🔹 Base condition to exclude deleted + only published
const BASE_CONDITION = `deleted_at IS NULL AND status = 'published'`;

// ✅ Get single post by slug
export const getPostBySlug = async (slug: string) => {
  const query = `
    SELECT id, title, content, status, seo_metadata
    FROM posts
    WHERE slug = $1 AND ${BASE_CONDITION}
    LIMIT 1
  `;

  const result = await queryDb(query, [slug]);
  return result.rows[0];
};

// ✅ Get all published posts (not deleted)
export const getPosts = async () => {
  const query = `
    SELECT id, title, slug, content, cover_image_url, published_at
    FROM posts
    WHERE ${BASE_CONDITION}
    ORDER BY published_at DESC
  `;

  const result = await queryDb(query);
  return result.rows;
};

// ✅ Soft delete a post
export const softDeletePost = async (postId: number) => {
  const query = `
    UPDATE posts
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id
  `;

  const result = await queryDb(query, [postId]);
  return result.rows[0];
};

// ✅ Restore a soft-deleted post
export const restorePost = async (postId: number) => {
  const query = `
    UPDATE posts
    SET deleted_at = NULL
    WHERE id = $1
    RETURNING id
  `;

  const result = await queryDb(query, [postId]);
  return result.rows[0];
};

// ✅ Hard delete (only if really needed)
export const permanentlyDeletePost = async (postId: number) => {
  const query = `
    DELETE FROM posts
    WHERE id = $1
  `;

  await queryDb(query, [postId]);
};