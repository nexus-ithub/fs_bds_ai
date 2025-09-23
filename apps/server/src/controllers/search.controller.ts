import { Request, Response } from 'express';
import { SearchModel } from '../models/search.model';


export const search = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const results = await SearchModel.search(req.query.q as string)

    res.status(200).json(results);
  } catch (err) {
    console.error('Get polygon info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }

  
}