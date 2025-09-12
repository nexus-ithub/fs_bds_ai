import { Router } from 'express';
import { getVideoList } from '../controllers/youtube.controller';

const router: Router = Router();

router.get('/list', getVideoList);



export default router;