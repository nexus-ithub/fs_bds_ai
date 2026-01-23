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
        SELECT
          s.legDongCode,
          s.name,
          s.lat,
          s.lng,
          d.avgPricePerPyeong as dealPrice
        FROM (
          SELECT
            MIN(id) as id,
            name,
            leg_dong_code as legDongCode,
            AVG(lat) as lat,
            AVG(lng) as lng
          FROM fs_bds.sigungu_boundary
          WHERE lat BETWEEN ? AND ?
          AND lng BETWEEN ? AND ?
          AND leg_dong_code LIKE '11%'
          GROUP BY leg_dong_code, name
        ) s
        LEFT JOIN (
          SELECT
            sigungu_code,
            AVG(price_per_pyeong) as avgPricePerPyeong
          FROM (
            SELECT
              LEFT(b.leg_dong_code, 5) as sigungu_code,
              CAST(REPLACE(b.price, ',', '') AS DECIMAL) / (b.land_area * 0.3025) as price_per_pyeong
            FROM fs_bds.building_deal_list b
            WHERE (b.cancel_yn IS NULL OR b.cancel_yn != 'O')
            AND b.land_area > 0
            AND b.price IS NOT NULL
            AND b.leg_dong_code LIKE '11%'

            UNION ALL

            SELECT
              LEFT(l.leg_dong_code, 5) as sigungu_code,
              CAST(REPLACE(l.price, ',', '') AS DECIMAL) / (l.area * 0.3025) as price_per_pyeong
            FROM fs_bds.land_deal_list l
            WHERE (l.cancel_yn IS NULL OR l.cancel_yn != 'O')
            AND l.area > 0
            AND l.price IS NOT NULL
            AND l.leg_dong_code LIKE '11%'
          ) combined
          GROUP BY sigungu_code
        ) d ON LEFT(s.legDongCode, 5) = d.sigungu_code
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