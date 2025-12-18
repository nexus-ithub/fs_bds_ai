import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getUserInfo, checkEmail, resetPassword, changePassword, changePhone, deleteAccount, checkPassword, getAdditionalInfo, insertAdditionalInfo } from '../controllers/user.controller';

const router: Router = Router();

router.get('/info', verifyToken, getUserInfo);
router.get('/check-email', checkEmail);
router.post('/check-password', verifyToken, checkPassword);
router.put('/pwfind', resetPassword);
router.put('/password', verifyToken, changePassword);
router.put('/phone', verifyToken, changePhone);
router.put('/delete', verifyToken, deleteAccount);
router.get('/additional-info/:userId', verifyToken, getAdditionalInfo)
router.post('/additional-info', verifyToken, insertAdditionalInfo)

export default router;