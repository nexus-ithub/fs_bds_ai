
import { bdsDb } from "../utils/bds-database";
import { BdsSale } from "@repo/common";


const IMAGE_HOST = 'http://admin.buildingshop.co.kr/';

export class BdsModel {

  static async getList(): Promise<BdsSale[]> {
    try {
      const bdsList = await bdsDb.query<BdsSale>(
        `WITH LatestSales AS (
          SELECT bs1.*,
                ROW_NUMBER() OVER (PARTITION BY bs1.bd_building_id ORDER BY bs1.update_at DESC, bs1.id DESC) AS rn
          FROM bd_sale_info bs1
          WHERE bs1.deleted_date IS NULL
          )
          SELECT
              bd.id AS idx,
              bd.bd_name as name,
              bd.bd_addr as addr,
              bd.bd_plat_area as platArea,
              bd.bd_total_area as totalArea,
              COALESCE(SUM(bd_val.value), 0) AS buildValue,  -- 실시간으로 value를 합산하여 buildValue 사용
                  bd_sale.id as saleId,
              bd_sale.sale_amount as saleAmount,
              bd_sale.sale_loan_ratio as saleLoanRatio,
              bd_sale.sale_loan_rate as saleLoanRate,
              bd_sale.sale_income_etc as saleIncomeEtc,
                  bd_sale.memo as memo,
              CASE
                  WHEN bd_img.image_path LIKE './%' THEN CONCAT('${IMAGE_HOST}', SUBSTRING(bd_img.image_path, 3))
                  ELSE CONCAT('${IMAGE_HOST}', bd_img.image_path)
              END AS imagePath
          FROM bd_building AS bd
          LEFT JOIN (
              SELECT *
              FROM LatestSales
              WHERE rn = 1  -- 가장 최근의 update_at 값을 가진 레코드만 선택
          ) AS bd_sale ON bd.id = bd_sale.bd_building_id
          LEFT JOIN bd_building_image AS bd_img
              ON bd.id = bd_img.bd_building_id
              AND bd_img.image_type = 'BUILDING'
              AND bd_img.deleted_date IS NULL
          LEFT JOIN bd_sale_valuation AS bd_val
              ON bd_sale.id = bd_val.bd_sale_info_id  -- bd_sale_info_id로 조인하여 value 값을 합산
          WHERE bd_char LIKE '1%'
                  and bd_sale.deleted_date is Null
                  and bd_sale.sale_type = 'P'
          GROUP BY bd.id, bd.bd_name, bd.bd_addr, bd.bd_plat_area, bd.bd_total_area, bd_sale.sale_amount,
                  bd_sale.sale_loan_ratio, bd_sale.sale_loan_rate, bd_sale.sale_income_etc, bd_sale.memo, imagePath
          ORDER BY buildValue DESC  -- 합산된 build_value 기준으로 정렬
          LIMIT 5`,
      );
      return bdsList;
    } catch (error) {
      console.error('Error getting building shop list:', error);
      throw error;
    }
  }
}
