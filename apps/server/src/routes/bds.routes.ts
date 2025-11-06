import { Router } from 'express';
import { addBookmark, getList, isBookmarked, getBookmarkList, getTotalBookmarked, addConsultRequest } from '../controllers/bds.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router: Router = Router();

router.get('/list', getList);
router.post('/consult-request', addConsultRequest);
router.get('/is-bookmarked', verifyToken, isBookmarked);
router.get('/bookmark', verifyToken, getBookmarkList);
router.post('/bookmark', verifyToken, addBookmark);
router.get('/total-bookmarked', verifyToken, getTotalBookmarked);


export default router;