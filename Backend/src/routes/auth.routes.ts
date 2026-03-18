// auth.routes.ts
import { Router } from 'express';
import { register, login, logout } from '../controllers/auth.controller';
import { authorizedRoles, verifyToken } from '../middlewares/auth.middleware';
import { createPost } from '../controllers/post.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/create-post', verifyToken, authorizedRoles('admin', 'editor'), createPost);
 
export default router;
