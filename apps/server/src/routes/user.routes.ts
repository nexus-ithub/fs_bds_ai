import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getUserInfo, checkEmail, resetPassword, changePassword } from '../controllers/user.controller';

const router: Router = Router();

router.get('/info', verifyToken, getUserInfo);
router.get('/check-email', checkEmail);
router.put('/pwfind', resetPassword);
router.put('/password', verifyToken, changePassword);

export default router;