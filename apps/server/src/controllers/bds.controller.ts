import { Request, Response } from 'express';
import { AuthRequest } from 'src/middleware/auth.middleware';;
import { BdsModel } from '../models/bds.model';
import { BdsSale } from '@repo/common';



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

export const isBookmarked = async (req: AuthRequest, res: Response) => {
  try{
    const userId = req.query.userId as string;
    const bdsId = req.query.bdsId as string;
    console.log(userId, bdsId)
    const isBookmarked = await BdsModel.isBookmarked(userId, bdsId);
    res.status(200).json(isBookmarked);
  } catch (err) {
    console.error('Check bookmarked error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const addBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, building } = req.body as { 
      userId: string; 
      building: BdsSale; 
    };
    await BdsModel.addBookmark(userId, building);
    res.status(200).json({ message: '즐겨찾기 추가 성공' });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}