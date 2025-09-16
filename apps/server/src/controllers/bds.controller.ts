import { Request, Response } from 'express';
import { AuthRequest } from 'src/middleware/auth.middleware';;
import { BdsModel } from '../models/bds.model';



export const getList = async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.query.filter as string;
    if (!filter) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    const bdsList = await BdsModel.getList(filter);
    
    res.status(200).json(bdsList);
  } catch (err) {
    console.error('Get land info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};