import { db } from '../utils/database';
import { LandInfo } from '@repo/common';


export class LandModel {

  static async findLandIdByLatLng(lat: number, lng: number): Promise<LandInfo | null> {
    try {
      const lands = await db.query<LandInfo>(
        `SELECT 
          land_info.id AS id,
          land_info.leg_dong_code as legDongCode,
          address_polygon.leg_dong_name as legDongName,
          address_polygon.jibun as jibun,
          land_info.area AS area,
          land_char.usage1_name AS usageName,
          land_char.jimok_name AS jimokName,
          land_char.cur_use AS curUse,
          land_char.road_contact AS roadContact,
          land_char.price AS price,
          jibun.sido_name AS sidoName,
          jibun.sigungu_name AS sigunguName,
          jibun.jibun_main_num AS jibunMainNum,
          jibun.jibun_sub_num AS jibunSubNum,
          jibun.leg_eupmyeondong_name AS legEupmyeondongName,
          jibun.leg_li_name AS legLiName,
          road_info.road_name AS roadName,
          addr.building_main_num AS buildingMainNum,
          addr.building_sub_num AS buildingSubNum,
          info.local_building_name AS localBuildingName,
          info.building_leg_name AS buildingLegName,
          CASE
            WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
            WHEN ld_latest.deal_date IS NULL 
                OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
              THEN bd_latest.deal_date
            ELSE ld_latest.deal_date
          END AS dealDate,
          CASE
            WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
            WHEN ld_latest.deal_date IS NULL 
                OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
              THEN bd_latest.price
            ELSE ld_latest.price
          END AS dealPrice,
          CASE
            WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
            WHEN ld_latest.deal_date IS NULL 
                OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
              THEN 'building'
            ELSE 'land'
          END AS dealType,          
          address_polygon.polygon
      FROM address_polygon AS address_polygon
      LEFT JOIN land_info AS land_info 
        ON address_polygon.id = land_info.id
      LEFT JOIN land_char_info AS land_char
        ON land_char.key = (
          SELECT c.key 
          FROM land_char_info AS c 
          WHERE c.id = land_info.id 
          ORDER BY c.create_date DESC 
          LIMIT 1
        )
      LEFT JOIN jibun_info AS jibun 
        ON jibun.leg_dong_code = address_polygon.leg_dong_code
        AND jibun.jibun_main_num = SUBSTRING_INDEX(address_polygon.jibun, '-', 1)
        AND jibun.jibun_sub_num = CASE 
                                 WHEN address_polygon.jibun LIKE '%-%' 
                                 THEN SUBSTRING_INDEX(address_polygon.jibun, '-', -1)
                                 ELSE '0'
                              END
      LEFT JOIN address_info AS addr 
        ON addr.address_id = jibun.address_id
      LEFT JOIN additional_info AS info 
        ON addr.address_id = info.address_id
      LEFT JOIN road_code_info AS road_info 
        ON addr.road_name_code = road_info.road_name_code 
        AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num        
      LEFT JOIN (
        SELECT id, deal_date, price
        FROM (
          SELECT 
            id,
            deal_date,
            price,
            ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
          FROM building_deal_list
        ) t
        WHERE t.rn = 1
      ) AS bd_latest
        ON bd_latest.id = land_info.id
      LEFT JOIN (
        SELECT id, deal_date, price
        FROM (
          SELECT 
            id,
            deal_date,
            price,
            ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
          FROM land_deal_list
        ) t
        WHERE t.rn = 1
      ) AS ld_latest
        ON ld_latest.id = land_info.id  
      WHERE ST_CONTAINS(address_polygon.polygon, GeomFromText('Point(? ?)'))
      GROUP BY address_polygon.id`,
        [lng, lat]
      )
      return lands[0] || null;
    } catch (error) {
      console.error('Error finding land by lat and lng:', error);
      throw error;
    }
  }

  static async findLandInfo(legDongCode: string, jibun: string): Promise<LandInfo | null> {
    
    try {
      const [ji, bun] = jibun.split('-');
      const [users] = await db.query<LandInfo>(
        `SELECT 
          land_info.id AS id,
          land_info.area AS area,
          land_info.poss_div_name AS possDivName,
          land_info.poss_person_num AS possPersonNum,
          land_char.usage1_name AS usage1Name,
          land_char.usage2_name AS usage2Name,
          land_char.jimok_name AS jimokName,
          land_char.cur_use AS curUse,
          land_char.height AS height,
          land_char.road_contact AS roadContact,
          land_char.price AS price,
          land_char.shape AS shape,
          (
            SELECT CONCAT(
              '[',
              GROUP_CONCAT(
                JSON_OBJECT(
                  'usageName', land_usage.usage_name,
                  'usageCode', land_usage.usage_code,
                  'lawCode', usage_code.law_code,
                  'lawName', usage_code.law_name,
                  'conflict', land_usage.conflict
                )
              ),
              ']'
            )
            FROM fs_building.land_usage_info AS landUsage
            LEFT JOIN fs_building.land_usage_code AS usageCode 
              ON landUsage.usage_code = usageCode.code 
              OR landUsage.usage_name = usageCode.name
            WHERE landUsage.id = land_info.id
          ) AS usageList,
          jibun.sido_name AS sidoName,
          jibun.sigungu_name AS sigunguName,
          jibun.leg_eupmyeondong_name AS legEupmyeondongName,
          jibun.leg_li_name AS legLiName,
          road_info.road_name AS roadName,
          addr.is_underground AS isUnderground,
          addr.building_main_num AS buildingMainNum,
          addr.building_sub_num AS buildingSubNum,
          info.local_building_name AS localBuildingName,
          info.building_leg_name AS buildingLegName,
          info.is_apartment_house AS isApartmentHouse,
          road_width_info.road_width AS roadWidth
        FROM fs_building.land_info AS land_info
        LEFT JOIN fs_building.land_char_info AS land_char
          ON land_char.key = (
            SELECT c.key 
            FROM fs_building.land_char_info AS c 
            WHERE c.id = land_info.id 
            ORDER BY c.create_date DESC 
            LIMIT 1
          )
        LEFT JOIN fs_building.jibun_info AS jibun 
          ON jibun.leg_dong_code = ? 
          AND jibun.jibun_main_num = ? 
          AND jibun_sub_num = ?
        LEFT JOIN fs_building.address_info AS addr 
          ON addr.address_id = jibun.address_id
        LEFT JOIN fs_building.additional_info AS info 
          ON addr.address_id = info.address_id
        LEFT JOIN fs_building.road_code_info AS road_info 
          ON addr.road_name_code = road_info.road_name_code 
          AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num
        LEFT JOIN fs_building.road_width AS road_width_info 
          ON road_width_info.road_name = road_info.road_name
        WHERE land_info.leg_dong_code = ? 
          AND land_info.jibun = ?
        GROUP BY land_info.id`,
        [legDongCode, ji, bun, legDongCode, jibun]
      )
      return users[0] || null;
    } catch (error) {
      console.error('Error finding landInfo ', error);
      throw error; 
    }
  }
 


}
