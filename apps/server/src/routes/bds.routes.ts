import { Router } from 'express';
import { addBookmark, getList, isBookmarked, getBookmarkList, getTotalBookmarked } from '../controllers/bds.controller';

const router: Router = Router();

router.get('/list', getList);
router.get('/is-bookmarked', isBookmarked);
router.get('/bookmark', getBookmarkList);
router.post('/bookmark', addBookmark);
router.get('/total-bookmarked', getTotalBookmarked);


export default router;