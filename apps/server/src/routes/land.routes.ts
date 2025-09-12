import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo, getBusinessDistrict } from '../controllers/land.controller';


const router: Router = Router();

router.get('/info', verifyToken, getLandInfo);
router.get('/business-district', verifyToken, getBusinessDistrict);



export default router;