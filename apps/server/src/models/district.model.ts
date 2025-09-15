import { db } from '../utils/database';
import { BuildingInfo, DistrictInfo, LandInfo } from '@repo/common';

const DISTRICT_DISTANCE = 1000;

export class DistrictModel {

  static async findDistrictListByLatLng(lat: number, lng: number): Promise<DistrictInfo[] | null> {
    try {
  
      const result = await db.query<DistrictInfo>(
        `SELECT 
          P.code, 
          P.code_name as name, 
          P.div_code_name as divCodeName, 
          CAST(P.area AS DECIMAL) AS area,
          (
            SELECT CAST(C.total_count / (area / 10000) AS DECIMAL) 
            FROM district_foot_traffic AS C 
            WHERE C.code = P.code 
            ORDER BY C.quarter DESC 
            LIMIT 1
          ) AS totalFootPrintPerHa,
          ST_Distance_Sphere(
            geomfromtext('POINT(? ?)'), 
            geomfromtext(CONCAT('POINT(', P.lng, ' ', P.lat, ')'))
          ) AS distance,
          (
              SELECT ROUND((
                  C.monday_count +
                  C.tuesday_count +
                  C.wednesday_count +
                  C.thursday_count +
                  C.friday_count +
                  C.saturday_count +
                  C.sunday_count
              ) / 7, 2)
              FROM district_foot_traffic AS C
              WHERE C.code = P.code
              ORDER BY C.quarter DESC
              LIMIT 1
          ) AS avgDailyCount
        FROM district_polygon AS P
        WHERE ST_Distance_Sphere(
          geomfromtext('POINT(? ?)'), 
          geomfromtext(CONCAT('POINT(', P.lng, ' ', P.lat, ')'))
        ) < ?
        GROUP BY P.code 
        ORDER BY distance ASC`,
        [lng, lat, lng, lat, DISTRICT_DISTANCE]
      )
      // console.log(result);
     

      return result || [];
    } catch (error) {
      console.error('Error finding district by lat and lng:', error);
      throw error;
    }
  }
 


}
