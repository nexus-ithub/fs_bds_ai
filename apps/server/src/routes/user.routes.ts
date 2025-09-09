import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';

const router: Router = Router();

// router.get('/info', verifyToken, getUserInfo);



export default router;