import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { search } from '../controllers/search.controller';

const router: Router = Router();

router.get('/', verifyToken, search);


export default router;