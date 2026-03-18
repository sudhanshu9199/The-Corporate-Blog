import { Request, Response } from "express";
import { pool } from "../config/db";
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