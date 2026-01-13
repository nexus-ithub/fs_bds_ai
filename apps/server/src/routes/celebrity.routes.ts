import { Router } from 'express';
import { getDongPolygons, getList, getCelebritiesByDong } from '../controllers/celebrity.controller';

const router: Router = Router();

// 연예인 부동산 동 폴리곤 조회 (지도에 동 단위로 색칠)
router.get('/dong-polygons', getDongPolygons);

// 연예인 부동산 리스트 조회 (마커용)
router.get('/list', getList);

// 특정 동의 연예인 목록 조회
router.get('/dong/:dongName', getCelebritiesByDong);

export default router;
