
import { db } from '../utils/database';
import { BuildingInfo, ConsultRequest, EstimatedPrice, LandInfo, PolygonInfo } from '@repo/common';

const ESTIMATE_REFERENCE_DISTANCE = 300;
const ESTIMATE_REFERENCE_YEAR = 2;
const MAX_CHECK = 4;

export class LandModel {

  static async findFilteredPolygon(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number,
    startArea: number,
    endArea: number,   // -1 = upper bound off
    startFar: number,
    endFar: number,    // -1 = upper bound off
    startBdAge: number,
    endBdAge: number,  // -1 = upper bound off
    usages: string
  ): Promise<PolygonInfo[]> {
    console.log(
      'findFilteredPolygon',
      neLat, neLng, swLat, swLng, startArea, endArea, startFar, endFar, startBdAge, endBdAge, usages
    );

    // 동적 WHERE 구성
    const where: string[] = [];
    const params: any[] = [];

    // // 1) BBox
    // where.push(`ap.lat BETWEEN ? AND ?`);
    // params.push(swLat, neLat);
    // where.push(`ap.lng BETWEEN ? AND ?`);
    // params.push(swLng, neLng);
    where.push(`
      MBRIntersects(
        ap.polygon,
        ST_GeomFromText(
          CONCAT(
            'POLYGON((',
            ?, ' ', ?, ',',  -- swLng swLat
            ?, ' ', ?, ',',  -- neLng swLat
            ?, ' ', ?, ',',  -- neLng neLat
            ?, ' ', ?, ',',  -- swLng neLat
            ?, ' ', ?,       -- swLng swLat (닫기)
            '))'
          )
        )
      )
    `);
    params.push(swLng, swLat, neLng, swLat, neLng, neLat, swLng, neLat, swLng, swLat);    

    // 2) land_char_info 최신본 조인 (area, usage 필터는 lc에 걸림)
    // area: startArea ~ endArea(or no upper if -1)

    if(!(startArea === 0 && endArea === -1)){
      if (startArea != null && !Number.isNaN(startArea)) {
        where.push(`(lc.area IS NULL OR lc.area >= ?)`); // lc 없으면 면적필터 bypass (원하시면 STRICT로 바꿔도 됨)
        params.push(startArea);
      }
      if (endArea !== -1) {
        where.push(`(lc.area IS NULL OR lc.area <= ?)`); // 동일하게 널 bypass
        params.push(endArea);
      }
    }

    // 3) usage 필터
    if (usages && usages.length > 0) {
      console.log('usages', usages);
      // IN (?, ?, ...) 안전 바인딩
      where.push(`lc.usage1_name IN (${usages.split(',').map((usage) => `'${usage.trim()}'`).join(',')})`);
      // console.log('usages', usages.split(',').map((usage) => `"${usage.trim()}"`).join(','));
      // params.push(usages.split(',').map((usage) => `'${usage.trim()}'`).join(','));
    }

    // 4) FAR 필터 (EXISTS 서브쿼리)
    if(!(startFar === 0 && endFar === -1)){
      if ((startFar != null && !Number.isNaN(startFar)) || endFar !== -1) {
        const farConds: string[] = [];
        const farParams: any[] = [];

        if (startFar != null && !Number.isNaN(startFar)) {
          farConds.push(`blh.floor_area_ratio >= ?`);
          farParams.push(startFar);
        }
        if (endFar !== -1) {
          farConds.push(`blh.floor_area_ratio <= ?`);
          farParams.push(endFar);
        }

        // bun/ji pad: address jibun에서 추출
        where.push(
          `EXISTS (
            SELECT 1
            FROM building_leg_headline blh
            WHERE blh.leg_dong_code_val = ap.leg_dong_code
              AND blh.bun = LPAD(CAST(SUBSTRING_INDEX(ap.jibun,'-', 1) AS UNSIGNED), 4, '0')
              AND blh.ji  = LPAD(CAST(IF(LOCATE('-', ap.jibun) > 0, SUBSTRING_INDEX(ap.jibun,'-',-1), '0') AS UNSIGNED), 4, '0')
              ${farConds.length ? 'AND ' + farConds.join(' AND ') : ''}
          )`
        );
        params.push(...farParams);
      }      
    }

    // 5) 건물 노후(연식) 필터 (EXISTS 서브쿼리)
    if(!(startBdAge === 0 && endBdAge === -1)){
      if ((startBdAge != null && !Number.isNaN(startBdAge)) || endBdAge !== -1) {
        console.log('bd age filter', startBdAge, endBdAge);
        const ageConds: string[] = [];
        const ageParams: any[] = [];

        // age = 현재년도 - 사용승인(혹은 create_date) 년도
        // create_date 포맷 'YYYYMMDD'
        // TIMESTAMPDIFF(YEAR, date, CURDATE())
        if (startBdAge != null && !Number.isNaN(startBdAge)) {
          ageConds.push(`TIMESTAMPDIFF(
            YEAR,
            STR_TO_DATE(blh.use_approval_date, '%Y%m%d'),
            CURDATE()
          ) >= ?`);
          ageParams.push(startBdAge);
        }
        if (endBdAge !== -1) {
          ageConds.push(`TIMESTAMPDIFF(
            YEAR,
            STR_TO_DATE(blh.use_approval_date, '%Y%m%d'),
            CURDATE()
          ) <= ?`);
          ageParams.push(endBdAge);
        }

        where.push(
          `EXISTS (
            SELECT 1
            FROM building_leg_headline blh
            WHERE blh.leg_dong_code_val = ap.leg_dong_code
              AND blh.bun = LPAD(CAST(SUBSTRING_INDEX(ap.jibun,'-', 1) AS UNSIGNED), 4, '0')
              AND blh.ji  = LPAD(CAST(IF(LOCATE('-', ap.jibun) > 0, SUBSTRING_INDEX(ap.jibun,'-',-1), '0') AS UNSIGNED), 4, '0')
              AND blh.use_approval_date IS NOT NULL
              ${ageConds.length ? 'AND ' + ageConds.join(' AND ') : ''}
          )`
        );
        params.push(...ageParams);
      }
    }

    // 최종 SQL
    const sql = `
      /* 필터된 지번 polygon 조회 */
      WITH latest_land AS (
        SELECT lc1.*
        FROM land_char_info lc1
        JOIN (
          SELECT id, MAX(created_at) AS max_created
          FROM land_char_info
          GROUP BY id
        ) mx
          ON lc1.id = mx.id AND lc1.created_at = mx.max_created
      )
      SELECT
        ap.id                                        AS id,
        ap.leg_dong_code                             AS legDongCode,
        ap.leg_dong_name                             AS legDongName,
        ap.jibun                                     AS jibun,
        ap.lat                                       AS lat,
        ap.lng                                       AS lng,
        ap.polygon                                   AS polygon
      FROM address_polygon ap
      LEFT JOIN latest_land lc
        ON lc.id = ap.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    `;

    const polygons = await db.query<PolygonInfo>(sql, params);

    console.log('polygons', polygons.length);
  

    return polygons;
  }

  static async findPolygonWithSub(id : string, lat : number, lng: number): Promise<PolygonInfo[]>{

    
    let where = ''
    let params = []
    if(id){
      where = 'ap.id = ?'
      params.push(id)
    }else if(lat && lng){
      where = `ST_CONTAINS(ap.polygon, GeomFromText('Point(? ?)'))`
      params.push(lng, lat)
    }

   
    const polygon = await db.query<PolygonInfo>(
      `
        WITH
        /* 1) 기준 polygon 한 개 선택 */
        base AS (
          SELECT
              ap.id, ap.leg_dong_code, ap.jibun, li.div_code,
              LPAD(CAST(SUBSTRING_INDEX(ap.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
              LPAD(CAST(IF(LOCATE('-', ap.jibun) > 0, SUBSTRING_INDEX(ap.jibun,'-',-1), '0') AS UNSIGNED), 4, '0') AS ji_pad
          FROM address_polygon ap
          LEFT JOIN land_info li ON li.id = ap.id
          WHERE ${where}
          LIMIT 1
        ),
        cand_building_ids AS (
          SELECT blh.building_id
          FROM building_leg_headline blh
          JOIN base b
            ON blh.leg_dong_code_val = b.leg_dong_code
          AND blh.bun = b.bun_pad
          AND blh.ji  = b.ji_pad
          UNION
          SELECT bsa.building_id
          FROM building_sub_addr bsa
          JOIN base b
            ON bsa.sub_leg_dong_code_val = b.leg_dong_code
          AND bsa.sub_bun = b.bun_pad
          AND bsa.sub_ji  = b.ji_pad
        ),
        rows_main AS (
          SELECT blh.building_id, blh.leg_dong_code_val AS leg_code, blh.bun AS bun_pad, blh.ji AS ji_pad
          FROM building_leg_headline blh
          JOIN cand_building_ids c USING (building_id)
        ),
        rows_sub AS (
          SELECT bsa.building_id, bsa.sub_leg_dong_code_val AS leg_code, bsa.sub_bun AS bun_pad, bsa.sub_ji AS ji_pad
          FROM building_sub_addr bsa
          JOIN cand_building_ids c USING (building_id)
        ),
        /* 여기서 0패딩 제거 → 'bun-ji' 문자열(ji=0이면 하이픈 생략) */
        row_keys AS (
          SELECT
            building_id,
            leg_code,
            bun_pad,
            ji_pad,
            /* '123-45' 또는 '123' */
            CONCAT(
              CAST(bun_pad AS UNSIGNED),
              CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
                  THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
                  ELSE ''
              END
            ) AS jibun_norm
          FROM (
            SELECT * FROM rows_main
            UNION ALL
            SELECT * FROM rows_sub
          ) u
        ),
        /* 해당 키로 address_polygon을 직접 조인 → DISTINCT로 id만 수집 */
        related_ap_ids AS (
          SELECT DISTINCT ap.id AS ap_id
          FROM row_keys rk
          JOIN address_polygon ap
            ON ap.leg_dong_code = rk.leg_code
          AND ap.jibun         = rk.jibun_norm
          JOIN land_info li2
            ON li2.id = ap.id
          JOIN base b
            ON li2.div_code = b.div_code
        ),
        final_ids AS (              -- 비어 있으면 base.id 추가
          SELECT ap_id FROM related_ap_ids
          UNION ALL
          SELECT b.id
          FROM base b
          WHERE NOT EXISTS (SELECT 1 FROM related_ap_ids)
        )
        SELECT
          ap.id            AS id,
          ap.leg_dong_code AS legDongCode,
          ap.leg_dong_name AS legDongName,
          ap.jibun         AS jibun,
          ap.lat           AS lat,
          ap.lng           AS lng,
          ap.polygon       AS polygon,
          CASE WHEN ap.id = (SELECT id FROM base LIMIT 1) THEN 'Y' ELSE 'N' END AS current
        FROM address_polygon ap
        JOIN final_ids f ON f.ap_id = ap.id
        ORDER BY ap.id;
      `, params
    )

    // console.log(polygon)


    // console.log('polygon size ', polygon.length)
    return polygon
  }


