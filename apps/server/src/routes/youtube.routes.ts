import { Router } from 'express';
import { getVideoList } from '../controllers/youtube.controller';
import { getBrandingVideo } from '../controllers/youtube.controller';

const router: Router = Router();

router.get('/list', getVideoList);
router.get('/branding', getBrandingVideo);


export default router;