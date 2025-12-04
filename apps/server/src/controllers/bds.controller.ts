import { Request, Response } from 'express';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { BdsModel } from '../models/bds.model';
import { BdsSale } from '@repo/common';
import { trackError } from '../utils/analytics';
import path from 'path';
import fs from 'fs';


export const getList = async (req: AuthRequest, res: Response) => {
  try {
    const filter = req.query.filter as string;
    if (!filter) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    let filePath = path.resolve(__dirname, '../../buildingshop/bds_sales.json');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, `../buildingshop/bds_sales.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: `bds_sales.json 파일이 없습니다.` });
      }
    }
    const rawData = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const jsonData = JSON.parse(rawData);
    const filteredData = jsonData[filter];

    // const bdsList = await BdsModel.getList(filter);
    
    res.status(200).json(filteredData);
  } catch (err) {
    console.error('Get land info error:', err);
    trackError(err, {
      message: '빌딩샵 매물 리스트 조회 중 오류 발생',
      file: 'bds.controller.ts',
      function: 'getList',
      severity: 'error'
    })
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
    trackError(err, {
      message: '건물 상담 요청 추가 중 오류 발생',
      bdId: req.body?.bdId,
      userId: req.body?.userId || "",
      file: 'bds.controller.ts',
      function: 'addConsultRequest',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const isBookmarked = async (req: AuthRequest, res: Response) => {
  try{
    const userId = req.userId;
    const bdsId = req.query.bdsId as string;
    const isBookmarked = await BdsModel.isBookmarked(userId, bdsId);
    res.status(200).json(isBookmarked);
  } catch (err) {
    console.error('Check bookmarked error:', err);
    trackError(err, {
      message: '빌딩샵 북마크 여부 조회 중 오류 발생',
      userId: req.userId,
      bdsId: req.query?.bdsId,
      file: 'bds.controller.ts',
      function: 'isBookmarked',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const addBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { building, deleteYn } = req.body as { 
      building: BdsSale; 
      deleteYn: string;
    };
    const userId = req.userId;
    await BdsModel.addBookmark(userId, building, deleteYn);
    res.status(200).json({ message: '즐겨찾기 추가 성공' });
  } catch (err) {
    console.error('Add bookmark error:', err);
    trackError(err, {
      message: '빌딩샵 북마크 추가 중 오류 발생',
      userId: req.userId,
      bdsId: req.body?.building?.id,
      file: 'bds.controller.ts',
      function: 'addBookmark',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getTotalBookmarked = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const total = await BdsModel.getTotalBookmarked(userId);
    res.status(200).json(total);
  } catch (err) {
    console.error('Get total bookmarked error:', err);
    trackError(err, {
      message: '빌딩샵 북마크 전체 개수 조회 중 오류 발생',
      userId: req.userId,
      file: 'bds.controller.ts',
      function: 'getTotalBookmarked',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getBookmarkList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const bookmarkList = await BdsModel.getBookmarkList(userId, page, size);
    res.status(200).json(bookmarkList);
  } catch (err) {
    console.error('Get bookmark list error:', err);
    trackError(err, {
      message: '빌딩샵 북마크 리스트 조회 중 오류 발생',
      userId: req.userId,
      file: 'bds.controller.ts',
      function: 'getBookmarkList',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}