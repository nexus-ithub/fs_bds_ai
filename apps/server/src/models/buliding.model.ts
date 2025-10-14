import { db } from '../utils/database';
import { BuildingInfo, LandInfo } from '@repo/common';


export class BuildingModel {

  static async findBuildingListByJibun(options: {legDongCode?: string, jibun?: string, buildingIds?: string[]}): Promise<BuildingInfo[] | null> {
    try {
      let query = `
        SELECT 
          building.building_id AS id,
          building.building_name AS buildingName,
          building.dong_name AS dongName,
          building.main_usage_code_name AS mainUsageName,
          building.etc_usage AS etcUsageName,
          building.arch_area AS archArea,
          building.arch_land_ratio AS archLandRatio,
          building.total_floor_area AS totalFloorArea,
          building.floor_area_ratio AS floorAreaRatio,
          building.use_approval_date AS useApprovalDate
        FROM building_leg_headline AS building
      `;
      let params = [];
      if (options.buildingIds && options.buildingIds.length > 0) {
        query += ' WHERE building.building_id IN (' + options.buildingIds.map(() => '?').join(',') + ')';
        params.push(...options.buildingIds);
      } else if (options.legDongCode && options.jibun) {
        let jibunArray = options.jibun.split('-')
        let bun = jibunArray[0]
        let ji = jibunArray[1] || 0

        query += ` WHERE building.leg_dong_code_val = ? 
                    AND building.bun = LPAD(?, 4, 0) 
                    AND building.ji = LPAD(?, 4, 0) 
                  ORDER BY building.arch_area DESC`;
        params.push(options.legDongCode, Number(bun), Number(ji));
      } else {
        return []
      }

      
      // let jibunArray = jibun.split('-')
      
      // let bun = jibunArray[0]
      // let ji = jibunArray[1] || 0
      // let where = ''
      // if (jibunArray.length > 1){
      //   where = `where building.leg_dong_code_val = '${legDongCode}' and building.bun = LPAD(${jibunArray[0]}, 4, 0) and building.ji = LPAD(${jibunArray[1]}, 4, 0)`
      // }else{
      //   where = `where building.leg_dong_code_val = '${legDongCode}' and building.bun = LPAD(${jibunArray[0]}, 4, 0) and building.ji = LPAD(0, 4, 0)`
      // }
      // console.log(result);
     

      const result = await db.query<BuildingInfo>(query, params);

      return result || [];
    } catch (error) {
      console.error('Error finding land by lat and lng:', error);
      throw error;
    }
  }

  // static async findBuildingListByBuildingId(buildingId: string): Promise<BuildingInfo[] | null> {
  //   try {
  //     const result = await db.query<BuildingInfo>(
  //       `SELECT 
  //        building.building_id AS id,
  //        building.building_name AS buildingName,
  //        building.dong_name AS dongName,
  //        building.main_usage_code_name AS mainUsageName,
  //        building.etc_usage AS etcUsageName,
  //        building.arch_area AS archArea,
  //        building.arch_land_ratio AS archLandRatio,
  //        building.total_floor_area AS totalFloorArea,
  //        building.floor_area_ratio AS floorAreaRatio,
  //        building.use_approval_date AS useApprovalDate
  //       FROM building_leg_headline AS building WHERE building.building_id = ?`,
  //       [buildingId]
  //     )
  //     // console.log(result);
     

  //     return result || [];
  //   } catch (error) {
  //     console.error('Error finding land by lat and lng:', error);
  //     throw error;
  //   }
  // }

  // static async findLandInfo(legDongCode: string, jibun: string): Promise<LandInfo | null> {
    
  //   try {
  //     const [ji, bun] = jibun.split('-');
  //     const [users] = await db.query<LandInfo>(
  //       `SELECT 
  //         land_info.id AS id,
  //         land_info.area AS area,
  //         land_info.poss_div_name AS possDivName,
  //         land_info.poss_person_num AS possPersonNum,
  //         land_char.usage1_name AS usage1Name,
  //         land_char.usage2_name AS usage2Name,
  //         land_char.jimok_name AS jimokName,
  //         land_char.cur_use AS curUse,
  //         land_char.height AS height,
  //         land_char.road_contact AS roadContact,
  //         land_char.price AS price,
  //         land_char.shape AS shape,
  //         (
  //           SELECT CONCAT(
  //             '[',
  //             GROUP_CONCAT(
  //               JSON_OBJECT(
  //                 'usageName', land_usage.usage_name,
  //                 'usageCode', land_usage.usage_code,
  //                 'lawCode', usage_code.law_code,
  //                 'lawName', usage_code.law_name,
  //                 'conflict', land_usage.conflict
  //               )
  //             ),
  //             ']'
  //           )
  //           FROM fs_building.land_usage_info AS landUsage
  //           LEFT JOIN fs_building.land_usage_code AS usageCode 
  //             ON landUsage.usage_code = usageCode.code 
  //             OR landUsage.usage_name = usageCode.name
  //           WHERE landUsage.id = land_info.id
  //         ) AS usageList,
  //         jibun.sido_name AS sidoName,
  //         jibun.sigungu_name AS sigunguName,
  //         jibun.leg_eupmyeondong_name AS legEupmyeondongName,
  //         jibun.leg_li_name AS legLiName,
  //         road_info.road_name AS roadName,
  //         addr.is_underground AS isUnderground,
  //         addr.building_main_num AS buildingMainNum,
  //         addr.building_sub_num AS buildingSubNum,
  //         info.local_building_name AS localBuildingName,
  //         info.building_leg_name AS buildingLegName,
  //         info.is_apartment_house AS isApartmentHouse,
  //         road_width_info.road_width AS roadWidth
  //       FROM fs_building.land_info AS land_info
  //       LEFT JOIN fs_building.land_char_info AS land_char
  //         ON land_char.key = (
  //           SELECT c.key 
  //           FROM fs_building.land_char_info AS c 
  //           WHERE c.id = land_info.id 
  //           ORDER BY c.create_date DESC 
  //           LIMIT 1
  //         )
  //       LEFT JOIN fs_building.jibun_info AS jibun 
  //         ON jibun.leg_dong_code = ? 
  //         AND jibun.jibun_main_num = ? 
  //         AND jibun_sub_num = ?
  //       LEFT JOIN fs_building.address_info AS addr 
  //         ON addr.address_id = jibun.address_id
  //       LEFT JOIN fs_building.additional_info AS info 
  //         ON addr.address_id = info.address_id
  //       LEFT JOIN fs_building.road_code_info AS road_info 
  //         ON addr.road_name_code = road_info.road_name_code 
  //         AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num
  //       LEFT JOIN fs_building.road_width AS road_width_info 
  //         ON road_width_info.road_name = road_info.road_name
  //       WHERE land_info.leg_dong_code = ? 
  //         AND land_info.jibun = ?
  //       GROUP BY land_info.id`,
  //       [legDongCode, ji, bun, legDongCode, jibun]
  //     )
  //     return users[0] || null;
  //   } catch (error) {
  //     console.error('Error finding landInfo ', error);
  //     throw error; 
  //   }
  // }
 


}