  // static async findPolygonWithSub(id: string, lat: number, lng: number): Promise<PolygonInfo[]> {
  //   // where 절과 파라미터를 안전하게 구성
  //   let whereSql = '';
  //   const params: any[] = [];
  //   if (id) {
  //     whereSql = `ap.id = ?`;
  //     params.push(id);
  //   } else if (lat && lng) {
  //     // SRID를 사용하지 않는 경우(=0)라면 아래 그대로 사용
  //     // ST_GeomFromText( CONCAT('POINT(', ?, ' ', ?, ')') ) 형태로 안전하게 바인딩
  //     whereSql = `ST_Contains(ap.polygon, ST_GeomFromText(CONCAT('POINT(', ?, ' ', ?, ')')))`;
  //     params.push(lng, lat);
  //   } else {
  //     // 기준이 없으면 빈 배열 반환
  //     return [];
  //   }

  //   const sql = `
  //     WITH
  //     base AS (
  //       SELECT
  //         ap.id,
  //         ap.leg_dong_code,
  //         ap.jibun,
  //         LPAD(CAST(SUBSTRING_INDEX(ap.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
  //         LPAD(CAST(CASE WHEN LOCATE('-', ap.jibun) > 0
  //                       THEN SUBSTRING_INDEX(ap.jibun,'-',-1)
  //                       ELSE '0' END AS UNSIGNED), 4, '0') AS ji_pad
  //       FROM address_polygon ap
  //       WHERE ${whereSql}
  //       LIMIT 1
  //     ),
  //     cand_building_ids AS (
  //       SELECT blh.building_id
  //       FROM building_leg_headline blh
  //       JOIN base b
  //         ON blh.leg_dong_code_val = b.leg_dong_code
  //       AND blh.bun = b.bun_pad
  //       AND blh.ji  = b.ji_pad
  //       UNION
  //       SELECT bsa.building_id
  //       FROM building_sub_addr bsa
  //       JOIN base b
  //         ON bsa.sub_leg_dong_code_val = b.leg_dong_code
  //       AND bsa.sub_bun = b.bun_pad
  //       AND bsa.sub_ji  = b.ji_pad
  //     ),
  //     rows_main AS (
  //       SELECT blh.*
  //       FROM building_leg_headline blh
  //       JOIN cand_building_ids c USING (building_id)
  //     ),
  //     rows_sub AS (
  //       SELECT bsa.*
  //       FROM building_sub_addr bsa
  //       JOIN cand_building_ids c USING (building_id)
  //     ),
  //     row_keys AS (
  //       SELECT building_id, leg_dong_code_val AS leg_code, bun AS bun_pad, ji AS ji_pad
  //       FROM rows_main
  //       UNION ALL
  //       SELECT building_id, sub_leg_dong_code_val AS leg_code, sub_bun AS bun_pad, sub_ji AS ji_pad
  //       FROM rows_sub
  //     ),
  //     ap_keys AS (
  //       SELECT
  //         ap.*,
  //         LPAD(CAST(SUBSTRING_INDEX(ap.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
  //         LPAD(CAST(CASE WHEN LOCATE('-', ap.jibun) > 0
  //                       THEN SUBSTRING_INDEX(ap.jibun,'-',-1)
  //                       ELSE '0' END AS UNSIGNED), 4, '0') AS ji_pad
  //       FROM address_polygon ap
  //     ),
  //     /* 여기서 polygon ID만 고유하게 수집 */
  //     related_ap_ids AS (
  //       SELECT DISTINCT ap.id AS ap_id
  //       FROM base b
  //       JOIN row_keys rk               ON 1=1
  //       JOIN ap_keys ap
  //         ON ap.leg_dong_code = rk.leg_code
  //       AND ap.bun_pad       = rk.bun_pad
  //       AND ap.ji_pad        = rk.ji_pad
  //     )
  //     /* 최종: 고유 ap_id로만 address_polygon 다시 조회 (중복 제거) */
  //     SELECT
  //       ap.id                           AS id,
  //       ap.leg_dong_code                AS legDongCode,
  //       ap.leg_dong_name                AS legDongName,
  //       ap.jibun                        AS jibun,
  //       ap.lat                          AS lat,
  //       ap.lng                          AS lng,
  //       ap.polygon                      AS polygon
  //     FROM address_polygon ap
  //     JOIN related_ap_ids r ON r.ap_id = ap.id
  //     ORDER BY ap.id
  //   `;

  //   const rows = await db.query<PolygonInfo>(sql, params);
  //   return rows ?? [];
  // }  
  
  static async findPolygon(id: string, lat: number, lng: number): Promise<PolygonInfo | null> {

    let where = '';
    let params = [];
    if(id){
      where = 'address_polygon.id = ?';
      params.push(id);
    }else if(lat && lng){
      where = `ST_CONTAINS(address_polygon.polygon, GeomFromText('Point(${lng} ${lat})'))`;
      params.push(lng, lat);
    }

    try { 
      const polygon = await db.query<PolygonInfo>(
        `SELECT 
          address_polygon.id as id,
          address_polygon.leg_dong_code as legDongCode,
          address_polygon.leg_dong_name as legDongName,
          address_polygon.jibun as jibun,
          address_polygon.lat as lat,
          address_polygon.lng as lng,
          address_polygon.polygon
      FROM address_polygon AS address_polygon
      WHERE ${where}`,
        params
      )
      return polygon[0] || null;
    } catch (error) {
      console.error('Error finding polygon by lat and lng:', error);
      throw error;
    }
    
  }

