import { Router } from 'express';
import { getList, getDetail } from '../controllers/politician.controller';

const router: Router = Router();

// 정치인 부동산 리스트 조회 (클러스터 or 개별)
router.get('/list', getList);

// 정치인 부동산 상세 조회
router.get('/detail/:id', getDetail);

export default router;
