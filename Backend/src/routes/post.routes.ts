// post.routes.ts
import { Router } from "express";
import { createPost, updatePost } from "../controllers/post.controller";

const router = Router();

router.post("/", createPost);
router.put("/:id", updatePost);

export default router;