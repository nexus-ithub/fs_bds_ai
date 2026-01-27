import { DealAvgInfo, DealInfo } from "@repo/common";
import { db } from "../utils/database";
import { AreaLevel } from "@repo/common";
export class DealModel {

  static async getDealList(neLat: number, neLng: number, swLat: number, swLng: number): Promise<DealInfo[]> {
    try {
      const dealList = await db.query<DealInfo>(
        `
        SELECT r.id, r.legDongName, r.legDongCode, r.jibun, r.dealDate, r.dealPrice, ap.lat, ap.lng, r.type
        FROM (
          SELECT
            id,
            legDongName,
            legDongCode,
            jibun,
            dealDate,
            dealPrice,
            type,
            ROW_NUMBER() OVER (PARTITION BY id ORDER BY dealDate DESC) as rn
          FROM (
            SELECT
              id,
              leg_dong_name as legDongName,
              leg_dong_code as legDongCode,
              jibun,
              deal_date as dealDate,
              price as dealPrice,
              'building' as type
            FROM fs_bds.building_deal_list
            WHERE (cancel_yn IS NULL OR cancel_yn != 'O')
              AND price IS NOT NULL AND price <> ''
              AND land_area IS NOT NULL AND land_area > 0
              AND deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)

            UNION ALL

            SELECT
              id,
              leg_dong_name as legDongName,
              leg_dong_code as legDongCode,
              jibun,
              deal_date as dealDate,
              price as dealPrice,
              'land' as type
            FROM fs_bds.land_deal_list
            WHERE (cancel_yn IS NULL OR cancel_yn != 'O')
              AND deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
          ) combined
        ) r
        JOIN fs_bds.address_polygon ap ON r.id = ap.id
        WHERE r.rn = 1
          AND ap.lat BETWEEN ? AND ?
          AND ap.lng BETWEEN ? AND ?
        `,
        [swLat, neLat, swLng, neLng]
      )
      return dealList;
    } catch (error) {
      console.error('Error finding deal list:', error);
      throw error;
    }
  }

  static async getDealAvg(neLat: number, neLng: number, swLat: number, swLng: number, areaLevel: AreaLevel): Promise<DealAvgInfo[]> {
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
      if (areaLevel === 'sigungu') {

        const dealList = await db.query<DealAvgInfo>(
          `
          SELECT
            s.id,
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
            WHERE leg_dong_code LIKE '11%'
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
              WHERE b.price IS NOT NULL AND b.price <> ''
                AND b.land_area IS NOT NULL AND b.land_area > 0
                AND (b.cancel_yn != 'O' OR b.cancel_yn IS NULL)
                AND (b.price / b.land_area) >= 200
                AND b.leg_dong_code LIKE '11%'
                AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)

              UNION ALL

              SELECT
                LEFT(l.leg_dong_code, 5) as sigungu_code,
                CAST(REPLACE(l.price, ',', '') AS DECIMAL) / (l.area * 0.3025) as price_per_pyeong
              FROM fs_bds.land_deal_list l
              WHERE l.price IS NOT NULL AND l.price <> ''
                AND l.jimok != '도로' AND l.jimok != '구거'
                AND l.area IS NOT NULL AND l.area >= 33.3
                AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
                AND l.leg_dong_code LIKE '11%'
                AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
            ) combined
            GROUP BY sigungu_code
          ) d ON LEFT(s.legDongCode, 5) = d.sigungu_code
          ORDER BY d.avgPricePerPyeong DESC
          `,
          [swLat, neLat, swLng, neLng]
        )
        return dealList;
      } else {
        const dealList = await db.query<DealAvgInfo>(
          `
          SELECT
            s.id,
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
            FROM fs_bds.eupmyeondong_boundary
            WHERE leg_dong_code LIKE '11%'
            AND lat BETWEEN ? AND ?
            AND lng BETWEEN ? AND ?
            GROUP BY leg_dong_code, name
          ) s
          LEFT JOIN (
            SELECT
              leg_dong_code,
              AVG(price_per_pyeong) as avgPricePerPyeong
            FROM (
              SELECT
                leg_dong_code,
                CAST(REPLACE(b.price, ',', '') AS DECIMAL) / (b.land_area * 0.3025) as price_per_pyeong
              FROM fs_bds.building_deal_list b
              WHERE b.price IS NOT NULL AND b.price <> ''
                AND b.land_area IS NOT NULL AND b.land_area > 0
                AND (b.cancel_yn != 'O' OR b.cancel_yn IS NULL)
                AND (b.price / b.land_area) >= 200
                AND b.leg_dong_code IN (
                  SELECT leg_dong_code FROM fs_bds.eupmyeondong_boundary
                  WHERE leg_dong_code LIKE '11%'
                  AND lat BETWEEN ? AND ?
                  AND lng BETWEEN ? AND ?
                )
                AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)

              UNION ALL

              SELECT
                leg_dong_code,
                CAST(REPLACE(l.price, ',', '') AS DECIMAL) / (l.area * 0.3025) as price_per_pyeong
              FROM fs_bds.land_deal_list l
              WHERE l.price IS NOT NULL AND l.price <> ''
                AND l.jimok != '도로' AND l.jimok != '구거'
                AND l.area IS NOT NULL AND l.area >= 33.3
                AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
                AND l.leg_dong_code IN (
                  SELECT leg_dong_code FROM fs_bds.eupmyeondong_boundary
                  WHERE leg_dong_code LIKE '11%'
                  AND lat BETWEEN ? AND ?
                  AND lng BETWEEN ? AND ?
                )
                AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
            ) combined
            GROUP BY leg_dong_code
          ) d ON s.legDongCode = d.leg_dong_code
          ORDER BY d.avgPricePerPyeong DESC
          `,
          [swLat, neLat, swLng, neLng, swLat, neLat, swLng, neLng, swLat, neLat, swLng, neLng]
        )
        console.log('dealList', dealList.length);
        return dealList;
      }

    } catch (error) {
      console.error('Error finding deal list by id:', error);
      throw error;
    }
  }
}