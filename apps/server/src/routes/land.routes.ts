import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo, getPolygonInfo, getBusinessDistrict, getPlace, getBuildingList, getEstimatedPrice, getAIReport, addBookmark, isBookmarked, getBookmarkList } from '../controllers/land.controller';


const router: Router = Router();

router.get('/polygon', verifyToken, getPolygonInfo);
router.get('/info', verifyToken, getLandInfo);
router.get('/building-list', verifyToken, getBuildingList);
router.get('/business-district', verifyToken, getBusinessDistrict);
router.get('/place', verifyToken, getPlace);
router.get('/estimated-price', verifyToken, getEstimatedPrice);
router.post('/ai-report', verifyToken, getAIReport);
router.get('/is-bookmarked', verifyToken, isBookmarked);
router.post('/bookmark', verifyToken, addBookmark);
router.get('/bookmark', verifyToken, getBookmarkList);


export default router;