import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getUserInfo } from '../controllers/user.controller';

const router: Router = Router();

router.get('/info', verifyToken, getUserInfo);



export default router;