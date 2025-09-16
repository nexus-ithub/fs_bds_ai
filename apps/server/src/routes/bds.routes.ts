import { Router } from 'express';
import { getList } from '../controllers/bds.controller';

const router: Router = Router();

router.get('/list', getList);



export default router;