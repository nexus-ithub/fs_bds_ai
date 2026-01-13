import { Request, Response } from 'express';
import { PoliticianModel } from '../models/politician.model';
import { trackError } from '../utils/analytics';

/**
 * 지도 범위 내의 정치인 부동산 데이터 조회
 * 줌 레벨에 따라 클러스터 또는 개별 마커 반환
 * level >= 4: 서버에서 지리적 클러스터링
 * level < 4: 개별 마커 반환 (최대 500개)
 */
export const getList = async (req: Request, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng, level } = req.query;

    // 필수 파라미터 검증
    if (!neLat || !neLng || !swLat || !swLng || !level) {
      return res.status(400).json({
        message: '필수 파라미터가 제공되지 않았습니다.',
        required: ['neLat', 'neLng', 'swLat', 'swLng', 'level']
      });
    }

    const ne_lat = parseFloat(neLat as string);
    const ne_lng = parseFloat(neLng as string);
    const sw_lat = parseFloat(swLat as string);
    const sw_lng = parseFloat(swLng as string);
    const zoom_level = parseInt(level as string);

    // 범위 유효성 검증
    if (
      isNaN(ne_lat) || isNaN(ne_lng) || isNaN(sw_lat) || isNaN(sw_lng) || isNaN(zoom_level)
    ) {
      return res.status(400).json({
        message: '잘못된 파라미터 형식입니다.'
      });
    }

    // level >= 4: 클러스터링
    if (zoom_level >= 4) {
      const clusters = await PoliticianModel.getClusters(
        ne_lat,
        ne_lng,
        sw_lat,
        sw_lng,
        zoom_level
      );
      return res.status(200).json({ data: clusters });
    }

    // level < 4: 개별 마커
    const politicians = await PoliticianModel.getList(
      ne_lat,
      ne_lng,
      sw_lat,
      sw_lng
    );

    res.status(200).json({ data: politicians });
  } catch (err) {
    console.error('Get politician list error:', err);
    trackError(err, {
      message: '정치인 부동산 리스트 조회 중 오류 발생',
      file: 'politician.controller.ts',
      function: 'getList',
      severity: 'error'
    });
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

/**
 * 정치인 부동산 상세 정보 조회
 */
export const getDetail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID가 제공되지 않았습니다.' });
    }

    const politicianId = parseInt(id);

    if (isNaN(politicianId)) {
      return res.status(400).json({ message: '잘못된 ID 형식입니다.' });
    }

    const politician = await PoliticianModel.getDetail(politicianId);

    if (!politician) {
      return res.status(404).json({ message: '해당 부동산 정보를 찾을 수 없습니다.' });
    }

    res.status(200).json({ data: politician });
  } catch (err) {
    console.error('Get politician detail error:', err);
    trackError(err, {
      message: '정치인 부동산 상세 조회 중 오류 발생',
      file: 'politician.controller.ts',
      function: 'getDetail',
      severity: 'error'
    });
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
