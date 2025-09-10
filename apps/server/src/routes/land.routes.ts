import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo } from '../controllers/land.controller';

const router: Router = Router();

router.get('/info', verifyToken, getLandInfo);



export default router;