  static async findLandById(ids: string[]): Promise<LandInfo[] | null>{
    try {
      // const lands = await db.query<LandInfo>(
      //   `SELECT 
      //     land_info.id AS id,
      //     land_info.leg_dong_code as legDongCode,
      //     land_info.leg_dong_name as legDongName,
      //     land_info.jibun as jibun,
      //     land_info.area AS area,
      //     land_char.usage1_name AS usageName,
      //     land_char.jimok_name AS jimokName,
      //     land_char.cur_use AS curUse,
      //     leg_land_usage_ratio.far,
      //     leg_land_usage_ratio.bcr,
      //     land_char.road_contact AS roadContact,
      //     land_char.price AS price,
      //     jibun.sido_name AS sidoName,
      //     jibun.sigungu_name AS sigunguName,
      //     jibun.jibun_main_num AS jibunMainNum,
      //     jibun.jibun_sub_num AS jibunSubNum,
      //     jibun.leg_eupmyeondong_name AS legEupmyeondongName,
      //     jibun.leg_li_name AS legLiName,
      //     road_info.road_name AS roadName,
      //     addr.building_main_num AS buildingMainNum,
      //     addr.building_sub_num AS buildingSubNum,
      //     info.local_building_name AS localBuildingName,
      //     info.building_leg_name AS buildingLegName,
      //     CASE
      //       WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
      //       WHEN ld_latest.deal_date IS NULL 
      //           OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
      //         THEN bd_latest.deal_date
      //       ELSE ld_latest.deal_date
      //     END AS dealDate,
      //     CASE
      //       WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
      //       WHEN ld_latest.deal_date IS NULL 
      //           OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
      //         THEN bd_latest.price
      //       ELSE ld_latest.price
      //     END AS dealPrice,
      //     CASE
      //       WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
      //       WHEN ld_latest.deal_date IS NULL 
      //           OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
      //         THEN 'building'
      //       ELSE 'land'
      //     END AS dealType
      // FROM land_info AS land_info
      // LEFT JOIN land_char_info AS land_char
      //   ON land_char.key = (
      //     SELECT c.key 
      //     FROM land_char_info AS c 
      //     WHERE c.id = land_info.id 
      //     ORDER BY c.create_date DESC 
      //     LIMIT 1
      //   )
      // LEFT JOIN leg_land_usage_ratio AS leg_land_usage_ratio
      //   ON land_char.usage1_name = leg_land_usage_ratio.name
      // LEFT JOIN jibun_info AS jibun 
      //   ON jibun.leg_dong_code = land_info.leg_dong_code
      //   AND jibun.jibun_main_num = SUBSTRING_INDEX(land_info.jibun, '-', 1)
      //   AND jibun.jibun_sub_num = CASE 
      //                            WHEN land_info.jibun LIKE '%-%' 
      //                            THEN SUBSTRING_INDEX(land_info.jibun, '-', -1)
      //                            ELSE '0'
      //                         END
      // LEFT JOIN address_info AS addr 
      //   ON addr.address_id = jibun.address_id
      // LEFT JOIN additional_info AS info 
      //   ON addr.address_id = info.address_id
      // LEFT JOIN road_code_info AS road_info 
      //   ON addr.road_name_code = road_info.road_name_code 
      //   AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num        
      // LEFT JOIN (
      //   SELECT id, deal_date, price
      //   FROM (
      //     SELECT 
      //       id,
      //       deal_date,
      //       price,
      //       ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
      //     FROM building_deal_list
      //   ) t
      //   WHERE t.rn = 1
      // ) AS bd_latest
      //   ON bd_latest.id = land_info.id
      // LEFT JOIN (
      //   SELECT id, deal_date, price
      //   FROM (
      //     SELECT 
      //       id,
      //       deal_date,
      //       price,
      //       ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
      //     FROM land_deal_list
      //   ) t
      //   WHERE t.rn = 1
      // ) AS ld_latest
      //   ON ld_latest.id = land_info.id  
      // WHERE land_info.id IN (?)
      // GROUP BY land_info.id`,
      //   [ids]
      // )

      const lands = await db.query<LandInfo>(
        `
          WITH
          /* 0) 다중 기준 필지 집합 */
          base AS (
            SELECT
                li.id,
                li.leg_dong_code,
                li.jibun,
                li.div_code,
                LPAD(CAST(SUBSTRING_INDEX(li.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
                LPAD(CAST(IF(LOCATE('-', li.jibun) > 0, SUBSTRING_INDEX(li.jibun,'-',-1), '0') AS UNSIGNED), 4, '0') AS ji_pad
            FROM land_info li
            WHERE li.id IN (?)
          ),
          /* 1) 기준 필지와 같은 지번을 가지는 모든 건물 id (메인/보조 주소) */
          cand_building_ids AS (
            SELECT b.id AS base_id, blh.building_id
            FROM building_leg_headline blh
            JOIN base b
              ON blh.leg_dong_code_val = b.leg_dong_code
            AND blh.bun = b.bun_pad
            AND blh.ji  = b.ji_pad
            UNION
            SELECT b.id AS base_id, bsa.building_id
            FROM building_sub_addr bsa
            JOIN base b
              ON bsa.sub_leg_dong_code_val = b.leg_dong_code
            AND bsa.sub_bun = b.bun_pad
            AND bsa.sub_ji  = b.ji_pad
          ),
          /* 2) 각 건물의 메인/보조 지번 키(0패딩 제거) */
          rows_main AS (
            SELECT c.base_id, blh.building_id, blh.leg_dong_code_val AS leg_code, blh.bun AS bun_pad, blh.ji AS ji_pad
            FROM building_leg_headline blh
            JOIN cand_building_ids c USING (building_id)
          ),
          rows_sub AS (
            SELECT c.base_id, bsa.building_id, bsa.sub_leg_dong_code_val AS leg_code, bsa.sub_bun AS bun_pad, bsa.sub_ji AS ji_pad
            FROM building_sub_addr bsa
            JOIN cand_building_ids c USING (building_id)
          ),
          row_keys AS (
            SELECT
              base_id,
              building_id,
              leg_code,
              bun_pad,
              ji_pad,
              CONCAT(
                CAST(bun_pad AS UNSIGNED),
                CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
                    THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
                    ELSE ''
                END
              ) AS jibun_norm
            FROM (
              SELECT * FROM rows_main
              UNION ALL
              SELECT * FROM rows_sub
            ) u
          ),

          /* 건축물 중복 제거 + 건축면적 합계/개수 산출용 집계 */
          bld_ids_dedup AS (
            SELECT base_id, building_id
            FROM rows_main
            UNION               /* ← DISTINCT by (base_id, building_id) */
            SELECT base_id, building_id
            FROM rows_sub
          ),
          blh_area AS (        /* building_id당 arch_area 대표값 (헤드라인 기준) */
            SELECT building_id, MAX(arch_area) AS arch_area
            FROM building_leg_headline
            GROUP BY building_id
          ),
          bld_arch_agg AS (    /* 기준(base_id)별 건물 개수/arch_area 합 */
            SELECT
              d.base_id,
              COUNT(ba.building_id) AS relBuildingCount,
              SUM(ba.arch_area) AS relArchAreaSum
            FROM bld_ids_dedup d
            LEFT JOIN blh_area ba USING (building_id)
            GROUP BY d.base_id
          ),
          max_far_usage AS (
            SELECT base_id, main_usage_code_name
            FROM (
              SELECT
                d.base_id,
                blh.main_usage_code_name,
                blh.floor_area_ratio,
                ROW_NUMBER() OVER (
                  PARTITION BY d.base_id
                  ORDER BY
                    /* NULL 용적률은 뒤로 밀기 */
                    CASE WHEN blh.floor_area_ratio IS NULL THEN 1 ELSE 0 END,
                    blh.floor_area_ratio DESC
                ) AS rn
              FROM bld_ids_dedup d
              JOIN building_leg_headline blh
                ON blh.building_id = d.building_id
            ) t
            WHERE t.rn = 1
          ),          
          /* 3) land_info 매칭 → 관련 필지 id 추출 */
          related_land_ids AS (
            SELECT DISTINCT rk.base_id, li2.id AS id
            FROM row_keys rk
            JOIN land_info li2
              ON li2.leg_dong_code = rk.leg_code
            AND li2.jibun         = rk.jibun_norm
            JOIN base b        ON b.id = rk.base_id AND li2.div_code = b.div_code
          ),
          /* 4) 기준 필지를 항상 포함 */
          final_ids AS (
            SELECT base_id, id FROM related_land_ids
            UNION
            SELECT id AS base_id, id FROM base
          ),
          /* 5) land_char_info 최신 1건(전역) */
          land_char_latest AS (
            SELECT c.*
            FROM land_char_info c
            JOIN (
              SELECT id, MAX(create_date) AS max_cd
              FROM land_char_info
              WHERE id IN (SELECT id FROM final_ids)   -- ← 범위를 final_ids로 한정
              GROUP BY id
            ) m
              ON m.id = c.id
            AND m.max_cd = c.create_date
          ),

          /* 6) 관련(+기준) 필지 집계*/
          rel_agg AS (
            SELECT
              f.base_id,
              SUM(li.area) AS relTotalArea,
              AVG(lc.price) AS relTotalPrice,
              COUNT(*) AS relParcelCount
            FROM final_ids f
            JOIN land_info li       ON li.id = f.id
            LEFT JOIN land_char_latest lc ON lc.id = li.id
            LEFT JOIN leg_land_usage_ratio llur
                  ON lc.usage1_name = llur.name
            GROUP BY f.base_id
          )

          SELECT 
            land_info.id AS id,
            land_info.leg_dong_code as legDongCode,
            land_info.leg_dong_name as legDongName,
            land_info.jibun as jibun,
            land_info.area AS area,
            land_char.usage1_name AS usageName,
            land_char.jimok_name AS jimokName,
            land_char.cur_use AS curUse,
            leg_land_usage_ratio.far,
            leg_land_usage_ratio.bcr,
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
            ra.relTotalArea        AS relTotalArea,
            ra.relTotalPrice       AS relTotalPrice,
            ra.relParcelCount      AS relParcelCount,
            baa.relArchAreaSum     AS relArchAreaSum,
            baa.relBuildingCount   AS relBuildingCount,
            mfu.main_usage_code_name AS relMainUsageName

          FROM land_info AS land_info
          LEFT JOIN land_char_info AS land_char
            ON land_char.key = (
              SELECT c.key 
              FROM land_char_info AS c 
              WHERE c.id = land_info.id 
              ORDER BY c.create_date DESC 
              LIMIT 1
            )
          LEFT JOIN leg_land_usage_ratio AS leg_land_usage_ratio
            ON land_char.usage1_name = leg_land_usage_ratio.name
          LEFT JOIN jibun_info AS jibun 
            ON jibun.leg_dong_code = land_info.leg_dong_code
            AND jibun.jibun_main_num = SUBSTRING_INDEX(land_info.jibun, '-', 1)
            AND jibun.jibun_sub_num = CASE 
                                    WHEN land_info.jibun LIKE '%-%' 
                                    THEN SUBSTRING_INDEX(land_info.jibun, '-', -1)
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

          /* ★ 기준 id별 집계 결과를 조인 */
          LEFT JOIN rel_agg ra
            ON ra.base_id = land_info.id

          /* ★ 기준 id별 건축면적 합계/건물개수 조인 */
          LEFT JOIN bld_arch_agg baa
            ON baa.base_id = land_info.id

          /* ★ 용적률 최대 주용도명 조인 */   
          LEFT JOIN max_far_usage mfu
            ON mfu.base_id = land_info.id

          WHERE land_info.id IN (?)
          GROUP BY land_info.id;
        `,
        [ids, ids]
      )

      console.log(lands)
      return lands || null;
    } catch (error) {
      console.error('Error finding land by lat and lng:', error);
      throw error;
    }
  }

  
  // static async findLandIdByLatLng(lat: number, lng: number): Promise<LandInfo | null> {
  //   try {
  //     const lands = await db.query<LandInfo>(
  //       `SELECT 
  //         land_info.id AS id,
  //         land_info.leg_dong_code as legDongCode,
  //         address_polygon.leg_dong_name as legDongName,
  //         address_polygon.jibun as jibun,
  //         land_info.area AS area,
  //         land_char.usage1_name AS usageName,
  //         land_char.jimok_name AS jimokName,
  //         land_char.cur_use AS curUse,
  //         leg_land_usage_ratio.far,
  //         leg_land_usage_ratio.bcr,
  //         land_char.road_contact AS roadContact,
  //         land_char.price AS price,
  //         jibun.sido_name AS sidoName,
  //         jibun.sigungu_name AS sigunguName,
  //         jibun.jibun_main_num AS jibunMainNum,
  //         jibun.jibun_sub_num AS jibunSubNum,
  //         jibun.leg_eupmyeondong_name AS legEupmyeondongName,
  //         jibun.leg_li_name AS legLiName,
  //         road_info.road_name AS roadName,
  //         addr.building_main_num AS buildingMainNum,
  //         addr.building_sub_num AS buildingSubNum,
  //         info.local_building_name AS localBuildingName,
  //         info.building_leg_name AS buildingLegName,
  //         CASE
  //           WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
  //           WHEN ld_latest.deal_date IS NULL 
  //               OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
  //             THEN bd_latest.deal_date
  //           ELSE ld_latest.deal_date
  //         END AS dealDate,
  //         CASE
  //           WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
  //           WHEN ld_latest.deal_date IS NULL 
  //               OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
  //             THEN bd_latest.price
  //           ELSE ld_latest.price
  //         END AS dealPrice,
  //         CASE
  //           WHEN bd_latest.deal_date IS NULL AND ld_latest.deal_date IS NULL THEN NULL
  //           WHEN ld_latest.deal_date IS NULL 
  //               OR (bd_latest.deal_date IS NOT NULL AND bd_latest.deal_date >= ld_latest.deal_date)
  //             THEN 'building'
  //           ELSE 'land'
  //         END AS dealType,          
  //         address_polygon.polygon
  //     FROM address_polygon AS address_polygon
  //     LEFT JOIN land_info AS land_info 
  //       ON address_polygon.id = land_info.id
  //     LEFT JOIN land_char_info AS land_char
  //       ON land_char.key = (
  //         SELECT c.key 
  //         FROM land_char_info AS c 
  //         WHERE c.id = land_info.id 
  //         ORDER BY c.create_date DESC 
  //         LIMIT 1
  //       )
  //     LEFT JOIN leg_land_usage_ratio AS leg_land_usage_ratio
  //       ON land_char.usage1_name = leg_land_usage_ratio.name
  //     LEFT JOIN jibun_info AS jibun 
  //       ON jibun.leg_dong_code = address_polygon.leg_dong_code
  //       AND jibun.jibun_main_num = SUBSTRING_INDEX(address_polygon.jibun, '-', 1)
  //       AND jibun.jibun_sub_num = CASE 
  //                                WHEN address_polygon.jibun LIKE '%-%' 
  //                                THEN SUBSTRING_INDEX(address_polygon.jibun, '-', -1)
  //                                ELSE '0'
  //                             END
  //     LEFT JOIN address_info AS addr 
  //       ON addr.address_id = jibun.address_id
  //     LEFT JOIN additional_info AS info 
  //       ON addr.address_id = info.address_id
  //     LEFT JOIN road_code_info AS road_info 
  //       ON addr.road_name_code = road_info.road_name_code 
  //       AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num        
  //     LEFT JOIN (
  //       SELECT id, deal_date, price
  //       FROM (
  //         SELECT 
  //           id,
  //           deal_date,
  //           price,
  //           ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
  //         FROM building_deal_list
  //       ) t
  //       WHERE t.rn = 1
  //     ) AS bd_latest
  //       ON bd_latest.id = land_info.id
  //     LEFT JOIN (
  //       SELECT id, deal_date, price
  //       FROM (
  //         SELECT 
  //           id,
  //           deal_date,
  //           price,
  //           ROW_NUMBER() OVER (PARTITION BY id ORDER BY deal_date DESC) AS rn
  //         FROM land_deal_list
  //       ) t
  //       WHERE t.rn = 1
  //     ) AS ld_latest
  //       ON ld_latest.id = land_info.id  
  //     WHERE ST_CONTAINS(address_polygon.polygon, GeomFromText('Point(? ?)'))
  //     GROUP BY address_polygon.id`,
  //       [lng, lat]
  //     )
  //     return lands[0] || null;
  //   } catch (error) {
  //     console.error('Error finding land by lat and lng:', error);
  //     throw error;
  //   }
  // }


