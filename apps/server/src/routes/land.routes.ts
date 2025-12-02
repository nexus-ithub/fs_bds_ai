import { Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth.middleware';
import { getLandInfo, getPolygonInfo, getPolygonWithSub, getFilteredPolygon, getBusinessDistrict, getPlace, getBuildingList, getEstimatedPrice, getEstimatedPriceV2, getAIReport, addBookmark, isBookmarked, getBookmarkList, getTotalBookmarked, getAIReportDetail, getAIReportDebugInfo, getConsultRequestList, addConsultRequest, getBuildingRepairedPolygon } from '../controllers/land.controller';


const router: Router = Router();


router.get('/polygon', getPolygonInfo);
router.get('/polygon-with-sub', getPolygonWithSub);
router.get('/polygon-filtered', getFilteredPolygon);
router.get('/polygon-repaired', getBuildingRepairedPolygon);
router.get('/info', getLandInfo);
router.get('/building-list', getBuildingList);
router.get('/business-district', getBusinessDistrict);
router.get('/place', getPlace);
router.get('/estimated-price', getEstimatedPrice);
router.get('/estimated-price-v2', getEstimatedPriceV2);
router.post('/ai-report', getAIReport);
router.post('/ai-report-detail', getAIReportDetail);
router.post('/ai-report-debug-info', getAIReportDebugInfo);
router.get('/is-bookmarked', verifyToken, isBookmarked);
router.post('/bookmark', verifyToken, addBookmark);
router.get('/bookmark', verifyToken, getBookmarkList);
router.get('/total-bookmarked', verifyToken, getTotalBookmarked);
router.get('/consult-request-list', verifyToken, getConsultRequestList);
router.post('/consult-request', verifyToken, addConsultRequest);


export default router;