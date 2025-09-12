import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo, getBusinessDistrict, getPlace } from '../controllers/land.controller';


const router: Router = Router();

router.get('/info', verifyToken, getLandInfo);
router.get('/business-district', verifyToken, getBusinessDistrict);
router.get('/place', verifyToken, getPlace);


export default router;