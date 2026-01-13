import { Request, Response } from 'express';
import { CelebrityModel } from '../models/celebrity.model';
import { trackError } from '../utils/analytics';

/**
 * 연예인 부동산이 있는 동의 폴리곤 데이터 조회
 * 지도에 동 단위로 색칠하여 표시
 */
export const getDongPolygons = async (req: Request, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;

    // 범위가 제공되면 해당 범위 내 동만, 없으면 전체
    if (neLat && neLng && swLat && swLng) {
      const ne_lat = parseFloat(neLat as string);
      const ne_lng = parseFloat(neLng as string);
      const sw_lat = parseFloat(swLat as string);
      const sw_lng = parseFloat(swLng as string);

      if (isNaN(ne_lat) || isNaN(ne_lng) || isNaN(sw_lat) || isNaN(sw_lng)) {
        return res.status(400).json({ message: '잘못된 파라미터 형식입니다.' });
      }

      const polygons = await CelebrityModel.getDongPolygons(
        ne_lat,
        ne_lng,
        sw_lat,
        sw_lng
      );

      return res.status(200).json({ data: polygons });
    }

    // 범위 없으면 전체 조회
    const polygons = await CelebrityModel.getAllDongPolygons();
    res.status(200).json({ data: polygons });
  } catch (err) {
    console.error('Get celebrity dong polygons error:', err);
    trackError(err, {
      message: '연예인 부동산 동 폴리곤 조회 중 오류 발생',
      file: 'celebrity.controller.ts',
      function: 'getDongPolygons',
      severity: 'error'
    });
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 지도 범위 내의 연예인 부동산 개별 목록 조회 (마커용)
 */
export const getList = async (req: Request, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;

    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({
        message: '필수 파라미터가 제공되지 않았습니다.',
        required: ['neLat', 'neLng', 'swLat', 'swLng']
      });
    }

    const ne_lat = parseFloat(neLat as string);
    const ne_lng = parseFloat(neLng as string);
    const sw_lat = parseFloat(swLat as string);
    const sw_lng = parseFloat(swLng as string);

    if (isNaN(ne_lat) || isNaN(ne_lng) || isNaN(sw_lat) || isNaN(sw_lng)) {
      return res.status(400).json({ message: '잘못된 파라미터 형식입니다.' });
    }

    const celebrities = await CelebrityModel.getList(
      ne_lat,
      ne_lng,
      sw_lat,
      sw_lng
    );

    res.status(200).json({ data: celebrities });
  } catch (err) {
    console.error('Get celebrity list error:', err);
    trackError(err, {
      message: '연예인 부동산 리스트 조회 중 오류 발생',
      file: 'celebrity.controller.ts',
      function: 'getList',
      severity: 'error'
    });
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 특정 동의 연예인 목록 조회
 */
export const getCelebritiesByDong = async (req: Request, res: Response) => {
  try {
    const { dongName } = req.params;

    if (!dongName) {
      return res.status(400).json({ message: '동 이름이 제공되지 않았습니다.' });
    }

    const celebrities = await CelebrityModel.getCelebritiesByDong(dongName);

    res.status(200).json({ data: celebrities });
  } catch (err) {
    console.error('Get celebrities by dong error:', err);
    trackError(err, {
      message: '동별 연예인 조회 중 오류 발생',
      file: 'celebrity.controller.ts',
      function: 'getCelebritiesByDong',
      severity: 'error'
    });
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
