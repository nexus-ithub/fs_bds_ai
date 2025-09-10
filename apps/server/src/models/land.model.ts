import { db } from '../utils/database';
import type { LandInfo } from '@repo/common';


export class LandModel {
  // static async findLandInfoByLatLng(lat: string, lng: string): Promise<LandInfo | null> {
  //   try {
      
  //     return users[0] || null;
  //   } catch (error) {
  //     console.error('Error finding user by email:', error);
  //     throw error; 
  //   }
  // }ß

  static async findLandIdByLatLng(lat: number, lng: number): Promise<LandInfo | null> {
    try {
      // const lands = await db.query<LandInfo>(
      //   `SELECT 
      //     land_info.id AS id,
      //     land_info.area AS area,
      //     land_info.poss_div_name AS possDivName,
      //     land_info.poss_person_num AS possPersonNum,
      //     land_char.usage1_name AS usage1Name,
      //     land_char.usage2_name AS usage2Name,
      //     land_char.jimok_name AS jimokName,
      //     land_char.cur_use AS curUse,
      //     land_char.height AS height,
      //     land_char.road_contact AS roadContact,
      //     land_char.price AS price,
      //     land_char.shape AS shape,
      //     (
      //       SELECT CONCAT(
      //         '[',
      //         GROUP_CONCAT(
      //           JSON_OBJECT(
      //             'usageName', landUsage.usage_name,
      //             'usageCode', landUsage.usage_code,
      //             'lawCode', usageCode.law_code,
      //             'lawName', usageCode.law_name,
      //             'conflict', landUsage.conflict
      //           )
      //         ),
      //         ']'
      //       )
      //       FROM land_usage_info AS landUsage
      //       LEFT JOIN land_usage_code AS usageCode 
      //         ON landUsage.usage_code = usageCode.code 
      //         OR landUsage.usage_name = usageCode.name
      //       WHERE landUsage.id = land_info.id
      //     ) AS usageList,
      //     jibun.sido_name AS sidoName,
      //     jibun.sigungu_name AS sigunguName,
      //     jibun.leg_eupmyeondong_name AS legEupmyeondongName,
      //     jibun.leg_li_name AS legLiName,
      //     road_info.road_name AS roadName,
      //     addr.is_underground AS isUnderground,
      //     addr.building_main_num AS buildingMainNum,
      //     addr.building_sub_num AS buildingSubNum,
      //     info.local_building_name AS localBuildingName,
      //     info.building_leg_name AS buildingLegName,
      //     info.is_apartment_house AS isApartmentHouse,
      //     road_width_info.road_width AS roadWidth,
      //     address_polygon.polygon
      // FROM address_polygon AS address_polygon
      // LEFT JOIN land_info AS land_info 
      //   ON address_polygon.id = land_info.id
      // LEFT JOIN land_char_info AS land_char
      //   ON land_char.key = (
      //     SELECT c.key 
      //     FROM land_char_info AS c 
      //     WHERE c.id = land_info.id 
      //     ORDER BY c.create_date DESC 
      //     LIMIT 1
      //   )
      // LEFT JOIN jibun_info AS jibun 
      //   ON jibun.leg_dong_code = address_polygon.leg_dong_code
      //   AND jibun.jibun_main_num = SUBSTRING_INDEX(address_polygon.jibun, '-', 1)
      //   AND jibun.jibun_sub_num = SUBSTRING_INDEX(address_polygon.jibun, '-', -1)
      // LEFT JOIN address_info AS addr 
      //   ON addr.address_id = jibun.address_id
      // LEFT JOIN additional_info AS info 
      //   ON addr.address_id = info.address_id
      // LEFT JOIN road_code_info AS road_info 
      //   ON addr.road_name_code = road_info.road_name_code 
      //   AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num
      // LEFT JOIN road_width AS road_width_info 
      //   ON road_width_info.road_name = road_info.road_name
      // WHERE ST_CONTAINS(address_polygon.polygon, GeomFromText('Point(? ?)'))
      // GROUP BY address_polygon.id`,
      //   [lng, lat]
      // )
      const lands = await db.query<LandInfo>(
        `SELECT 
          land_info.id AS id,
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
      LEFT JOIN road_width AS road_width_info 
        ON road_width_info.road_name = road_info.road_name
      WHERE ST_CONTAINS(address_polygon.polygon, GeomFromText('Point(? ?)'))
      GROUP BY address_polygon.id`,
        [lng, lat]
      )
      console.log(lands);
      for (const land of lands) {
        if (!land.usageList) {
          continue;
        }
        const usageList = JSON.parse(land.usageList);
        land.usageList = usageList;
      }

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
