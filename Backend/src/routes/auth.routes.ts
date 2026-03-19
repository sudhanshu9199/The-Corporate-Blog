// auth.routes.ts
import { Router } from 'express';
import { register, login, logout, googleLogin } from '../controllers/auth.controller';
import { authorizedRoles, verifyToken } from '../middlewares/auth.middleware';
import { createPost } from '../controllers/post.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/create-post', verifyToken, authorizedRoles('admin', 'editor'), createPost);
router.post('/google', googleLogin);
 
export default router;
