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
}