  static async calculateEstimatedPrice(id: string): Promise<EstimatedPrice | null> {
   
    try {

      const lands = await db.query<any>(
        `
        WITH
        /* 0) 다중 기준 필지 집합 */
        base AS (
          SELECT
              li.id,
              li.leg_dong_code,
              li.jibun,
              li.div_code,
              LPAD(CAST(SUBSTRING_INDEX(li.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
              LPAD(CAST(IF(LOCATE('-', li.jibun) > 0, SUBSTRING_INDEX(li.jibun,'-',-1), '0') AS UNSIGNED), 4, '0') AS ji_pad
          FROM land_info li
          WHERE li.id = ?
        ),

        /* 1) 기준 필지와 같은 지번을 가지는 모든 건물 id (메인/보조 주소) */
        cand_building_ids AS (
          SELECT b.id AS base_id, blh.building_id
          FROM building_leg_headline blh
          JOIN base b
            ON blh.leg_dong_code_val = b.leg_dong_code
          AND blh.bun = b.bun_pad
          AND blh.ji  = b.ji_pad
          UNION
          SELECT b.id AS base_id, bsa.building_id
          FROM building_sub_addr bsa
          JOIN base b
            ON bsa.sub_leg_dong_code_val = b.leg_dong_code
          AND bsa.sub_bun = b.bun_pad
          AND bsa.sub_ji  = b.ji_pad
        ),

        /* 2) 각 건물의 메인/보조 지번 키(0패딩 제거) */
        rows_main AS (
          SELECT c.base_id, blh.building_id, blh.leg_dong_code_val AS leg_code, blh.bun AS bun_pad, blh.ji AS ji_pad
          FROM building_leg_headline blh
          JOIN cand_building_ids c USING (building_id)
        ),
        rows_sub AS (
          SELECT c.base_id, bsa.building_id, bsa.sub_leg_dong_code_val AS leg_code, bsa.sub_bun AS bun_pad, bsa.sub_ji AS ji_pad
          FROM building_sub_addr bsa
          JOIN cand_building_ids c USING (building_id)
        ),
        row_keys AS (
          SELECT
            base_id,
            building_id,
            leg_code,
            bun_pad,
            ji_pad,
            CONCAT(
              CAST(bun_pad AS UNSIGNED),
              CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
                  THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
                  ELSE ''
              END
            ) AS jibun_norm
          FROM (
            SELECT * FROM rows_main
            UNION ALL
            SELECT * FROM rows_sub
          ) u
        ),

        /* (신규) 대표필지 산출용: 메인 지번만으로 후보 land_id 추출 */
        main_row_keys AS (
          SELECT
            base_id,
            building_id,
            leg_code,
            bun_pad,
            ji_pad,
            CONCAT(
              CAST(bun_pad AS UNSIGNED),
              CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
                  THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
                  ELSE ''
              END
            ) AS jibun_norm
          FROM rows_main
        ),
        main_related_land_ids AS (   /* rows_main(메인 지번) 기준 land_info 매칭 */
          SELECT DISTINCT mrk.base_id, li2.id AS land_id
          FROM main_row_keys mrk
          JOIN land_info li2
            ON li2.leg_dong_code = mrk.leg_code
          AND li2.jibun         = mrk.jibun_norm
          JOIN base b
            ON b.id = mrk.base_id
          AND li2.div_code = b.div_code
        ),
        rep_land AS (                /* 기준(base_id)별 대표 land_id 하나 선택 */
          SELECT base_id, MIN(land_id) AS rep_land_id
          FROM main_related_land_ids
          GROUP BY base_id
        ),

        /* (신규) 건축물 중복 제거 + 건축면적 합계/개수 산출용 집계 */
        bld_ids_dedup AS (
          SELECT base_id, building_id
          FROM rows_main
          UNION
          SELECT base_id, building_id
          FROM rows_sub
        ),
        blh_area AS (
          SELECT building_id, MAX(arch_area) AS arch_area
          FROM building_leg_headline
          GROUP BY building_id
        ),
        bld_arch_agg AS (
          SELECT
            d.base_id,
            COUNT(ba.building_id) AS relBuildingCount,
            SUM(ba.arch_area)     AS relArchAreaSum
          FROM bld_ids_dedup d
          LEFT JOIN blh_area ba USING (building_id)
          GROUP BY d.base_id
        ),

        /* 3) land_info 매칭 → 관련 필지 id 추출 (메인/보조 모두) */
        related_land_ids AS (
          SELECT DISTINCT rk.base_id, li2.id AS id
          FROM row_keys rk
          JOIN land_info li2
            ON li2.leg_dong_code = rk.leg_code
          AND li2.jibun         = rk.jibun_norm
          JOIN base b
            ON b.id = rk.base_id
          AND li2.div_code = b.div_code
        ),

        /* 4) 기준 필지를 항상 포함 */
        final_ids AS (
          SELECT base_id, id FROM related_land_ids
          UNION
          SELECT id AS base_id, id FROM base
        ),

        /* 5) land_char_info 최신 1건(전역) */
        land_char_latest AS (
          SELECT c.*
          FROM land_char_info c
          JOIN (
            SELECT id, MAX(create_date) AS max_cd
            FROM land_char_info
            WHERE id IN (SELECT id FROM final_ids)
            GROUP BY id
          ) m
            ON m.id = c.id
          AND m.max_cd = c.create_date
        ),

        /* 6) 관련(+기준) 필지 집계 */
        rel_agg AS (
          SELECT
            f.base_id,
            SUM(li.area) AS relTotalArea,
            AVG(lc.price) AS relTotalPrice,
            COUNT(*) AS relParcelCount
          FROM final_ids f
          JOIN land_info li        ON li.id = f.id
          LEFT JOIN land_char_latest lc ON lc.id = li.id
          LEFT JOIN leg_land_usage_ratio llur
                ON lc.usage1_name = llur.name
          GROUP BY f.base_id
        )

        SELECT 
          land_info.id AS id,
          /* 집계 결과 */
          ra.relTotalArea        AS relTotalArea,
          ra.relTotalPrice       AS relTotalPrice,
          ra.relParcelCount      AS relParcelCount,
          baa.relArchAreaSum     AS relArchAreaSum,
          baa.relBuildingCount   AS relBuildingCount,

          /* (신규) 대표필지: 없으면 land_info.id 로 대체 */
          COALESCE(rl.rep_land_id, land_info.id) AS repLandId

        FROM land_info AS land_info
      
        /* 기준 id별 집계 결과 */
        LEFT JOIN rel_agg ra
          ON ra.base_id = land_info.id

        /* 기준 id별 건축면적 합계/건물개수 */
        LEFT JOIN bld_arch_agg baa
          ON baa.base_id = land_info.id

        /* (신규) 대표필지 조인 */
        LEFT JOIN rep_land rl
          ON rl.base_id = land_info.id

        WHERE land_info.id = ?
        GROUP BY land_info.id;
        `, [id, id]
      )
      
      console.log('land', lands)
      
      if (!lands || lands.length === 0) {
        return null;
      }
      const land = lands[0];

      let summary = null;
      let finalRatio = null;
      for(let i = 0; i < MAX_CHECK; i++) {
        const distance = ESTIMATE_REFERENCE_DISTANCE * (i + 1);
        const year = ESTIMATE_REFERENCE_YEAR + Math.min(i, 2);
        const checkUsage = (i !== (MAX_CHECK - 1));
  
        // const estimatedValues = await this.calcuateEstimatedPrice(id as string, distance, year, checkUsage);

        console.log('estimate ', distance, year, checkUsage)
        const results = await db.query<any>(`
          -- 조회할 대상 id
          WITH
          /* 0) 대상 필지 좌표 + 최신 공시지가(원/㎡) + 면적(㎡) */
          base AS (
            SELECT
              ap.id,
              ap.lat,
              ap.lng,
              x.usage1_name,
              ${land.relTotalPrice} AS official_price_per_m2,
              ${land.relTotalArea} AS area_m2
            FROM address_polygon ap
            JOIN (
              SELECT
                id,
                price,
                usage1_name,
                ROW_NUMBER() OVER (
                  PARTITION BY id
                  ORDER BY STR_TO_DATE(create_date, '%Y-%m-%d') DESC
                ) AS rn
              FROM land_char_info
              WHERE id = ?
            ) x
              ON x.id = ap.id AND x.rn = 1
            WHERE ap.id = ?
          ),
          
          /* 1) 반경 300m 내 최근 3년 건물 실거래 → 원/㎡ + 총액(원) + 면적 + 거리(m) */
          near_building AS (
            SELECT
              b.key,
              b.id,
              b.leg_dong_code,
              b.leg_dong_name,
              b.jibun,
              b.deal_date,
              b.usage_name,
              CAST(b.land_area AS DECIMAL(20,4)) AS area_m2,
              (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
              (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) / NULLIF(b.land_area, 0) AS deal_price_per_m2,
              ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) AS distance_m
            FROM building_deal_list b
            CROSS JOIN base
            WHERE b.position IS NOT NULL
              AND ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) <= ${distance}
              AND b.price IS NOT NULL AND b.price <> ''
              ${checkUsage ? 'AND b.usage_name = base.usage1_name' : ''}
              AND b.land_area IS NOT NULL AND b.land_area > 0
              AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${year} YEAR)
              AND (b.cancel_yn != 'O' OR b.cancel_yn IS NULL)
          ),
          
          /* 2) 반경 300m 내 최근 3년 토지 실거래 → 원/㎡ + 총액(원) + 면적 + 거리(m) */
          near_land AS (
            SELECT
              l.key,
              l.id,
              l.leg_dong_code,
              l.leg_dong_name,
              l.jibun,
              l.deal_date,
              l.usage_name,
              CAST(l.area AS DECIMAL(20,4)) AS area_m2,
              (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
              (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) / NULLIF(l.area, 0) AS deal_price_per_m2,
              ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) AS distance_m
            FROM land_deal_list l
            CROSS JOIN base
            WHERE l.position IS NOT NULL
              AND ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) <= ${distance}
              AND l.price IS NOT NULL AND l.price <> ''
              ${checkUsage ? 'AND l.usage_name = base.usage1_name' : ''}
              AND l.jimok != '도로' AND l.jimok != '구거'
              AND l.area IS NOT NULL AND l.area > 0
              AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${year} YEAR)
              AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
          ),
          /* 3) 거래필지 최신 공시지가(원/㎡) – 반경 내 필요한 키만 */
          near_keys AS (
            SELECT DISTINCT id FROM near_building
            UNION
            SELECT DISTINCT id FROM near_land
          ),
          latest_official_per_parcel AS (
            SELECT
              lci.id,
              lci.key,
              lci.leg_dong_code,
              lci.jibun,
              CAST(REPLACE(lci.price, ',', '') AS DECIMAL(20,2)) AS official_price_per_m2,
              ROW_NUMBER() OVER (
                PARTITION BY lci.leg_dong_code, lci.jibun
                ORDER BY STR_TO_DATE(lci.create_date, '%Y-%m-%d') DESC
              ) AS rn
            FROM land_char_info lci
            JOIN near_keys nk
              ON nk.id = lci.id
            WHERE lci.price IS NOT NULL AND lci.price <> ''
          ),
          
          /* 4) 건물/토지 거래 각각 공시지가 붙이기 + 총액(원) 계산 */
          building_with_official AS (
            SELECT
              lo.key,
              'building' AS deal_kind,
              nb.id, nb.leg_dong_code, nb.leg_dong_name, nb.jibun, nb.deal_date,
              nb.usage_name,
              nb.area_m2,
              nb.deal_total_price_won,
              nb.deal_price_per_m2,
              nb.distance_m,
              lo.official_price_per_m2,
              (lo.official_price_per_m2 * nb.area_m2) AS official_total_price_won,
              nb.deal_price_per_m2 / lo.official_price_per_m2 AS ratio_to_official,
              (nb.deal_price_per_m2 / lo.official_price_per_m2 - 1) * 100 AS premium_pct
            FROM near_building nb
            JOIN latest_official_per_parcel lo
              ON lo.id = nb.id
            AND lo.rn = 1
            WHERE lo.official_price_per_m2 > 0
          ),
          land_with_official AS (
            SELECT
              lo.key,
              'land' AS deal_kind,
              nl.id, nl.leg_dong_code, nl.leg_dong_name, nl.jibun, nl.deal_date,
              nl.usage_name,
              nl.area_m2,
              nl.deal_total_price_won,
              nl.deal_price_per_m2,
              nl.distance_m,
              lo.official_price_per_m2,
              (lo.official_price_per_m2 * nl.area_m2) AS official_total_price_won,
              nl.deal_price_per_m2 / lo.official_price_per_m2 AS ratio_to_official,
              (nl.deal_price_per_m2 / lo.official_price_per_m2 - 1) * 100 AS premium_pct
            FROM near_land nl
            JOIN latest_official_per_parcel lo
              ON lo.leg_dong_code = nl.leg_dong_code
            AND lo.jibun         = nl.jibun
            AND lo.rn = 1
            WHERE lo.official_price_per_m2 > 0
          ),
          
          /* 5) 통합 → 배수 상위 20건만 선별 */
          nearby_deals_raw AS (
            SELECT * FROM building_with_official
            UNION ALL
            SELECT * FROM land_with_official
          ),
          nearby_deals AS (
            SELECT *
            FROM nearby_deals_raw
            WHERE ratio_to_official IS NOT NULL
            ORDER BY ratio_to_official DESC
            LIMIT 20
          ),
          
          /* 6) 집계(상위 20건 기준) */
          agg AS (
            SELECT
              COUNT(*) AS deal_count,                -- 상위 20건(또는 그 이하) 개수
              AVG(ratio_to_official) AS avg_ratio_to_official,
              AVG(premium_pct) AS avg_premium_pct
            FROM nearby_deals
          )
          
          /* 7) 최종 출력: summary + (상위 20건) detail */
          SELECT
            'summary' AS row_type,
            base.id AS target_id,
            base.usage1_name,
            base.area_m2 AS target_area_m2,
            base.official_price_per_m2 AS target_official_price_per_m2,
            (base.official_price_per_m2 * base.area_m2) AS target_official_total_price_won,
            a.deal_count,
            a.avg_ratio_to_official,
            a.avg_premium_pct,
            CASE
              WHEN a.avg_ratio_to_official IS NOT NULL
                THEN ROUND(base.official_price_per_m2 * a.avg_ratio_to_official)
              ELSE base.official_price_per_m2
            END AS estimated_deal_price_per_m2,
            CASE
              WHEN a.avg_ratio_to_official IS NOT NULL
                THEN ROUND(base.area_m2 * base.official_price_per_m2 * a.avg_ratio_to_official)
              ELSE ROUND(base.area_m2 * base.official_price_per_m2)
            END AS estimated_deal_total_price_won,
            NULL AS ref_key,
            NULL AS deal_kind,
            NULL AS ref_id,
            NULL AS ref_leg_dong_code,
            NULL AS ref_leg_dong_name,
            NULL AS ref_jibun,
            NULL AS ref_date,
            NULL AS ref_usage_name,
            NULL AS ref_area_m2,
            NULL AS ref_deal_total_price_won,
            NULL AS ref_official_total_price_won,
            NULL AS ref_deal_price_per_m2,
            NULL AS ref_official_price_per_m2,
            NULL AS ref_ratio_to_official,
            NULL AS ref_premium_pct,
            NULL AS ref_distance_m
          FROM base
          LEFT JOIN agg a ON TRUE
          
          UNION ALL
          
          SELECT
            'detail' AS row_type,
            NULL AS target_id,
            NULL AS usage1_name,
            NULL AS target_area_m2,
            NULL AS target_official_price_per_m2,
            NULL AS target_official_total_price_won,
            NULL AS deal_count,
            NULL AS avg_ratio_to_official,
            NULL AS avg_premium_pct,
            NULL AS estimated_deal_price_per_m2,
            NULL AS estimated_deal_total_price_won,
            d.key AS ref_key,
            d.deal_kind,
            d.id AS ref_id,
            d.leg_dong_code AS ref_leg_dong_code,
            d.leg_dong_name AS ref_leg_dong_name,
            d.jibun AS ref_jibun,
            d.deal_date AS ref_date,
            d.usage_name AS ref_usage_name,
            d.area_m2 AS ref_area_m2,
            d.deal_total_price_won AS ref_deal_total_price_won,
            d.official_total_price_won AS ref_official_total_price_won,
            d.deal_price_per_m2 AS ref_deal_price_per_m2,
            d.official_price_per_m2 AS ref_official_price_per_m2,
            d.ratio_to_official AS ref_ratio_to_official,
            d.premium_pct AS ref_premium_pct,
            d.distance_m AS ref_distance_m
          FROM nearby_deals d;
              `, [land.repLandId, land.repLandId])  
        
        console.log('results', results);

        summary = results.filter(r => r.row_type === 'summary')[0]
        if(summary){
          if(summary.avg_ratio_to_official){
            finalRatio = summary.avg_ratio_to_official
            break;
          }
        }
      }
      
      let per = 3.0;
      let estimatedPrice = 0;
      if(finalRatio){
        let adjustFactor = 1
        if(finalRatio <= 1.8){
          adjustFactor = 1.5
        }else if(finalRatio <= 2.0){
          adjustFactor = 1.3
        }else if(finalRatio <= 2.3){
          adjustFactor = 1.25
        }else if(finalRatio <= 2.5){
          adjustFactor = 1.1
        }else if(finalRatio <= 3.0){
          adjustFactor = 1	
        }else if(finalRatio <= 3.5){
          adjustFactor = 0.9				
        }else if(finalRatio <= 4.0){
          adjustFactor = 0.8				
        }else{
          adjustFactor = 0.7
        }
        const adjusted = summary.avg_ratio_to_official * adjustFactor
        per = Math.floor(adjusted * 10) / 10;
        estimatedPrice = Math.floor(summary.target_official_price_per_m2 * per * summary.target_area_m2)
      }else{
        if(summary){
          estimatedPrice = summary.target_official_price_per_m2 * 3.0 * summary.target_area_m2;
          per = 3.0;
        }else{
          estimatedPrice = null;
          per = null
        }
      }        

      const result = {
        estimatedPrice,
        per,
      } as EstimatedPrice;

      return result;
      
    } catch (error) {
      
    }
  }


