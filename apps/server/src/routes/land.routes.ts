import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo, getPolygonInfo, getPolygonWithSub, getFilteredPolygon, getBusinessDistrict, getPlace, getBuildingList, getEstimatedPrice, getAIReport, addBookmark, isBookmarked, getBookmarkList, getTotalBookmarked } from '../controllers/land.controller';


const router: Router = Router();


router.get('/polygon', getPolygonInfo);
router.get('/polygon-with-sub', getPolygonWithSub);
router.get('/polygon-filtered', getFilteredPolygon);
router.get('/info', getLandInfo);
router.get('/building-list', getBuildingList);
router.get('/business-district', getBusinessDistrict);
router.get('/place', getPlace);
router.get('/estimated-price', getEstimatedPrice);
router.post('/ai-report', getAIReport);
router.get('/is-bookmarked', verifyToken, isBookmarked);
router.post('/bookmark', verifyToken, addBookmark);
router.get('/bookmark', verifyToken, getBookmarkList);
router.get('/total-bookmarked', verifyToken, getTotalBookmarked);


export default router;