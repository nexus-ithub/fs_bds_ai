import { Router } from 'express';
import { addBookmark, getList, isBookmarked } from '../controllers/bds.controller';

const router: Router = Router();

router.get('/list', getList);
router.get('/isBookmarked', isBookmarked);
router.post('/bookmark', addBookmark);


export default router;