  static async calcuateEstimatedPrice(id: string, referenceDistance: number, referenceYear: number, checkUsage: boolean = true): Promise<any | null> {


    console.log('calculateEstimatedPrice start ', id, referenceDistance, referenceYear, checkUsage)


    try {
      const results = await db.query(`
        -- 조회할 대상 id
        WITH
        /* 0) 대상 필지 좌표 + 최신 공시지가(원/㎡) + 면적(㎡) */
        base AS (
          SELECT
            ap.id,
            ap.lat,
            ap.lng,
            x.usage1_name,
            CAST(REPLACE(x.price, ',', '') AS DECIMAL(20,2)) AS official_price_per_m2,
            x.area_m2
          FROM address_polygon ap
          JOIN (
            SELECT
              id,
              price,
              usage1_name,
              CAST(area AS DECIMAL(20,4)) AS area_m2,
              ROW_NUMBER() OVER (
                PARTITION BY id
                ORDER BY STR_TO_DATE(create_date, '%Y-%m-%d') DESC
              ) AS rn
            FROM land_char_info
            WHERE id = ?
          ) x
            ON x.id = ap.id AND x.rn = 1
          WHERE ap.id = ?
        ),
        
        /* 1) 반경 300m 내 최근 3년 건물 실거래 → 원/㎡ + 총액(원) + 면적 + 거리(m) */
        near_building AS (
          SELECT
            b.key,
            b.id,
            b.leg_dong_code,
            b.leg_dong_name,
            b.jibun,
            b.deal_date,
            b.usage_name,
            CAST(b.land_area AS DECIMAL(20,4)) AS area_m2,
            (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
            (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) / NULLIF(b.land_area, 0) AS deal_price_per_m2,
            ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) AS distance_m
          FROM building_deal_list b
          CROSS JOIN base
          WHERE b.position IS NOT NULL
            AND ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) <= ${referenceDistance}
            AND b.price IS NOT NULL AND b.price <> ''
            ${checkUsage ? 'AND b.usage_name = base.usage1_name' : ''}
            AND b.land_area IS NOT NULL AND b.land_area > 0
            AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${referenceYear} YEAR)
            AND (b.cancel_yn != 'O' OR b.cancel_yn IS NULL)
        ),
        
        /* 2) 반경 300m 내 최근 3년 토지 실거래 → 원/㎡ + 총액(원) + 면적 + 거리(m) */
        near_land AS (
          SELECT
            l.key,
            l.id,
            l.leg_dong_code,
            l.leg_dong_name,
            l.jibun,
            l.deal_date,
            l.usage_name,
            CAST(l.area AS DECIMAL(20,4)) AS area_m2,
            (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
            (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) / NULLIF(l.area, 0) AS deal_price_per_m2,
            ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) AS distance_m
          FROM land_deal_list l
          CROSS JOIN base
          WHERE l.position IS NOT NULL
            AND ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) <= ${referenceDistance}
            AND l.price IS NOT NULL AND l.price <> ''
            ${checkUsage ? 'AND l.usage_name = base.usage1_name' : ''}
            AND l.area IS NOT NULL AND l.area > 0
            AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${referenceYear} YEAR)
            AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
        ),
        /* 3) 거래필지 최신 공시지가(원/㎡) – 반경 내 필요한 키만 */
        near_keys AS (
          SELECT DISTINCT id FROM near_building
          UNION
          SELECT DISTINCT id FROM near_land
        ),
        latest_official_per_parcel AS (
          SELECT
            lci.id,
            lci.key,
            lci.leg_dong_code,
            lci.jibun,
            CAST(REPLACE(lci.price, ',', '') AS DECIMAL(20,2)) AS official_price_per_m2,
            ROW_NUMBER() OVER (
              PARTITION BY lci.leg_dong_code, lci.jibun
              ORDER BY STR_TO_DATE(lci.create_date, '%Y-%m-%d') DESC
            ) AS rn
          FROM land_char_info lci
          JOIN near_keys nk
            ON nk.id = lci.id
          WHERE lci.price IS NOT NULL AND lci.price <> ''
        ),
        
        /* 4) 건물/토지 거래 각각 공시지가 붙이기 + 총액(원) 계산 */
        building_with_official AS (
          SELECT
            lo.key,
            'building' AS deal_kind,
            nb.id, nb.leg_dong_code, nb.leg_dong_name, nb.jibun, nb.deal_date,
            nb.usage_name,
            nb.area_m2,
            nb.deal_total_price_won,
            nb.deal_price_per_m2,
            nb.distance_m,
            lo.official_price_per_m2,
            (lo.official_price_per_m2 * nb.area_m2) AS official_total_price_won,
            nb.deal_price_per_m2 / lo.official_price_per_m2 AS ratio_to_official,
            (nb.deal_price_per_m2 / lo.official_price_per_m2 - 1) * 100 AS premium_pct
          FROM near_building nb
          JOIN latest_official_per_parcel lo
            ON lo.id = nb.id
           AND lo.rn = 1
          WHERE lo.official_price_per_m2 > 0
        ),
        land_with_official AS (
          SELECT
            lo.key,
            'land' AS deal_kind,
            nl.id, nl.leg_dong_code, nl.leg_dong_name, nl.jibun, nl.deal_date,
            nl.usage_name,
            nl.area_m2,
            nl.deal_total_price_won,
            nl.deal_price_per_m2,
            nl.distance_m,
            lo.official_price_per_m2,
            (lo.official_price_per_m2 * nl.area_m2) AS official_total_price_won,
            nl.deal_price_per_m2 / lo.official_price_per_m2 AS ratio_to_official,
            (nl.deal_price_per_m2 / lo.official_price_per_m2 - 1) * 100 AS premium_pct
          FROM near_land nl
          JOIN latest_official_per_parcel lo
            ON lo.leg_dong_code = nl.leg_dong_code
           AND lo.jibun         = nl.jibun
           AND lo.rn = 1
          WHERE lo.official_price_per_m2 > 0
        ),
        
        /* 5) 통합 → 배수 상위 20건만 선별 */
        nearby_deals_raw AS (
          SELECT * FROM building_with_official
          UNION ALL
          SELECT * FROM land_with_official
        ),
        nearby_deals AS (
          SELECT *
          FROM nearby_deals_raw
          WHERE ratio_to_official IS NOT NULL
          ORDER BY ratio_to_official DESC
          LIMIT 20
        ),
        
        /* 6) 집계(상위 20건 기준) */
        agg AS (
          SELECT
            COUNT(*) AS deal_count,                -- 상위 20건(또는 그 이하) 개수
            AVG(ratio_to_official) AS avg_ratio_to_official,
            AVG(premium_pct) AS avg_premium_pct
          FROM nearby_deals
        )
        
        /* 7) 최종 출력: summary + (상위 20건) detail */
        SELECT
          'summary' AS row_type,
          base.id AS target_id,
          base.usage1_name,
          base.area_m2 AS target_area_m2,
          base.official_price_per_m2 AS target_official_price_per_m2,
          (base.official_price_per_m2 * base.area_m2) AS target_official_total_price_won,
          a.deal_count,
          a.avg_ratio_to_official,
          a.avg_premium_pct,
          CASE
            WHEN a.avg_ratio_to_official IS NOT NULL
              THEN ROUND(base.official_price_per_m2 * a.avg_ratio_to_official)
            ELSE base.official_price_per_m2
          END AS estimated_deal_price_per_m2,
          CASE
            WHEN a.avg_ratio_to_official IS NOT NULL
              THEN ROUND(base.area_m2 * base.official_price_per_m2 * a.avg_ratio_to_official)
            ELSE ROUND(base.area_m2 * base.official_price_per_m2)
          END AS estimated_deal_total_price_won,
          NULL AS ref_key,
          NULL AS deal_kind,
          NULL AS ref_id,
          NULL AS ref_leg_dong_code,
          NULL AS ref_leg_dong_name,
          NULL AS ref_jibun,
          NULL AS ref_date,
          NULL AS ref_usage_name,
          NULL AS ref_area_m2,
          NULL AS ref_deal_total_price_won,
          NULL AS ref_official_total_price_won,
          NULL AS ref_deal_price_per_m2,
          NULL AS ref_official_price_per_m2,
          NULL AS ref_ratio_to_official,
          NULL AS ref_premium_pct,
          NULL AS ref_distance_m
        FROM base
        LEFT JOIN agg a ON TRUE
        
        UNION ALL
        
        SELECT
          'detail' AS row_type,
          NULL AS target_id,
          NULL AS usage1_name,
          NULL AS target_area_m2,
          NULL AS target_official_price_per_m2,
          NULL AS target_official_total_price_won,
          NULL AS deal_count,
          NULL AS avg_ratio_to_official,
          NULL AS avg_premium_pct,
          NULL AS estimated_deal_price_per_m2,
          NULL AS estimated_deal_total_price_won,
          d.key AS ref_key,
          d.deal_kind,
          d.id AS ref_id,
          d.leg_dong_code AS ref_leg_dong_code,
          d.leg_dong_name AS ref_leg_dong_name,
          d.jibun AS ref_jibun,
          d.deal_date AS ref_date,
          d.usage_name AS ref_usage_name,
          d.area_m2 AS ref_area_m2,
          d.deal_total_price_won AS ref_deal_total_price_won,
          d.official_total_price_won AS ref_official_total_price_won,
          d.deal_price_per_m2 AS ref_deal_price_per_m2,
          d.official_price_per_m2 AS ref_official_price_per_m2,
          d.ratio_to_official AS ref_ratio_to_official,
          d.premium_pct AS ref_premium_pct,
          d.distance_m AS ref_distance_m
        FROM nearby_deals d;
            `, [id, id])


//       const results = await db.query(
//         `
//  WITH
// /* 0-1) 타깃 좌표 */
// base_ap AS (
//   SELECT ap.id, ap.lat, ap.lng
//   FROM address_polygon ap
//   WHERE ap.id = ?
//   LIMIT 1
// ),

// /* ---------- [타깃 id의 연관 필지 집계 준비] ---------- */
// /* T1) 타깃의 지번 패딩/구분 가져오기 */
// t_base_li AS (
//   SELECT
//     li.id, li.leg_dong_code, li.jibun, li.div_code,
//     LPAD(CAST(SUBSTRING_INDEX(li.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
//     LPAD(CAST(IF(LOCATE('-', li.jibun) > 0, SUBSTRING_INDEX(li.jibun,'-',-1), '0') AS UNSIGNED), 4, '0') AS ji_pad
//   FROM land_info li
//   WHERE li.id = ?
//   LIMIT 1
// ),
// /* T2) 타깃과 같은 지번(본/부) 연결로 얻은 건물 id */
// t_cand_building_ids AS (
//   SELECT blh.building_id, 'M' AS src
//   FROM building_leg_headline blh
//   JOIN t_base_li b
//     ON blh.leg_dong_code_val = b.leg_dong_code
//    AND blh.bun = b.bun_pad
//    AND blh.ji  = b.ji_pad
//   UNION
//   SELECT bsa.building_id, 'S' AS src
//   FROM building_sub_addr bsa
//   JOIN t_base_li b
//     ON bsa.sub_leg_dong_code_val = b.leg_dong_code
//    AND bsa.sub_bun = b.bun_pad
//    AND bsa.sub_ji  = b.ji_pad
// ),
// /* T3) 위 건물들이 점유/관련한 모든 지번(본/부) */
// t_rows_main AS (
//   SELECT c.building_id, blh.leg_dong_code_val AS leg_code, blh.bun AS bun_pad, blh.ji AS ji_pad
//   FROM building_leg_headline blh
//   JOIN t_cand_building_ids c USING (building_id)
// ),
// t_rows_sub AS (
//   SELECT c.building_id, bsa.sub_leg_dong_code_val AS leg_code, bsa.sub_bun AS bun_pad, bsa.sub_ji AS ji_pad
//   FROM building_sub_addr bsa
//   JOIN t_cand_building_ids c USING (building_id)
// ),

// /* (신규) t_rows_main만으로 base 후보 생성 */
// t_row_keys_main AS (
//   SELECT
//     rm.building_id,
//     rm.leg_code,
//     rm.bun_pad,
//     rm.ji_pad,
//     CONCAT(
//       CAST(rm.bun_pad AS UNSIGNED),
//       CASE WHEN CAST(rm.ji_pad AS UNSIGNED) > 0
//         THEN CONCAT('-', CAST(rm.ji_pad AS UNSIGNED))
//         ELSE ''
//       END
//     ) AS jibun_norm
//   FROM t_rows_main rm
// ),
// t_main_related_li_ids AS (
//   SELECT DISTINCT li2.id AS li_id
//   FROM t_row_keys_main rk
//   JOIN land_info li2
//     ON li2.leg_dong_code = rk.leg_code
//    AND li2.jibun         = rk.jibun_norm
//   JOIN t_base_li b
//     ON li2.div_code = b.div_code
// ),
// base_pick_main AS (
//   SELECT li_id AS id
//   FROM t_main_related_li_ids
//   LIMIT 1
// ),
// /* 최종 base id: 메인 연관 필지 없으면 base_ap.id로 폴백 */
// base_id AS (
//   SELECT COALESCE(bpm.id, bap.id) AS id
//   FROM base_ap bap
//   LEFT JOIN base_pick_main bpm ON TRUE
// ),

// /* T4) 정규 지번키 생성(메인+서브 모두) — 이후 연관 집계용 */
// t_row_keys AS (
//   SELECT
//     building_id,
//     leg_code,
//     bun_pad,
//     ji_pad,
//     CONCAT(
//       CAST(bun_pad AS UNSIGNED),
//       CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
//         THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
//         ELSE ''
//       END
//     ) AS jibun_norm
//   FROM (
//     SELECT * FROM t_rows_main
//     UNION ALL
//     SELECT * FROM t_rows_sub
//   ) u
// ),
// /* T5) land_info 매칭 -> 타깃의 연관 필지 id들(메인+서브) */
// t_related_li_ids AS (
//   SELECT DISTINCT li2.id AS li_id
//   FROM t_row_keys rk
//   JOIN land_info li2
//     ON li2.leg_dong_code = rk.leg_code
//    AND li2.jibun         = rk.jibun_norm
//   JOIN t_base_li b   ON li2.div_code = b.div_code
// ),
// /* T6) 타깃 포함 최종 id 집합 */
// t_final_ids AS (
//   SELECT li_id AS id FROM t_related_li_ids
//   UNION
//   SELECT id     FROM t_base_li
// ),

// /* land_char_info의 id별 최신 1건(전역) */
// land_char_latest AS (
//   SELECT c.*
//   FROM land_char_info c
//   JOIN (
//     SELECT id, MAX(create_date) AS max_cd
//     FROM land_char_info
//     GROUP BY id
//   ) m
//     ON m.id = c.id
//    AND m.max_cd = c.create_date
// ),

// /* T8) 타깃 연관 집계(면적 합, 공시지가 평균) */
// t_rel_agg AS (
//   SELECT
//     SUM(li.area) AS rel_total_area,
//     AVG(CAST(REPLACE(lc.price, ',', '') AS DECIMAL(20,2))) AS rel_official_price_per_m2
//   FROM t_final_ids f
//   JOIN land_info li       ON li.id = f.id
//   LEFT JOIN land_char_latest lc ON lc.id = li.id
// ),

// /* 최종 base: (우선) t_rows_main에서 뽑힌 연관필지 1개, (없으면) base_ap */
// base AS (
//   SELECT
//     bid.id,
//     ap.lat,
//     ap.lng,
//     lcl.usage1_name,  /* base의 용도 = 선택된 base_id의 최신 용도 */
//     tra.rel_official_price_per_m2 AS official_price_per_m2,
//     tra.rel_total_area            AS area_m2
//   FROM base_id bid
//   JOIN address_polygon ap
//     ON ap.id = bid.id
//   CROSS JOIN t_rel_agg tra
//   LEFT JOIN land_char_latest lcl
//     ON lcl.id = bid.id
// ),

// /* ---------- [반경 내 거래 수집] ---------- */
// /* 1) 반경 내 최근 N년 건물 거래 (총액만 계산; ㎡단가는 나중에 연관면적으로 나눔) */
// near_building AS (
//   SELECT
//     b.key,
//     b.id,
//     b.leg_dong_code,
//     b.leg_dong_name,
//     b.jibun,
//     b.deal_date,
//     b.usage_name,
//     CAST(b.land_area AS DECIMAL(20,4)) AS source_area_m2,
//     (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
//     ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) AS distance_m
//   FROM building_deal_list b
//   CROSS JOIN base
//   WHERE b.position IS NOT NULL
//     AND ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) <= ${referenceDistance}
//     AND b.price IS NOT NULL AND b.price <> ''
//     ${checkUsage ? 'AND b.usage_name = base.usage1_name' : ''}
//     AND b.land_area IS NOT NULL AND b.land_area > 0
//     AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${referenceYear} YEAR)
//     AND (b.cancel_yn != 'O' OR b.cancel_yn IS NULL)
// ),
// /* 2) 반경 내 최근 N년 토지 거래 */
// near_land AS (
//   SELECT
//     l.key,
//     l.id,
//     l.leg_dong_code,
//     l.leg_dong_name,
//     l.jibun,
//     l.deal_date,
//     l.usage_name,
//     CAST(l.area AS DECIMAL(20,4)) AS source_area_m2,
//     (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
//     ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) AS distance_m
//   FROM land_deal_list l
//   CROSS JOIN base
//   WHERE l.position IS NOT NULL
//     AND ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) <= ${referenceDistance}
//     AND l.price IS NOT NULL AND l.price <> ''
//     ${checkUsage ? 'AND l.usage_name = base.usage1_name' : ''}
//     AND l.area IS NOT NULL AND l.area > 0
//     AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${referenceYear} YEAR)
//     AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
// ),

// /* 3) 반경 내 거래에 등장한 필지 id 집합 */
// near_keys AS (
//   SELECT DISTINCT id FROM near_building
//   UNION
//   SELECT DISTINCT id FROM near_land
// ),

// /* ---------- [반경 내 각 거래필지 id별 “연관 필지 집계”를 일괄 계산] ---------- */
// s_base_li AS (
//   SELECT
//     li.id AS src_id, li.leg_dong_code, li.jibun, li.div_code,
//     LPAD(CAST(SUBSTRING_INDEX(li.jibun,'-', 1) AS UNSIGNED), 4, '0') AS bun_pad,
//     LPAD(CAST(IF(LOCATE('-', li.jibun) > 0, SUBSTRING_INDEX(li.jibun,'-',-1), '0') AS UNSIGNED), 4, '0') AS ji_pad
//   FROM land_info li
//   JOIN near_keys nk ON nk.id = li.id
// ),
// s_cand_building_ids AS (
//   SELECT blh.building_id, s.src_id
//   FROM building_leg_headline blh
//   JOIN s_base_li s
//     ON blh.leg_dong_code_val = s.leg_dong_code
//    AND blh.bun = s.bun_pad
//    AND blh.ji  = s.ji_pad
//   UNION
//   SELECT bsa.building_id, s.src_id
//   FROM building_sub_addr bsa
//   JOIN s_base_li s
//     ON bsa.sub_leg_dong_code_val = s.leg_dong_code
//    AND bsa.sub_bun = s.bun_pad
//    AND bsa.sub_ji  = s.ji_pad
// ),
// s_rows_main AS (
//   SELECT s.building_id, s.src_id, blh.leg_dong_code_val AS leg_code, blh.bun AS bun_pad, blh.ji AS ji_pad
//   FROM building_leg_headline blh
//   JOIN s_cand_building_ids s USING (building_id)
// ),
// s_rows_sub AS (
//   SELECT s.building_id, s.src_id, bsa.sub_leg_dong_code_val AS leg_code, bsa.sub_bun AS bun_pad, bsa.sub_ji AS ji_pad
//   FROM building_sub_addr bsa
//   JOIN s_cand_building_ids s USING (building_id)
// ),
// s_row_keys AS (
//   SELECT
//     src_id,
//     CONCAT(
//       CAST(bun_pad AS UNSIGNED),
//       CASE WHEN CAST(ji_pad AS UNSIGNED) > 0
//         THEN CONCAT('-', CAST(ji_pad AS UNSIGNED))
//         ELSE ''
//       END
//     ) AS jibun_norm,
//     leg_code
//   FROM (
//     SELECT src_id, leg_code, bun_pad, ji_pad FROM s_rows_main
//     UNION ALL
//     SELECT src_id, leg_code, bun_pad, ji_pad FROM s_rows_sub
//   ) u
// ),
// s_related_li_ids AS (
//   SELECT DISTINCT s.src_id, li2.id AS li_id
//   FROM s_row_keys s
//   JOIN land_info li2
//     ON li2.leg_dong_code = s.leg_code
//    AND li2.jibun         = s.jibun_norm
//   JOIN s_base_li b   ON b.src_id = s.src_id AND li2.div_code = b.div_code
// ),
// s_final_ids AS (
//   SELECT src_id, li_id AS id FROM s_related_li_ids
//   UNION
//   SELECT src_id, src_id AS id FROM s_base_li
// ),
// s_rel_agg AS (
//   SELECT
//     s.src_id,
//     SUM(li.area) AS rel_total_area,
//     AVG(CAST(REPLACE(lc.price, ',', '') AS DECIMAL(20,2))) AS rel_official_price_per_m2
//   FROM s_final_ids s
//   JOIN land_info li       ON li.id = s.id
//   LEFT JOIN land_char_latest lc ON lc.id = li.id
//   GROUP BY s.src_id
// ),

// /* ---------- [공시지가/면적을 연관 집계로 치환하여 지표 재계산] ---------- */
// building_with_official AS (
//   SELECT
//     nb.key,
//     'building' AS deal_kind,
//     nb.id, nb.leg_dong_code, nb.leg_dong_name, nb.jibun, nb.deal_date,
//     nb.usage_name,
//     sra.rel_total_area AS area_m2,
//     nb.deal_total_price_won,
//     (nb.deal_total_price_won / NULLIF(sra.rel_total_area, 0)) AS deal_price_per_m2,
//     nb.distance_m,
//     sra.rel_official_price_per_m2 AS official_price_per_m2,
//     (sra.rel_official_price_per_m2 * sra.rel_total_area) AS official_total_price_won,
//     (nb.deal_total_price_won / NULLIF(sra.rel_total_area, 0)) / NULLIF(sra.rel_official_price_per_m2, 0) AS ratio_to_official,
//     (((nb.deal_total_price_won / NULLIF(sra.rel_total_area, 0)) / NULLIF(sra.rel_official_price_per_m2, 0)) - 1) * 100 AS premium_pct
//   FROM near_building nb
//   JOIN s_rel_agg sra
//     ON sra.src_id = nb.id
//   WHERE sra.rel_official_price_per_m2 > 0
// ),
// land_with_official AS (
//   SELECT
//     nl.key,
//     'land' AS deal_kind,
//     nl.id, nl.leg_dong_code, nl.leg_dong_name, nl.jibun, nl.deal_date,
//     nl.usage_name,
//     sra.rel_total_area AS area_m2,
//     nl.deal_total_price_won,
//     (nl.deal_total_price_won / NULLIF(sra.rel_total_area, 0)) AS deal_price_per_m2,
//     nl.distance_m,
//     sra.rel_official_price_per_m2 AS official_price_per_m2,
//     (sra.rel_official_price_per_m2 * sra.rel_total_area) AS official_total_price_won,
//     (nl.deal_total_price_won / NULLIF(sra.rel_total_area, 0)) / NULLIF(sra.rel_official_price_per_m2, 0) AS ratio_to_official,
//     (((nl.deal_total_price_won / NULLIF(sra.rel_total_area, 0)) / NULLIF(sra.rel_official_price_per_m2, 0)) - 1) * 100 AS premium_pct
//   FROM near_land nl
//   JOIN s_rel_agg sra
//     ON sra.src_id = nl.id
//   WHERE sra.rel_official_price_per_m2 > 0
// ),

// /* 통합 후 상위 20건(배수 기준) */
// nearby_deals_raw AS (
//   SELECT * FROM building_with_official
//   UNION ALL
//   SELECT * FROM land_with_official
// ),
// nearby_deals AS (
//   SELECT *
//   FROM nearby_deals_raw
//   WHERE ratio_to_official IS NOT NULL
//   ORDER BY ratio_to_official DESC
//   LIMIT 20
// ),

// /* 집계 */
// agg AS (
//   SELECT
//     COUNT(*) AS deal_count,
//     AVG(ratio_to_official) AS avg_ratio_to_official,
//     AVG(premium_pct) AS avg_premium_pct
//   FROM nearby_deals
// )

// /* 최종 출력 */
// SELECT
//   'summary' AS row_type,
//   base.id AS target_id,
//   base.usage1_name,
//   base.area_m2 AS target_area_m2,
//   base.official_price_per_m2 AS target_official_price_per_m2,
//   (base.official_price_per_m2 * base.area_m2) AS target_official_total_price_won,
//   a.deal_count,
//   a.avg_ratio_to_official,
//   a.avg_premium_pct,
//   CASE
//     WHEN a.avg_ratio_to_official IS NOT NULL
//       THEN ROUND(base.official_price_per_m2 * a.avg_ratio_to_official)
//     ELSE base.official_price_per_m2
//   END AS estimated_deal_price_per_m2,
//   CASE
//     WHEN a.avg_ratio_to_official IS NOT NULL
//       THEN ROUND(base.area_m2 * base.official_price_per_m2 * a.avg_ratio_to_official)
//     ELSE ROUND(base.area_m2 * base.official_price_per_m2)
//   END AS estimated_deal_total_price_won,
//   NULL AS ref_key,
//   NULL AS deal_kind,
//   NULL AS ref_id,
//   NULL AS ref_leg_dong_code,
//   NULL AS ref_leg_dong_name,
//   NULL AS ref_jibun,
//   NULL AS ref_date,
//   NULL AS ref_usage_name,
//   NULL AS ref_area_m2,
//   NULL AS ref_deal_total_price_won,
//   NULL AS ref_official_total_price_won,
//   NULL AS ref_deal_price_per_m2,
//   NULL AS ref_official_price_per_m2,
//   NULL AS ref_ratio_to_official,
//   NULL AS ref_premium_pct,
//   NULL AS ref_distance_m
// FROM base
// LEFT JOIN agg a ON TRUE

// UNION ALL

// SELECT
//   'detail' AS row_type,
//   NULL AS target_id,
//   NULL AS usage1_name,
//   NULL AS target_area_m2,
//   NULL AS target_official_price_per_m2,
//   NULL AS target_official_total_price_won,
//   NULL AS deal_count,
//   NULL AS avg_ratio_to_official,
//   NULL AS avg_premium_pct,
//   NULL AS estimated_deal_price_per_m2,
//   NULL AS estimated_deal_total_price_won,
//   d.key AS ref_key,
//   d.deal_kind,
//   d.id AS ref_id,
//   d.leg_dong_code AS ref_leg_dong_code,
//   d.leg_dong_name AS ref_leg_dong_name,
//   d.jibun AS ref_jibun,
//   d.deal_date AS ref_date,
//   d.usage_name AS ref_usage_name,
//   d.area_m2 AS ref_area_m2,                          -- 연관 면적 합계
//   d.deal_total_price_won AS ref_deal_total_price_won,
//   d.official_total_price_won AS ref_official_total_price_won,
//   d.deal_price_per_m2 AS ref_deal_price_per_m2,      -- 총액 / 연관 면적
//   d.official_price_per_m2 AS ref_official_price_per_m2, -- 연관 평균 공시지가
//   d.ratio_to_official AS ref_ratio_to_official,
//   d.premium_pct AS ref_premium_pct,
//   d.distance_m AS ref_distance_m
// FROM nearby_deals d;

//         `
//       , [id, id, id])


        // console.log('calculateEstimatedPrice results', results);


        return results
    } catch (error) {
      console.error('Error calculating estimated price:', error);
      throw error;
    }
  }



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
 
