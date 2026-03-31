import { Request, Response } from "express";
import { pool, queryDb } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import slugify from "slugify";
import axios from "axios";
import crypto from "crypto";

type PostStatus = "draft" | "published" | "scheduled" | "archived";

interface SeoMetadata {
  description?: string;
  excerpt?: string;
  keywords?: string[];
  og_image?: string;
}

const ALLOWED_STATUSES: PostStatus[] = ["draft", "published", "scheduled", "archived"];
const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;
const POPULAR_POSTS_LIMIT = 5;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://the-corporate-blog-rw6q.vercel.app";

const ok = (res: Response, data: object, statusCode = 200) => {
  res.status(statusCode).json({ success: true, ...data });
}

const fail = (res: Response, message: string, statusCode = 400) => {
  res.status(statusCode).json({ success: false, error: message });
}

const generateSlug = (title: string): string => {
  return `${slugify(title, { lower: true, strict: true })}-${Date.now()}`;
}

const parsePagination = (query: Request["query"]) => {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(query.limit as string) || DEFAULT_PAGE_LIMIT));

  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const validateBlocks = (content: unknown): void => {
  if (content || typeof content !== "object") return;
  const blocks = (content as any).blocks;

  if (!Array.isArray(blocks)) return;
  for (const block of blocks) {
    if (block.type === "faq") {
      if (!Array.isArray(block.daata?.items)) {
        throw new Error("FAQ block must contain an items array.");
      }
      for(const item of block.data.items) {
        if (!item.question || !item.answer) {
          throw new Error("Each FAQ item must have a question and an answer.");
        }
      }
    }
  }
};

const buildViewerHash = (req: Request): string => {
  const ip        = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
                    ?? req.socket.remoteAddress
                    ?? "unknown";
  const userAgent = req.headers["user-agent"] ?? "unknown";
  return crypto.createHash("sha256").update(`${ip}-${userAgent}`).digest("hex");
};

export const getPosts = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const search = (req.query.search as string)?.trim() ?? "";
    const category = (req.query.category as string)?.trim() ?? "";

    const conditions: string[] = ["p.status = 'published'"];
    const values: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(p.title ILIKE $${idx} OR p.content::text ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (category) {
      conditions.push(`c.slug = $${idx}`);
      values.push(category);
      idx++;
    }

    const whereClause = conditions.join(" AND ");

    const sql = `
    SELECT
        p.id, p.title, p.slug, p.cover_image_url,
        p.published_at, p.views_count, p.status,
        u.name AS author_name,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name, 'slug', c.slug)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categories
      FROM posts p
      LEFT JOIN users          u  ON p.author_id   = u.id
      LEFT JOIN post_categories pc ON p.id          = pc.post_id
      LEFT JOIN categories      c  ON pc.category_id = c.id
      WHERE ${whereClause}
      GROUP BY p.id, u.name
      ORDER BY p.published_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}`;
      values.push(limit, offset);

      const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM posts p
      LEFT JOIN post_categories pc ON p.id          = pc.post_id
      LEFT JOIN categories      c  ON pc.category_id = c.id
      WHERE ${whereClause}
      `;

      const countValues = values.slice(0, -2);

      const [result, countResult] = await Promise.all([
        queryDb(sql, values),
        queryDb(countSql, countValues),
      ]);

      const total = parseInt(countResult.rows[0]?.total ?? '0');
      const totalPages = Math.ceil(total / limit);

      return ok(res, {
        data: result.rows,
        pagination: { page, limit, total, totalPages },
      });
  } catch (err) {
    console.error("[getPosts]", err);
    return fail(res, "Failed to fetch posts", 500 )
  }
};

export const getPostBySlug = async (req: Request, res: Response): Promise<any> => {
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
      return res.status(404).json({ error: "Post not found or unpublished" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getPostsByCategory = async (req: Request, res: Response): Promise<any> => {
  try {
    const { slug } = req.params;
    const { page, limit, offset } = parsePagination(req.query);

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

        const countQuery = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM posts p
      JOIN post_categories pc ON p.id          = pc.post_id
      JOIN categories      c  ON pc.category_id = c.id
      WHERE c.slug = $1 AND p.status = 'published'
    `;

    const [result, countResult] = await Promise.all([
      queryDb(query, [slug, limit, offset]),
      queryDb(countQuery, [slug]),
    ]);
 
    const total      = parseInt(countResult.rows[0]?.total ?? "0");
    const totalPages = Math.ceil(total / limit);
 
    return ok(res, {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

export const getPostsByAuthor = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id }                 = req.params; // Author UUID/ID
    const { page, limit, offset } = parsePagination(req.query);
 
    const sql = `
      SELECT
        p.id, p.title, p.slug, p.cover_image_url, p.published_at,
        u.name AS author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE u.id = $1
        AND p.status = 'published'
        AND p.published_at IS NOT NULL
      ORDER BY p.published_at DESC
      LIMIT $2 OFFSET $3
    `;
 
    const countSql = `
      SELECT COUNT(*) AS total
      FROM posts p
      WHERE p.author_id = $1 AND p.status = 'published'
    `;
 
    const [result, countResult] = await Promise.all([
      queryDb(sql, [id, limit, offset]),
      queryDb(countSql, [id]),
    ]);
 
    const total      = parseInt(countResult.rows[0]?.total ?? "0");
    const totalPages = Math.ceil(total / limit);
 
    return ok(res, {
      data: result.rows,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("[getPostsByAuthor]", error);
    return fail(res, "Server error.", 500);
  }
};
 
/**
 * GET /posts/popular
 * Returns top 5 posts by views_count.
 */
export const getPopularPosts = async (_req: Request, res: Response): Promise<any> => {
  try {
    const sql = `
      SELECT
        p.id, p.title, p.slug, p.cover_image_url,
        p.views_count, p.published_at,
        u.name AS author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.views_count DESC
      LIMIT $1
    `;
    const result = await queryDb(sql, [POPULAR_POSTS_LIMIT]);
    return ok(res, { data: result.rows });
  } catch (error) {
    console.error("[getPopularPosts]", error);
    return fail(res, "Server error.", 500);
  }
};

export const createPost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, content, author_id, seo_metadata } = req.body;
 
    // ── Input validation ──
    if (!author_id)               return fail(res, "author_id is required.");
    if (!title?.trim())           return fail(res, "title is required.");
    if (!content || typeof content !== "object") {
      return fail(res, "content must be a valid EditorJS JSON object.");
    }
 
    validateBlocks(content);
 
    const slug = generateSlug(title.trim());
 
    const sql = `
      INSERT INTO posts (author_id, title, slug, content, status, seo_metadata)
      VALUES ($1, $2, $3, $4, 'draft', $5)
      RETURNING *
    `;
    const result = await queryDb(sql, [
      author_id,
      title.trim(),
      slug,
      content,
      seo_metadata ?? {},
    ]);
 
    console.log(`[createPost] Draft created → ID: ${result.rows[0].id}, Slug: ${slug}`);
    return ok(res, { message: "Draft created successfully.", data: result.rows[0] }, 201);
  } catch (error: any) {
    console.error("[createPost]", error);
    // Expose validation errors (thrown by validateBlocks) as 400, not 500
    if (error.message?.startsWith("FAQ") || error.message?.startsWith("Each FAQ")) {
      return fail(res, error.message, 400);
    }
    return fail(res, "Server error.", 500);
  }
};
 
