
import { bdsDb } from "../utils/bds-database";
import { db } from '../utils/database';
import { type BdsSale } from "@repo/common";


const IMAGE_HOST = 'http://admin.buildingshop.co.kr/';

export class BdsModel {

  static async getList(filter: string): Promise<BdsSale[]> {


    let char = `'1%'`;
    if (filter === 'hotplace') {
      char = `'_1%'`
    }else if (filter === 'subway') {
      char = `'__1%'`
    }else if (filter === 'income') {
      char = `'___1%'`
    }else if (filter === 'office') {
      char = `'____1%'`
    }else if (filter === 'newbuild') {
      char = `'_____1%'`
    }else if (filter === 'development') {
      char = `'______1%'`
    }else if (filter === 'minibuild') {
      char = `'_______1%'`
    }
    try {
      // const bdsList = await bdsDb.query<BdsSale>(
      //   `WITH LatestSales AS (
      //     SELECT bs1.*,
      //           ROW_NUMBER() OVER (PARTITION BY bs1.bd_building_id ORDER BY bs1.update_at DESC, bs1.id DESC) AS rn
      //     FROM bd_sale_info bs1
      //     WHERE bs1.deleted_date IS NULL
      //     )
      //     SELECT
      //         bd.id AS idx,
      //         bd.bd_name as name,
      //         bd.bd_addr as addr,
      //         bd.bd_plat_area as platArea,
      //         bd.bd_total_area as totalArea,
      //         COALESCE(SUM(bd_val.value), 0) AS buildValue,  -- 실시간으로 value를 합산하여 buildValue 사용
      //             bd_sale.id as saleId,
      //         bd_sale.sale_amount as saleAmount,
      //         bd_sale.sale_loan_ratio as saleLoanRatio,
      //         bd_sale.sale_loan_rate as saleLoanRate,
      //         bd_sale.sale_income_etc as saleIncomeEtc,
      //             bd_sale.memo as memo,
      //         CASE
      //             WHEN bd_img.image_path LIKE './%' THEN CONCAT('${IMAGE_HOST}', SUBSTRING(bd_img.image_path, 3))
      //             ELSE CONCAT('${IMAGE_HOST}', bd_img.image_path)
      //         END AS imagePath
      //     FROM bd_building AS bd
      //     LEFT JOIN (
      //         SELECT *
      //         FROM LatestSales
      //         WHERE rn = 1  -- 가장 최근의 update_at 값을 가진 레코드만 선택
      //     ) AS bd_sale ON bd.id = bd_sale.bd_building_id
      //     LEFT JOIN bd_building_image AS bd_img
      //         ON bd.id = bd_img.bd_building_id
      //         AND bd_img.image_type = 'BUILDING'
      //         AND bd_img.deleted_date IS NULL
      //     LEFT JOIN bd_sale_valuation AS bd_val
      //         ON bd_sale.id = bd_val.bd_sale_info_id  -- bd_sale_info_id로 조인하여 value 값을 합산
      //     WHERE bd_char LIKE ${char}
      //             and bd_sale.deleted_date is Null
      //             and bd_sale.sale_type = 'P'
      //     GROUP BY bd.id, bd.bd_name, bd.bd_addr, bd.bd_plat_area, bd.bd_total_area, bd_sale.sale_amount,
      //             bd_sale.sale_loan_ratio, bd_sale.sale_loan_rate, bd_sale.sale_income_etc, bd_sale.memo, imagePath
      //     ORDER BY buildValue DESC  -- 합산된 build_value 기준으로 정렬
      //     LIMIT 5`,
      // );
      const bdsList = await bdsDb.query<BdsSale>(
        `WITH LatestSales AS (
          SELECT
            bs1.*,
            ROW_NUMBER() OVER (
              PARTITION BY bs1.bd_building_id
              ORDER BY bs1.update_at DESC, bs1.id DESC
            ) AS rn
          FROM bd_sale_info bs1
          WHERE bs1.deleted_date IS NULL
        ),
        RentAgg AS (
          SELECT
            r.bd_sale_info_id,
            SUM(COALESCE(r.bsri_rent_deposit, 0))    AS tot_deposit,
            SUM(COALESCE(r.bsri_rent_fee, 0))        AS tot_rent,
            SUM(COALESCE(r.bsri_maintenance_fee, 0)) AS tot_rent_m_fee
          FROM bd_sale_rent_info r
          GROUP BY r.bd_sale_info_id
        ),
        ValAgg AS (
          SELECT
            v.bd_sale_info_id,
            SUM(COALESCE(v.value, 0)) AS build_value
          FROM bd_sale_valuation v
          GROUP BY v.bd_sale_info_id
        )
        SELECT
          bd.id AS idx,
          bd.bd_name as name,
          bd.bd_addr as addr,
          bd.bd_plat_area as platArea,
          bd.bd_total_area as totalArea,

          /* 평가값 합계 */
          COALESCE(va.build_value, 0) AS buildValue,

          /* 매물 정보 */
          bd_sale.id AS saleId,
          bd_sale.sale_amount as saleAmount,
          bd_sale.memo as memo,

          /* 이미지 경로 정규화 */
          CASE
              WHEN bd_img.image_path LIKE './%' THEN CONCAT('${IMAGE_HOST}', SUBSTRING(bd_img.image_path, 3))
              ELSE CONCAT('${IMAGE_HOST}', bd_img.image_path)
          END AS imagePath,

          /* 수익률 계산식
            (( (임대료 + 관리비 + 기타수입)*12 ) - (매매가 * 대출비율 * 대출금리/10000))
            / ( 매매가 - 보증금합 - (매매가 * 대출비율/100) ) * 100
            ※ 분모 0 방지: NULLIF
          */
          (
            (
              (
                (COALESCE(r.tot_rent, 0) + COALESCE(r.tot_rent_m_fee, 0) + COALESCE(bd_sale.sale_income_etc, 0))
                * 12
              )
              - (COALESCE(bd_sale.sale_amount, 0) * COALESCE(bd_sale.sale_loan_ratio, 0) * COALESCE(bd_sale.sale_loan_rate, 0) / 10000)
            )
            / NULLIF(
                COALESCE(bd_sale.sale_amount, 0)
                - COALESCE(r.tot_deposit, 0)
                - (COALESCE(bd_sale.sale_amount, 0) * COALESCE(bd_sale.sale_loan_ratio, 0) / 100),
                0
              )
          ) * 100 AS sellProfit
        FROM bd_building AS bd
        LEFT JOIN (
          SELECT * FROM LatestSales WHERE rn = 1
        ) AS bd_sale
          ON bd.id = bd_sale.bd_building_id
        LEFT JOIN bd_building_image AS bd_img
          ON bd.id = bd_img.bd_building_id
        AND bd_img.image_type = 'BUILDING'
        AND bd_img.deleted_date IS NULL
        LEFT JOIN ValAgg AS va
          ON va.bd_sale_info_id = bd_sale.id
        LEFT JOIN RentAgg AS r
          ON r.bd_sale_info_id = bd_sale.id
        WHERE bd.bd_char LIKE ${char}
          AND bd_sale.deleted_date IS NULL
          AND bd_sale.sale_type = 'P'
        GROUP BY
          bd.id, bd.bd_name, bd.bd_addr, bd.bd_plat_area, bd.bd_total_area,
          buildValue,
          bd_sale.id, bd_sale.sale_amount, bd_sale.sale_loan_ratio, bd_sale.sale_loan_rate, bd_sale.sale_income_etc, bd_sale.memo,
          imagePath
        ORDER BY buildValue DESC
        LIMIT 5;`,
      );
      return bdsList;
    } catch (error) {
      console.error('Error getting building shop list:', error);
      throw error;
    }
  }

