// post.routes.ts
import { Router } from "express";
import {
  createPost,
  updatePost,
  publishPost,
  getPostBySlug,
  getPostsByCategory,
  getPostsByAuthor,
  incrementView,
  getPopularPosts,
} from "../controllers/post.controller";
import { searchPosts, getRelatedPosts } from "../controllers/search.controller";
import rateLimit from "express-rate-limit";

const router = Router();

const publishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many publish attempts, please try again later.",
});

router.post("/", createPost);
router.put("/:id", updatePost);
router.put("/:id/publish", publishLimiter, publishPost);

router.get("/popular", getPopularPosts);           // ⚠️ static routes FIRST
router.get("/search", searchPosts);
router.get("/category/:slug", getPostsByCategory);
router.get("/author/:authorId", getPostsByAuthor);

router.post("/:id/view", incrementView);

router.get("/:postId/related", getRelatedPosts);
router.get("/:slug", getPostBySlug);

export default router;