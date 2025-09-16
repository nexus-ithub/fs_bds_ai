import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { DistrictModel } from '../models/district.model';
import { BdsModel } from '../models/bds.model';


export const getList = async (req: AuthRequest, res: Response) => {
  try {

    const bdsList = await BdsModel.getList();
    
    res.status(200).json(bdsList);
  } catch (err) {
    console.error('Get land info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};