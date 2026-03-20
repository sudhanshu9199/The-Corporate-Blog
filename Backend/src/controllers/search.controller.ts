import { Request, Response } from "express";
import { queryDb } from "../config/db";

// 🔍 Search Posts (Full Text Search)
export const searchPosts = async (req: Request, res: Response): Promise<any> => {
    const startTime = Date.now();
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: "Search query 'q' is required" });
        }

        // Using plainto_tsquery for natural language search against our GIN index
        const query = `
            SELECT p.id, p.title, p.slug, p.cover_image_url, p.published_at, u.name as author_name
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.status = 'published' AND p.search_vector @@ plainto_tsquery('english', $1)
            ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', $1)) DESC
            LIMIT 10;
        `;
        
        const result = await queryDb(query, [q]);
        
        // DO: Monitor Search Query Performance
        console.log(`[LOG - DO]: Search query '${q}' executed in ${Date.now() - startTime}ms`);

        res.json({ data: result.rows, query: q });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: "Server error during search" });
    }
};

// 🔗 Get Related Posts by shared categories
export const getRelatedPosts = async (req: Request, res: Response): Promise<any> => {
    try {
        const { postId } = req.params;

        const query = `
            SELECT DISTINCT p.id, p.title, p.slug, p.cover_image_url, p.published_at
            FROM posts p
            JOIN post_categories pc1 ON p.id = pc1.post_id
            JOIN post_categories pc2 ON pc1.category_id = pc2.category_id
            WHERE pc2.post_id = $1 
              AND p.id != $1 
              AND p.status = 'published'
            LIMIT 3;
        `;
        
        // DO: Cache popular posts (Redis Ready - You can wrap this in a Redis get/set logic later)
        const result = await queryDb(query, [postId]);
        res.json({ data: result.rows });
    } catch (error) {
        console.error("Related posts error:", error);
        res.status(500).json({ error: "Server error fetching related posts" });
    }
};