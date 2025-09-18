import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo, getPolygonInfo, getBusinessDistrict, getPlace, getBuildingList, getEstimatedPrice } from '../controllers/land.controller';


const router: Router = Router();

router.get('/polygon', verifyToken, getPolygonInfo);
router.get('/info', verifyToken, getLandInfo);
router.get('/building-list', verifyToken, getBuildingList);
router.get('/business-district', verifyToken, getBusinessDistrict);
router.get('/place', verifyToken, getPlace);
router.get('/estimated-price', verifyToken, getEstimatedPrice);


export default router;