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

export const bmReportSearch = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const query = req.query.query as string;
    console.log(userId, query, page, size)
    if (!query || !userId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const results = await SearchModel.bmReportSearch(userId as unknown as number, query as string, page as unknown as number, size as unknown as number)
    console.log(results)

    res.status(200).json(results);
  } catch (err) {
    console.error('Get search info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }

  
}
