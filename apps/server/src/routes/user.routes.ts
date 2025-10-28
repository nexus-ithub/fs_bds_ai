import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getUserInfo, createUser, checkEmail } from '../controllers/user.controller';

const router: Router = Router();

router.get('/info', verifyToken, getUserInfo);
router.get('/check-email', checkEmail);
router.post('/signup', createUser)  



export default router;