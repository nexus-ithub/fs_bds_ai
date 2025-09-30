import { db } from '../utils/database';
import { BuildingInfo, DistrictInfo, LandInfo, SearchResult } from '@repo/common';


const normalize = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');

export class SearchModel {

  static async search(query: string): Promise<SearchResult[] | null> {
    try {
      const normalizedQuery = normalize(query);
      
      console.log('search query: ', query)
      const result = await db.query<SearchResult>(
        `SELECT id, jibun, road, building_name as buildingName FROM address_search WHERE key_jibun LIKE ? OR key_road LIKE ? OR key_building LIKE ? LIMIT 20`,
        [`%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`]
      )
      console.log(result);
     

      return result || [];
    } catch (error) {
      console.error('Error finding district by lat and lng:', error);
      throw error;
    }
  }

  static async bmReportSearch(userId: number, query: string, page: number, size: number) {
    try {
      const normalizedQuery = normalize(query);
      
      const countResult = await db.query<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM address_search AS a
         LEFT JOIN bookmarked_report AS br ON a.id = br.land_id
         WHERE (a.key_jibun LIKE ? OR a.key_road LIKE ? OR a.key_building LIKE ?)
           AND br.user_id = ? AND br.delete_yn = 'N'`,
        [`%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`, userId]
      );
      
      const total = countResult[0].total;
      console.log(`size >> ${size}, page >> ${page}`)
      
      const response = await db.query(
        `SELECT br.land_id as landId, br.building_id as buildingId, br.estimated_price as estimatedPrice, br.estimated_price_per as estimatedPricePer,
        ap.leg_dong_code as legDongCode, ap.leg_dong_name as legDongName, ap.jibun, ap.lat, ap.lng, ap.polygon 
        FROM address_search AS a
        LEFT JOIN bookmarked_report AS br ON a.id = br.land_id
        LEFT JOIN address_polygon AS ap ON br.land_id = ap.id
        WHERE (a.key_jibun LIKE ? OR a.key_road LIKE ? OR a.key_building LIKE ?)
          AND br.user_id = ? AND br.delete_yn = 'N'
        ORDER BY br.created_at DESC
        LIMIT ? 
        OFFSET ?`,
        [`%${normalizedQuery}%`, `%${normalizedQuery}%`, `%${normalizedQuery}%`, userId, size, (page - 1) * size]
      )
     
      return {total, response};
    } catch (error) {
      console.error('Error finding district by lat and lng:', error);
      throw error;
    }
  }
}
