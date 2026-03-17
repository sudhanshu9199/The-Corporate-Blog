import { Request, Response } from "express";
import { query } from "../db/";
import slugify from "slugify";

export const createPost = async (req: Request, res: Response) => {
  try {
    const { title, content, author_id, seo_metadata } = req.body;

    let baseSlug = slugify(title, { lower: true, strict: true });
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await query("SELECT id FROM posts WHERE SLUG = $1", [
        uniqueSlug,
      ]);
      if (existing.rowCount === 0) {
        break;
      }
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const result = await query(
      `INSERT INTO posts (title, slug, content, author_id, seo_metadata, status) VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING *`,
      [title, uniqueSlug, content, author_id, seo_metadata],
    );

    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error while creating post" });
  }
};