/**
 * PUT /posts/:id
 * Updates a draft's content, title, and/or SEO metadata.
 * Status can only be moved to allowed values; publish flow uses /publish.
 */
export const updatePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id }                              = req.params;
    const { title, content, status, seo_metadata, author_id } = req.body;
 
    // ── Validate status enum ──
    const resolvedStatus: PostStatus = ALLOWED_STATUSES.includes(status)
      ? status
      : "draft";
 
    if (content) {
      if (typeof content !== "object") return fail(res, "content must be a valid JSON object.");
      validateBlocks(content);
    }
 
    // ── Ownership check ──
    if (author_id) {
      const ownerCheck = await queryDb("SELECT author_id FROM posts WHERE id = $1", [id]);
      if (ownerCheck.rows.length === 0)            return fail(res, "Post not found.", 404);
      if (ownerCheck.rows[0].author_id !== author_id) {
        return fail(res, "You do not have permission to edit this post.", 403);
      }
    }
 
    // ── Build query dynamically ──
    const setClauses: string[] = [
      "status = $1",
      "seo_metadata = $2",
      "updated_at = CURRENT_TIMESTAMP",
    ];
    const values: unknown[] = [resolvedStatus, seo_metadata ?? {}];
    let idx = 3;
 
    if (content) {
      setClauses.push(`content = $${idx}`);
      values.push(content);
      idx++;
    }
 
    if (title?.trim()) {
      const slug = generateSlug(title.trim());
      setClauses.push(`title = $${idx}, slug = $${idx + 1}`);
      values.push(title.trim(), slug);
      idx += 2;
    }
 
    setClauses.push(`WHERE id = $${idx} RETURNING *`);
    values.push(id);
 
    const sql    = `UPDATE posts SET ${setClauses.join(", ")}`;
    const result = await queryDb(sql, values);
 
    if (result.rows.length === 0) return fail(res, "Post not found.", 404);
 
    console.log(`[updatePost] Post ${id} updated → Status: ${resolvedStatus}`);
    return ok(res, { message: "Post updated.", data: result.rows[0] });
  } catch (error: any) {
    console.error("[updatePost]", error);
    if (error.message?.startsWith("FAQ") || error.message?.startsWith("Each FAQ")) {
      return fail(res, error.message, 400);
    }
    return fail(res, "Server error.", 500);
  }
};
 
