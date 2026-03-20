// post.routes.ts
import { Router } from "express";
import { createPost, updatePost } from "../controllers/post.controller";
import { publishPost } from "../controllers/post.controller";
import rateLimit from "express-rate-limit";
import { searchPosts, getRelatedPosts } from "../controllers/search.controller";

const router = Router();

const publishLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 publish requests per window
  message: "Too many publish attempts, please try again later."
});

router.post("/", createPost);
router.put("/:id", updatePost);
router.put("/:id/publish", publishLimiter, publishPost);
router.get("/search", searchPosts);
router.get("/:postId/related", getRelatedPosts);

export default router;