import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getUserInfo, checkEmail, resetPassword, changePassword, deleteAccount, checkPassword } from '../controllers/user.controller';

const router: Router = Router();

router.get('/info', verifyToken, getUserInfo);
router.get('/check-email', checkEmail);
router.post('/check-password', verifyToken, checkPassword);
router.put('/pwfind', resetPassword);
router.put('/password', verifyToken, changePassword);
router.put('/delete', verifyToken, deleteAccount);

export default router;