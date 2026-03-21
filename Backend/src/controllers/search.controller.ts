import { Request, Response } from "express";
import { queryDb } from "../config/db";

const SEARCH_LIMIT = 10;

// 🔍 Search Posts (Full Text Search)
export const searchPosts = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const startTime = Date.now();
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      return res.status(400).json({ error: "Search query 'q' is required" });
    }

    const term = q.trim();
    const startTime = Date.now();

    try {
      const query = `
      SELECT
        p.id,
        p.title,
        p.slug,
        p.cover_image_url,
        p.published_at,
        u.name AS author_name
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
        AND p.search_vector @@ plainto_tsquery('english', $1)
      ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', $1)) DESC
      LIMIT $2;
    `;

      const result = await queryDb(query, [term, SEARCH_LIMIT]);

      console.log(
        `[Search] q="${term}" | hits=${result.rows.length} | ${Date.now() - startTime}ms`,
      );

      res.json({ success: true, query: term, data: result.rows });
    } catch (err) {
      console.error("[Search] Error:", err);
      res
        .status(500)
        .json({ success: false, error: "Server error during search" });
    }
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Server error during search" });
  }
};

// 🔗 Get Related Posts by shared categories
export const getRelatedPosts = async (
  req: Request,
  res: Response,
): Promise<any> => {
  try {
    const { postId } = req.params;

    const query = `
            WITH TargetPostCategories AS (
                SELECT category_id FROM post_categories WHERE post_id = $1
            )
            SELECT DISTINCT p.id, p.title, p.slug, p.cover_image_url, p.published_at,
                   COUNT(pc.category_id) OVER(PARTITION BY p.id) as shared_categories_count
            FROM posts p
            JOIN post_categories pc ON p.id = pc.post_id
            WHERE pc.category_id IN (SELECT category_id FROM TargetPostCategories)
            AND p.id != $1
            AND p.status = 'published'
            ORDER BY shared_categories_count DESC, p.published_at DESC
            LIMIT 3;
        `;
    const result = await queryDb(query, [postId]);

    // Cache headers add kar rahe hain (Redis Phase 2 ke liye base)
    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, stale-while-revalidate=86400",
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("Error fetching related posts:", error);
    res.status(500).json({ error: "Server Error during internal suggestions" });
  }
};
