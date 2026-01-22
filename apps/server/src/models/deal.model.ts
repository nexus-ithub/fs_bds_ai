import { DealAvgInfo, DealInfo } from "@repo/common";
import { db } from "../utils/database";


export class DealModel {

  static async getDealAvg(neLat: number, neLng: number, swLat: number, swLng: number, type: string): Promise<DealAvgInfo[]> {
    try {
      // const dealList = await db.query<DealAvgInfo>(
      //   `
      //   SELECT id, name, leg_dong_code as legDongCode, lat, lng, dbreg_dt, polygon
      //   FROM (
      //     SELECT s.id, s.name, s.leg_dong_code, s.lat, s.lng, s.dbreg_dt, s.polygon,
      //            ROW_NUMBER() OVER (PARTITION BY s.leg_dong_code ORDER BY s.dbreg_dt DESC) as rn
      //     FROM fs_bds.sigungu_boundary s
      //   ) ranked
      //   WHERE rn = 1
      //   AND lat BETWEEN ? AND ?
      //   AND lng BETWEEN ? AND ?
      //   `,
      //   [swLat, neLat, swLng, neLng]
      // )
      const dealList = await db.query<DealAvgInfo>(
        `
        SELECT id, name, leg_dong_code as legDongCode, lat, lng, dbreg_dt, polygon
        FROM fs_bds.sigungu_boundary
        WHERE lat BETWEEN ? AND ?
        AND lng BETWEEN ? AND ?
        `,
        [swLat, neLat, swLng, neLng]
      )

      return dealList;
    } catch (error) {
      console.error('Error finding deal list by id:', error);
      throw error;
    }
  }
}