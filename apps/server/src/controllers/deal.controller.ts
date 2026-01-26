import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { trackError } from '../utils/analytics';
import { DealModel } from '../models/deal.model';
import { AreaLevel } from '@repo/common';


export const getDealList = async (req: AuthRequest, res: Response) => {

  try {
    const { neLat, neLng, swLat, swLng } = req.query;
    console.log(req.query)
    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const result = await DealModel.getDealList(
      Number(neLat),
      Number(neLng),
      Number(swLat),
      Number(swLng)
    );

    res.status(200).json(result);
  } catch (err) {
    console.error('Get deal list error:', err);
    trackError(err, {
      message: '거래가 리스트 조회 중 오류 발생',
      query: req.query,
      file: 'deal.controller.ts',
      function: 'getDealList',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getDealAvg = async (req: AuthRequest, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng, type } = req.query;
    console.log(req.query)
    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const result = await DealModel.getDealAvg(Number(neLat), Number(neLng), Number(swLat), Number(swLng), type as AreaLevel);

    res.status(200).json(result);
  } catch (err) {
    console.error('Get deal avg error:', err);
    trackError(err, {
      message: '거래가 평균 계산 중 오류 발생',
      query: req.query,
      file: 'deal.controller.ts',
      function: 'getDealAvg',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

