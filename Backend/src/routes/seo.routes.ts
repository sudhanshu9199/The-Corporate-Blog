// Backend/src/routes/seo.routes.ts
import { Router } from "express";
import { pool } from "../config/db";

const router = Router();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const result = await pool.query(`SELECT slug, updated_at FROM posts WHERE status = 'published'`);
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    result.rows.forEach((post) => {
      sitemap += `\n  <url>\n    <loc>https://the-corporate-blog-rw6q.vercel.app/blog/${post.slug}</loc>\n    <lastmod>${new Date(post.updated_at).toISOString()}</lastmod>\n  </url>`;
    });
    
    sitemap += `\n</urlset>`;
    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (err) {
    res.status(500).send("Error generating sitemap");
  }
});

export default router;