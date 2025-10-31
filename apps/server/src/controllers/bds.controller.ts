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

export const addConsultRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, bdId, name, phone, content } = req.body as { 
      userId: string; 
      bdId: string; 
      name: string; 
      phone: string; 
      content: string;
    };
    await BdsModel.addConsultRequest(userId, bdId, name, phone, content);
    res.status(200).json({ message: '건물 상담 요청 추가 성공' });
  } catch (err) {
    console.error('Add consult request error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const isBookmarked = async (req: AuthRequest, res: Response) => {
  try{
    const userId = req.query.userId as string;
    const bdsId = req.query.bdsId as string;
    const isBookmarked = await BdsModel.isBookmarked(userId, bdsId);
    res.status(200).json(isBookmarked);
  } catch (err) {
    console.error('Check bookmarked error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const addBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, building, deleteYn } = req.body as { 
      userId: string; 
      building: BdsSale; 
      deleteYn: string;
    };
    await BdsModel.addBookmark(userId, building, deleteYn);
    res.status(200).json({ message: '즐겨찾기 추가 성공' });
  } catch (err) {
    console.error('Add bookmark error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getTotalBookmarked = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const total = await BdsModel.getTotalBookmarked(userId);
    res.status(200).json(total);
  } catch (err) {
    console.error('Get total bookmarked error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getBookmarkList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const bookmarkList = await BdsModel.getBookmarkList(userId, page, size);
    res.status(200).json(bookmarkList);
  } catch (err) {
    console.error('Get bookmark list error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}