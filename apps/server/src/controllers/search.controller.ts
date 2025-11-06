import { Request, Response } from 'express';
import { SearchModel } from '../models/search.model';
import { BuildingInfo, LandInfo } from '@repo/common';
import { BuildingModel } from '../models/buliding.model';
import { LandModel } from '../models/land.model';
import { AuthRequest } from 'src/middleware/auth.middleware';


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

export const bmReportSearch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const page = req.query.page || '1';
    const size = req.query.size || '10';
    const query = req.query.query as string;
    console.log(userId, query, page, size)
    if (!query || !userId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const searchResults = await SearchModel.bmReportSearch(userId, query as string, Number(page), Number(size)) as {total: number, response: any[]}

    const landIds = searchResults.response.map(r => r.landId).filter(Boolean);
    let lands: LandInfo[] = [];
    if (landIds.length > 0) { lands = await LandModel.findLandById(landIds); }

    const buildingIds = searchResults.response.map(r => r.buildingId).filter(Boolean);
    let buildings: BuildingInfo[] = [];
    if (buildingIds.length > 0) { buildings = await BuildingModel.findBuildingListByJibun({buildingIds}); }

    const searchWithLandInfo = searchResults.response.map(b => ({
      ...b,
      landInfo: lands.find(l => l.id === b.landId) || null,
      buildings: buildings.filter(building => building.id === b.buildingId)
    }));

    res.status(200).json({total: searchResults.total, response: searchWithLandInfo});
  } catch (err) {
    console.error('Get search info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }


}
