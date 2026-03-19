import { Request, Response } from "express";
import { pool, queryDb } from "../config/db";
import slugify from "slugify";

const generateSlug = (title: string) =>
  slugify(title, { lower: true, strict: true }) + "-" + Date.now();
// POST /posts (Create Draft)
export const createPost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, content, author_id, seo_metadata } = req.body;
    const slug = generateSlug(title);
    const status = "draft"; // Default status is always draft

    // Validation for structured blocks (basic check)
    if (!content || typeof content !== "object") {
      return res
        .status(400)
        .json({ error: "Content must be a valid JSON object/block" });
    }

    const newPost = await pool.query(
      `INSERT INTO posts (author_id, title, slug, content, status, seo_metadata) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [author_id, title, slug, content, status, seo_metadata],
    );

    console.log(
      `[LOG - DO]: Draft created -> ID: ${newPost.rows[0].id}, Slug: ${slug}`,
    );

    res
      .status(201)
      .json({ message: "Draft created successfully", post: newPost.rows[0] });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

// PUT /posts/:id (Update Draft / Publish)
export const updatePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { title, content, status, seo_metadata } = req.body;

    let updateQuery = `UPDATE posts SET content = $1, status = $2, seo_metadata = $3, updated_at = CURRENT_TIMESTAMP`;
    let values = [content, status || "draft", seo_metadata];
    let paramIndex = 4;

    if (title) {
      const slug = generateSlug(title);
      updateQuery += `, title = $${paramIndex}, slug = $${paramIndex + 1}`;
      values.push(title, slug);
      paramIndex += 2;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const updatedPost = await pool.query(updateQuery, values);

    console.log(
      `[LOG - DO]: Post ${id} updated -> Status: ${status || "draft"}`,
    );
    res
      .status(200)
      .json({ message: "Post updated", post: updatedPost.rows[0] });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

export const getPostBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        // Enforce status = PUBLISHED filter globally
        const query = `
            SELECT p.*, u.name as author_name 
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.slug = $1 AND p.status = 'published'
        `;
        const result = await queryDb(query, [slug]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found or unpublished' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getPostsByCategory = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const query = `
            SELECT p.id, p.title, p.slug, p.cover_image_url, p.published_at, u.name as author_name
            FROM posts p
            JOIN users u ON p.author_id = u.id
            JOIN post_categories pc ON p.id = pc.post_id
            JOIN categories c ON pc.category_id = c.id
            WHERE c.slug = $1 AND p.status = 'published' AND p.published_at IS NOT NULL
            ORDER BY p.published_at DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await queryDb(query, [slug, limit, offset]);
        res.json({ data: result.rows, page, limit });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getPostsByAuthor = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params; // Assuming ID is passed as slug for the author
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        const query = `
            SELECT p.id, p.title, p.slug, p.cover_image_url, p.published_at, u.name as author_name
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE u.id = $1 AND p.status = 'published' AND p.published_at IS NOT NULL
            ORDER BY p.published_at DESC
            LIMIT $2 OFFSET ${(page - 1) * limit}
        `;
        
        const result = await queryDb(query, [slug, limit]);
        res.json({ data: result.rows });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};