/**
 * POST /posts/:id/publish
 * Validates required publish fields, then atomically updates status and
 * writes an audit log. Triggers Vercel ISR revalidation on immediate publish.
 */
export const publishPost = async (req: Request, res: Response): Promise<any> => {
  const startTime = Date.now();
  const client    = await pool.connect();
 
  try {
    const { id }                       = req.params;
    const { author_id, scheduled_date } = req.body;
 
    if (!author_id) return fail(res, "author_id is required.");
 
    await client.query("BEGIN");
 
    const postRes = await client.query("SELECT * FROM posts WHERE id = $1", [id]);
    if (postRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return fail(res, "Post not found.", 404);
    }
    const post = postRes.rows[0];
 
    if (post.author_id !== author_id) {
      await client.query("ROLLBACK");
      return fail(res, "You do not have permission to publish this post.", 403);
    }
 
    const seoMeta: SeoMetadata = post.seo_metadata ?? {};
    const hasExcerpt           = !!(seoMeta.description || seoMeta.excerpt);
 
    if (!post.title || !post.slug || !post.cover_image_url || !hasExcerpt) {
      await client.query("ROLLBACK");
      return fail(
        res,
        "Title, slug, cover image, and a meta description/excerpt are required before publishing.",
        400,
      );
    }
 
    const publishDate = scheduled_date ? new Date(scheduled_date) : new Date();
    const isFuture    = scheduled_date && publishDate > new Date();
    const newStatus: PostStatus = isFuture ? "scheduled" : "published";
 
    const updateSql = `
      UPDATE posts
      SET status = $1, published_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const updatedPost = await client.query(updateSql, [newStatus, publishDate, id]);
 
    await client.query(
      `INSERT INTO publish_audit_logs (post_id, action_by, action) VALUES ($1, $2, $3)`,
      [id, author_id, newStatus === "published" ? "published" : "scheduled"],
    );
 
    await client.query("COMMIT");
 
    if (newStatus === "published") {
      axios
        .get(
          `${FRONTEND_URL}/api/revalidate?secret=${process.env.REVALIDATION_SECRET}&slug=${post.slug}`,
        )
        .then(() => console.log(`[publishPost] ISR revalidated → /blog/${post.slug}`))
        .catch((err) => console.error("[publishPost] ISR revalidation failed (post still published):", err?.message));
    }
 
    const latency = Date.now() - startTime;
    console.log(`[publishPost] Post ${id} → ${newStatus} (${latency}ms)`);
 
    return ok(res, {
      message: `Post ${newStatus}.`,
      data:    updatedPost.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[publishPost]", error);
    return fail(res, "Server error during publishing.", 500);
  } finally {
    client.release();
  }
};

export const incrementView = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id }     = req.params;
    const userAgent  = req.headers["user-agent"] ?? "";
 
    // ── Basic bot filter ──
    const BOT_PATTERN = /bot|crawl|slurp|spider|mediapartners/i;
    if (BOT_PATTERN.test(userAgent)) {
      return ok(res, { message: "View ignored." });
    }
 
    const viewerHash = buildViewerHash(req);
 
    // Insert only if this hash hasn't been seen today for this post
    const insertSql = `
      INSERT INTO post_views (post_id, viewer_hash, viewed_at)
      VALUES ($1, $2, CURRENT_DATE)
      ON CONFLICT (post_id, viewer_hash, viewed_at) DO NOTHING
      RETURNING id
    `;
    const viewResult = await queryDb(insertSql, [id, viewerHash]);
 
    if ((viewResult.rowCount ?? 0) > 0) {
      await queryDb(
        "UPDATE posts SET views_count = views_count + 1 WHERE id = $1",
        [id],
      );
    }
 
    return ok(res, { message: "View tracked." });
  } catch (error) {
    console.error("[incrementView]", error);
    return fail(res, "Server error tracking view.", 500);
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id; // Assuming auth middleware attaches user

    try {
        await pool.query('BEGIN');

        // 1. Soft Delete
        await pool.query(
            `UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [id]
        );

        // 2. Audit Log
        await pool.query(
            `INSERT INTO publish_audit_logs (post_id, action_by, action) VALUES ($1, $2, 'SOFT_DELETED')`,
            [id, userId]
        );

        await pool.query('COMMIT');

        // 3. Trigger Frontend ISR Cache Invalidation
        await fetch(`https://the-corporate-blog-rw6q.vercel.app/api/revalidate?secret=${process.env.REVALIDATE_SECRET}&path=/blog`);

        res.status(200).json({ message: "Post softly deleted and cache cleared." });
    } catch (error) {
        await pool.query('ROLLBACK');
        res.status(500).json({ error: "Failed to delete post" });
    }
};