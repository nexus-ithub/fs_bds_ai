import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { LandModel } from '../models/land.model';
import { BuildingModel } from '../models/buliding.model';
import { LandInfoResp } from '@repo/common';
import { DistrictModel } from '../models/district.model';


export const getLandInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const land = await LandModel.findLandIdByLatLng(Number(lat), Number(lng));
    const buildings = await BuildingModel.findBuildingListByJibun(land.legDongCode, land.jibun);
    if (!land) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const landInfoResp = {
      land,
      buildings,
    } as LandInfoResp;
    
    res.status(200).json(landInfoResp);
  } catch (err) {
    console.error('Get land info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getBusinessDistrict = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const districtList = await DistrictModel.findDistrictListByLatLng(Number(lat), Number(lng));
    
    res.status(200).json(districtList);
  } catch (err) {
    console.error('Get land info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};