  static async isBookmarked(userId: string, landId: string): Promise<boolean> {
    try {
      const [rows] = await db.query(
        `SELECT 1 
          FROM bookmarked_report
          WHERE user_id = ? AND land_id = ? AND delete_yn = 'N'
          LIMIT 1`,
        [userId, landId]
      ) as any;

      return !!rows;
    } catch (err) {
      console.error('Error checking bookmarked:', err);
      throw err;
    }
  }

  static async addBookmark(userId: string, landId: string, estimatedPrice: number, estimatedPricePer: number, deleteYn: string) {
    try {
      const [rows] = await db.query(`SELECT 1 FROM bookmarked_report WHERE user_id = ? AND land_id = ? LIMIT 1`, 
        [userId, landId])

      if(!!rows) {
        await db.query(
          `UPDATE bookmarked_report SET delete_yn = ?, estimated_price = ?, estimated_price_per = ? WHERE user_id = ? AND land_id = ?`,
          [deleteYn, estimatedPrice, estimatedPricePer, userId, landId]
        );
      } else{
        await db.query(
          `INSERT INTO bookmarked_report (user_id, land_id, estimated_price, estimated_price_per, delete_yn)
            VALUES (?, ?, ?, ?, ?)`,
          [userId, landId, estimatedPrice, estimatedPricePer, deleteYn]
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
        `SELECT COUNT(*) as total FROM bookmarked_report WHERE user_id = ? AND delete_yn = 'N'`,
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
      
      const response = await db.query(
        `SELECT br.land_id as landId, br.estimated_price as estimatedPrice, br.estimated_price_per as estimatedPricePer,
        ap.leg_dong_code as legDongCode, ap.leg_dong_name as legDongName, ap.jibun, ap.lat, ap.lng, ap.polygon 
        FROM bookmarked_report br 
        LEFT JOIN address_polygon ap ON br.land_id = ap.id
        WHERE br.user_id = ? AND br.delete_yn = 'N'
        ORDER BY br.created_at DESC
        LIMIT ? OFFSET ?`,
        [userId, size, (page - 1) * size]
      );
      return {total, response};
    } catch (err) {
      console.error('Error getting bookmark list:', err);
      throw err;
    }
  }

  static async addConsultRequest(userId: string, landId: string, content: string) {
    try {
          await db.query(
          `INSERT INTO consult_request (user_id, land_id, content)
            VALUES (?, ?, ?)`,
          [userId, landId, content]
        );
    } catch (err) {
      console.error('Error adding consult request:', err);
      throw err;
    }
  }

  static async getTotalConsultRequest() {
    try {
      const countRows = await db.query(
        `SELECT COUNT(*) as total FROM consult_request WHERE delete_yn = 'N'`,
        []
      );
      const total = (countRows as any)[0].total;
      return total;
    } catch (err) {
      console.error('Error getting total consult request:', err);
      throw err;
    }
  }

  static async getConsultRequestList(page: number, size: number) {
    try {
      const total = await this.getTotalConsultRequest();
      const response = await db.query<ConsultRequest>(
        `SELECT 
          cr.id as id,
          cr.land_id as landId,
          cr.content as content,
          cr.created_at as createdAt,
          cr.updated_at as updatedAt,
          cr.user_id as userId,
          JSON_OBJECT(
            'name', u.name,
            'email', u.email,
            'phone', u.phone
          ) as user,
          JSON_OBJECT(
            'id', l.id,
            'legDongCode', l.leg_dong_code,
            'legDongName', l.leg_dong_name,
            'jibun', l.jibun,
          ) as land
        FROM consult_request WHERE delete_yn = 'N' 
        LEFT JOIN user u ON cr.user_id = u.id
        LEFT JOIN address_polygon l ON cr.land_id = l.id
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?`,
        [size, (page - 1) * size]
      );
      return {total, response};
    } catch (err) {
      console.error('Error getting consult request list:', err);
      throw err;
    }
  }
}
