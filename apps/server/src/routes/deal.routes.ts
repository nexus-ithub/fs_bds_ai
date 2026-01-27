import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import {
  getDealAvg,
  getDealList
} from '../controllers/deal.controller';


const router: Router = Router();

router.get('/', getDealList);
router.get('/avg', getDealAvg);

export default router;