  static async isBookmarked(userId: string, bdsId: string): Promise<boolean> {
    try {
      const [rows] = await db.query(
        `SELECT 1 
         FROM bookmarked_bds
         WHERE user_id = ? AND bds_id = ? AND delete_yn = 'N'
         LIMIT 1`,
        [userId, bdsId]
      ) as any;

      return !!rows;
    } catch (err) {
      console.error('Error checking bookmarked:', err);
      throw err;
    }
  }

  static async addBookmark(userId: string, building: BdsSale, deleteYn: string) {
    try {
      const [rows] = await db.query(`SELECT 1 FROM bookmarked_bds WHERE user_id = ? AND bds_id = ? LIMIT 1`, [userId, building.idx])
      if(!!rows) {
        await db.query(
          `UPDATE bookmarked_bds SET sale_id = ?, image_path = ?, memo = ?, name = ?, addr = ?, plat_area = ?, total_area = ?, sale_amount = ?, sell_profit = ?, build_value = ?, delete_yn = ? WHERE user_id = ? AND bds_id = ?`,
          [building.saleId, building.imagePath, building.memo, building.name, building.addr, building.platArea, building.totalArea, building.saleAmount, building.sellProfit, building.buildValue, deleteYn, userId, building.idx]
        );
      } else{
        await db.query(
          `INSERT INTO bookmarked_bds (user_id, bds_id, sale_id, image_path, memo, name, addr, plat_area, total_area, sale_amount, sell_profit, build_value)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, building.idx, building.saleId, building.imagePath, building.memo, building.name, building.addr, building.platArea, building.totalArea, building.saleAmount, building.sellProfit, building.buildValue]
        );
      }
    } catch (err) {
      console.error('Error adding bookmark:', err);
      throw err;
    }
  }

  static async getTotalBookmarked(userId: string) {
    try {
      const countRows = await db.query(
        `SELECT COUNT(*) as total FROM bookmarked_bds WHERE user_id = ? AND delete_yn = 'N'`,
        [userId]
      );
      const total = (countRows as any)[0].total;
      return total;
    } catch (err) {
      console.error('Error getting total bookmarked:', err);
      throw err;
    }
  }

  static async getBookmarkList(userId: string, page: number, size: number) {
    try{
      const total = await this.getTotalBookmarked(userId);
      
      const result = await db.query(
        `SELECT bds_id as idx, sale_id as saleId, image_path as imagePath, memo, name, addr, plat_area as platArea, total_area as totalArea, sale_amount as saleAmount, sell_profit as sellProfit, build_value as buildValue
        FROM bookmarked_bds 
        WHERE user_id = ? AND delete_yn = 'N'
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [userId, size, (page - 1) * size]
      );

      return {total, result};
    } catch (err) {
      console.error('Error getting bookmark list:', err);
      throw err;
    }
  }


  static async addConsultRequest(userId: string, bd_id: string, name: string, phone: string, content: string) {
    try {
          await db.query(
          `INSERT INTO bds_consult_request (user_id, bd_id, name, phone, content)
            VALUES (?, ?, ?, ?, ?)`,
          [userId, bd_id, name, phone, content]
        );
    } catch (err) {
      console.error('Error adding bds consult request:', err);
      throw err;
    }
  }
}
