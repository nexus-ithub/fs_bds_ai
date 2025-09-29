import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { search, bmReportSearch } from '../controllers/search.controller';

const router: Router = Router();

router.get('/', verifyToken, search);
router.get('/bmReport', verifyToken, bmReportSearch);


export default router;