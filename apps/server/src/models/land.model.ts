
import { IS_DEVELOPMENT } from '../constants';
import { db } from '../utils/database';
import { BuildingInfo, ConsultRequest, DealInfo, EstimatedPrice, EstimatedPriceInfo, getUsageString, LandInfo, OverlappingUsageInfo, PolygonInfo, PolygonInfoWithRepairInfo, RefDealInfo, RentInfo, UsagePolygon } from '@repo/common';
import { AIReportModel, getBuildingAge, krwUnit } from './aireport.model';

const ESTIMATE_REFERENCE_DISTANCE = 300;
const ESTIMATE_REFERENCE_YEAR = 2;
const MAX_CHECK = 4;

const RENT_CANDIDATE_RADIUS = 1000;

export class LandModel {

  static async findRentInfo(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number): Promise<RentInfo[]> {
    console.log(
      'findRentInfo',
      neLat, neLng, swLat, swLng
    );

    const params: any[] = [];

    const where: string[] = [];
    where.push(`n.lat BETWEEN ? AND ?`);
    params.push(swLat, neLat);
    where.push(`n.lng BETWEEN ? AND ?`);
    params.push(swLng, neLng);


    const sql = `
      WITH ranked AS (
        SELECT
          n.atcl_no   AS atclNo,
          n.floor_info AS floorInfo,
          n.floor_type AS floorType,
          n.price      AS price,
          n.rent_price AS rentPrice,
          n.area       AS area,
          n.excl_area  AS exclArea,
          n.lat        AS lat,
          n.lng        AS lng,
          n.land_id    AS landId,
          n.updated_at AS updatedAt,
          n.created_at AS createdAt,
          lci.road_contact AS roadContact,
          ROW_NUMBER() OVER (
            PARTITION BY n.lat, n.lng, n.floor_info, n.area, n.excl_area
            ORDER BY n.price ASC, n.rent_price ASC, n.atcl_no ASC
          ) AS rn
        FROM naver_rent_info n
        LEFT JOIN (
          SELECT id, road_contact,
            ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) AS latest
          FROM land_char_info
        ) lci ON n.land_id = lci.id AND lci.latest = 1
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      )
      SELECT
        atclNo,
        floorInfo,
        floorType,
        price,
        rentPrice,
        area,
        exclArea,
        lat,
        lng,
        updatedAt,
        createdAt,
        roadContact
      FROM ranked
      WHERE rn = 1
    `;

    const results = await db.query<RentInfo>(sql, params);

    console.log('rent info list', results.length);

    return results;
  }

  static async findUsagePolygon(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number): Promise<UsagePolygon[]> {
    console.log(
      'findUsagePolygon',
      neLat, neLng, swLat, swLng
    );

    const params: any[] = [];

    const where: string[] = [];
    where.push(`
      MBRIntersects(
        lu.polygon,
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
    // where.push(`lu.usage_code IN ('UQA123')`);
    params.push(swLng, swLat, neLng, swLat, neLng, neLat, swLng, neLat, swLng, swLat);

    const sql = `
      SELECT
        lu.key as id,
        usage_code as usageCode,
        usage_name as usageName,
        polygon
      FROM land_usage_polygon lu
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    `;

    const polygons = await db.query<UsagePolygon>(sql, params);

    console.log('usage polygons', polygons);

    return polygons;
  }

  static async findBuildingRepairedPolygon(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number): Promise<PolygonInfoWithRepairInfo[]> {
    console.log(
      'findBuildingRepairedPolygon',
      neLat, neLng, swLat, swLng
    );

    const params: any[] = [];

    const where: string[] = [];
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

    const sql = `
      SELECT
        ap.id            AS id,
        ap.leg_dong_code AS legDongCode,
        ap.leg_dong_name AS legDongName,
        ap.jibun         AS jibun,
        ap.lat           AS lat,
        ap.lng           AS lng,
        ap.polygon       AS polygon,
        NULL             AS current,
        br.repair_div_code          AS repairDivCode,
        br.repair_div_code_name     AS repairDivName,
        br.repair_change_div_code   AS repairChangeDivCode,
        br.repair_change_div_code_name AS repairChangeDivName,
        br.create_date              AS repairCreateDate
      FROM address_polygon ap
      JOIN (
        SELECT
          leg_dong_code_val,
          bun,
          ji,
          repair_div_code,
          repair_div_code_name,
          repair_change_div_code,
          repair_change_div_code_name,
          create_date
        FROM (
          SELECT
            br.*, 
            ROW_NUMBER() OVER (
              PARTITION BY leg_dong_code_val, bun, ji
              ORDER BY create_date DESC
            ) AS rn
          FROM building_repair br
          WHERE br.repair_div_code = 13
        ) t
        WHERE t.rn = 1
      ) br
        ON br.leg_dong_code_val = ap.leg_dong_code
       AND br.bun = LPAD(CAST(SUBSTRING_INDEX(ap.jibun,'-', 1) AS UNSIGNED), 4, '0')
       AND br.ji  = LPAD(CAST(IF(LOCATE('-', ap.jibun) > 0, SUBSTRING_INDEX(ap.jibun,'-',-1), '0') AS UNSIGNED), 4, '0')
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    `;

    const polygons = await db.query<PolygonInfoWithRepairInfo>(sql, params);

    console.log('repaired polygons', polygons.length);

    return polygons;
  }

  static async getBcrFarByOverlappingUsage(landId: string) {
    console.log('getOverlappingUsageInfo', landId);
    const sql = `
      WITH
      t AS (
        SELECT
          ap.id,
          ap.polygon,
          ST_Area(ap.polygon) AS address_area,
          LEFT(ap.leg_dong_code, 5) AS sigungu_code5
        FROM address_polygon ap
        WHERE ap.id = ?
        LIMIT 1
      ),
      cand AS (
        SELECT
          lup.key,
          lup.shape_id,
          lup.usage_code,
          lup.usage_name,
          lup.polygon
        FROM land_usage_polygon lup
        JOIN t
          ON lup.sigungu_code = t.sigungu_code5
        AND MBRIntersects(lup.polygon, t.polygon)
      ),
      x AS (
        SELECT
          t.id AS address_id,
          t.address_area,
          c.key AS land_usage_key,
          c.shape_id,
          c.usage_code,
          c.usage_name,
          ST_Area(ST_Intersection(t.polygon, c.polygon)) AS inter_area
        FROM t
        JOIN cand c
          ON ST_Intersects(t.polygon, c.polygon)
      ),
      pct AS (
        SELECT
          address_id,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'usageCode', usage_code,
              'usageName', usage_name,
              'pctOfAddress', ROUND(100 * CAST(inter_area AS DECIMAL(20,4)) / NULLIF(CAST(address_area AS DECIMAL(20,4)), 0), 6) / 100
            )
            /* MySQL은 ORDER BY를 JSON_ARRAYAGG 안에 직접 못 넣는 경우가 있어,
              아래처럼 pct CTE에서 먼저 정렬된 x를 만들거나, MariaDB 지원 여부에 따라 조정 */
          ) AS usagePctList
        FROM x
        WHERE inter_area > 0
        GROUP BY address_id
      )
      SELECT
        t.id AS id,
        (SELECT area FROM land_info WHERE id = t.id) AS area,
        leg_land_usage_ratio.far AS far,
        leg_land_usage_ratio.bcr AS bcr,
        COALESCE(pct.usagePctList, JSON_ARRAY()) AS usagePctList,
        (
          SELECT
            COALESCE(
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'usageName', lu.usage_name,
                  'usageCode', lu.usage_code,
                  'lawCode', uc.law_code,
                  'lawName', uc.law_name,
                  'far', leg_land_usage_ratio.far,
                  'bcr', leg_land_usage_ratio.bcr,
                  'conflict', lu.conflict
                )
              ),
              JSON_ARRAY()
            )
          FROM fs_bds.land_usage_info AS lu
          LEFT JOIN fs_bds.land_usage_code AS uc
            ON lu.usage_code = uc.code OR lu.usage_name = uc.name AND uc.law_name like '%국토의 계획 및 이용에 관한 법률%' 
          LEFT JOIN fs_bds.leg_land_usage_ratio AS leg_land_usage_ratio
            ON leg_land_usage_ratio.name = lu.usage_name                  
          WHERE lu.id = t.id AND lu.conflict = '저촉'
        ) AS usageList
      FROM t
      LEFT JOIN pct ON pct.address_id = t.id
      LEFT JOIN fs_bds.land_char_info AS land_char
        ON land_char.key = (
          SELECT c.key 
          FROM fs_bds.land_char_info AS c 
          WHERE c.id = t.id 
          ORDER BY c.create_date DESC 
          LIMIT 1
        )
      LEFT JOIN fs_bds.leg_land_usage_ratio AS leg_land_usage_ratio
        ON land_char.usage1_name = leg_land_usage_ratio.name      
    `;

    try {
      const result = await db.query<any>(sql, [landId]);
      const area = result[0].area;
      const usagePctList = JSON.parse(result[0].usagePctList as any);
      const usageList = JSON.parse(result[0].usageList as any).filter((u: any) => u.conflict === '저촉' && u.lawName && u.lawName.includes("국토의 계획 및 이용에 관한 법률"));

      let finalBcr = result[0].bcr;
      let finalFar = result[0].far;

      console.log('getBcrFarByOverlappingUsage area', area);
      console.log('getBcrFarByOverlappingUsage usagePctList', usagePctList);
      console.log('getBcrFarByOverlappingUsage usageList', usageList);
      let remainingArea = area;

      if (usageList.length > 0) {
        const area = result[0].area;
        for (const usage of usageList) {
          const bcr = usage.bcr;
          const far = usage.far;
          if (bcr > 0 && far > 0) {
            const pct = usagePctList.find((u: any) => u.usageCode === usage.usageCode)?.pctOfAddress;
            if (pct) {
              usage.weightedArea = area * Math.round(pct * 10) / 10;
              remainingArea -= usage.weightedArea;
            }
          }
        }
        const nullWeightedAreaCount = usageList.filter((u: any) => u.weightedArea == null).length;

        if (nullWeightedAreaCount > 0) {
          const areaPerNull = remainingArea / nullWeightedAreaCount;
          for (const usage of usageList) {
            if (usage.weightedArea == null) {
              usage.weightedArea = areaPerNull;
            }
          }
        }

        console.log('getBcrFarByOverlappingUsage usageList', usageList);

        finalBcr = usageList.reduce((acc, usage) => acc + (usage.weightedArea / area) * usage.bcr, 0);
        finalFar = usageList.reduce((acc, usage) => acc + (usage.weightedArea / area) * usage.far, 0);

        console.log('getBcrFarByOverlappingUsage finalBcr', finalBcr);
        console.log('getBcrFarByOverlappingUsage finalFar', finalFar);
      }

      return {
        area,
        bcr: finalBcr,
        far: finalFar
      };
    } catch (error) {
      console.error('Error in getBcrFarByOverlappingUsage for landId:', landId, error);
      throw error;
    }
  }

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

    if (!(startArea === 0 && endArea === -1)) {
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
    if (!(startFar === 0 && endFar === -1)) {
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
    if (!(startBdAge === 0 && endBdAge === -1)) {
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

  static async findPolygonWithSub(id: string, lat: number, lng: number): Promise<PolygonInfo[]> {


    let where = ''
    let params = []
    if (id) {
      where = 'ap.id = ?'
      params.push(id)
    } else if (lat && lng) {
      where = `ST_CONTAINS(ap.polygon, POINT(?, ?))`
      params.push(lng, lat, lng, lat)
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


  static async findPolygon(id: string, lat: number, lng: number): Promise<PolygonInfo | null> {

    let where = '';
    let params = [];
    if (id) {
      where = 'address_polygon.id = ?';
      params.push(id);
    } else if (lat && lng) {
      where = `ST_CONTAINS(address_polygon.polygon, POINT(${lng}, ${lat}))`;
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

  static async findLandById(ids: string[]): Promise<LandInfo[] | null> {
    try {

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
            SELECT building_id, MAX(arch_area) AS arch_area, MAX(total_floor_area) AS floor_area
            FROM building_leg_headline
            GROUP BY building_id
          ),
          bld_arch_agg AS (    /* 기준(base_id)별 건물 개수/arch_area 합 */
            SELECT
              d.base_id,
              COUNT(ba.building_id) AS relBuildingCount,
              SUM(ba.arch_area) AS relArchAreaSum,
              SUM(ba.floor_area) AS relFloorAreaSum
            FROM bld_ids_dedup d
            LEFT JOIN blh_area ba USING (building_id)
            GROUP BY d.base_id
          ),
          max_far_usage AS (
            SELECT base_id, main_usage_code_name, use_approval_date, gnd_floor_number, base_floor_number
            FROM (
              SELECT
                d.base_id,
                blh.main_usage_code_name,
                blh.use_approval_date,
                blh.gnd_floor_number,
                blh.base_floor_number,
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
						( SELECT CONCAT('[' , GROUP_CONCAT(JSON_OBJECT(
								'usageName', land_usage.usage_name,
								'usageCode', land_usage.usage_code,
								'lawCode', usage_code.law_code,
								'lawName', usage_code.law_name,
								'conflict', land_usage.conflict
								)), ']') FROM fs_bds.land_usage_info as land_usage
                LEFT JOIN fs_bds.land_usage_code as usage_code on land_usage.usage_code = usage_code.code or land_usage.usage_name = usage_code.name
                where land_usage.id = land_info.id
						) as usageList,            
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
            baa.relFloorAreaSum    AS relFloorAreaSum,
            baa.relBuildingCount   AS relBuildingCount,
            mfu.main_usage_code_name AS relMainUsageName,
            mfu.use_approval_date AS relUseApprovalDate,
            mfu.gnd_floor_number AS relGndFloorNumber,
            mfu.base_floor_number AS relBaseFloorNumber
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
              WHERE (price / land_area) >= 200
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

      for (const land of lands) {
        if (land.usageList) {
          try {
            land.usageList = JSON.parse(land.usageList as any);
          } catch (e) {
            land.usageList = [];
          }
        }
      }

      console.log(lands)
      return lands || null;
    } catch (error) {
      console.error('Error finding land by lat and lng:', error);
      throw error;
    }
  }

  static async findLatestDealInfo(id: string): Promise<DealInfo | null> {
    console.log('findLatestDealInfo id', id);
    try {
      const dealList = await db.query<DealInfo>(
        `
        SELECT
          ? AS id,
          CASE
              WHEN bd.deal_date IS NULL AND ld.deal_date IS NULL THEN NULL
              WHEN ld.deal_date IS NULL 
                  OR (bd.deal_date IS NOT NULL AND bd.deal_date >= ld.deal_date)
                THEN bd.deal_date
              ELSE ld.deal_date
          END AS dealDate,
          CASE
              WHEN bd.deal_date IS NULL AND ld.deal_date IS NULL THEN NULL
              WHEN ld.deal_date IS NULL 
                  OR (bd.deal_date IS NOT NULL AND bd.deal_date >= ld.deal_date)
                THEN bd.price
              ELSE ld.price
          END AS dealPrice,
          CASE
              WHEN bd.deal_date IS NULL AND ld.deal_date IS NULL THEN NULL
              WHEN ld.deal_date IS NULL 
                  OR (bd.deal_date IS NOT NULL AND bd.deal_date >= ld.deal_date)
                THEN 'building'
              ELSE 'land'
          END AS dealType
        FROM
          (SELECT 1 AS dummy) d
          LEFT JOIN (
            SELECT deal_date, price
            FROM building_deal_list
            WHERE id = ?
            AND (price / land_area) >= 200
            ORDER BY deal_date DESC
            LIMIT 1
          ) AS bd ON 1=1
          LEFT JOIN (
            SELECT deal_date, price
            FROM land_deal_list
            WHERE id = ?
            ORDER BY deal_date DESC
            LIMIT 1
          ) AS ld ON 1=1
        `,
        [id, id, id]
      )

      console.log('dealList', dealList);
      if (dealList[0].dealDate) {
        return dealList[0];
      }
      return null;
    } catch (error) {
      console.error('Error finding deal list by id:', error);
      throw error;
    }
  }

  static async calculatePublicPriceGrowthRate(id: string): Promise<number | null> {
    try {
      const changeRates = await db.query<any>(
        `WITH yearly_price AS (
            -- 1) 연도별 평균 price 계산
            SELECT
                CAST(year AS INT) AS y,
                AVG(CAST(price AS DECIMAL(15,0))) AS avg_price
            FROM
                individual_announced_price
            WHERE
                id = ?
                AND year IS NOT NULL
                AND CAST(year AS INT) BETWEEN YEAR(CURDATE()) - 4 AND YEAR(CURDATE())  -- 최근 5년
            GROUP BY
                CAST(year AS INT)
        ),
        yearly_with_prev AS (
            -- 2) 전년도 가격 붙이기 (윈도우 함수 사용)
            SELECT
                y,
                avg_price,
                LAG(avg_price) OVER (ORDER BY y) AS prev_price
            FROM
                yearly_price
        )
        -- 3) 전년 대비 상승률의 평균 계산
        SELECT
            AVG( (avg_price - prev_price) / prev_price ) AS avg_growth_rate_pct
        FROM
            yearly_with_prev
        WHERE
            prev_price IS NOT NULL; 
        `,
        [id]
      )
      if (changeRates[0]?.avg_growth_rate_pct) {
        return Number(changeRates[0]?.avg_growth_rate_pct);
      }
      return null;
    } catch (error) {
      console.error('Error finding change rate by id:', error);
      throw error;
    }
  }

  static async getPublicPriceDifference(id: string, year: number): Promise<number | null> {
    try {
      const result = await db.query<any>(
        `WITH latest AS (
            SELECT 
                id,
                year,
                month,
                price
            FROM individual_announced_price
            WHERE id = ?
            ORDER BY year DESC, LPAD(month, 2, '0') DESC
            LIMIT 1
        )
        SELECT
            base.id,
            base.year AS base_year,
            base.month AS base_month,
            CAST(base.price AS SIGNED) AS base_price,
            latest.year AS latest_year,
            latest.month AS latest_month,
            CAST(latest.price AS SIGNED) AS latest_price,
            (CAST(latest.price AS SIGNED) - CAST(base.price AS SIGNED)) AS price_diff
        FROM individual_announced_price base
        JOIN latest ON latest.id = base.id
        WHERE base.id = ?
          AND base.year = ?;
        `,
        [id, id, year]
      );

      if (result[0]?.price_diff !== undefined && result[0]?.price_diff !== null) {
        return Number(result[0].price_diff);
      }
      return null;
    } catch (error) {
      console.error('Error to get public price difference:', error);
      throw error;
    }
  }

  static async getAroundRentInfo(lat: number, lng: number, roadContact: string, debug: boolean = false): Promise<{ aroundRentInfo: any | null; rentInfoList?: RentInfo[] }> {
    console.log('getAroundRentInfo lat, lng, roadContact, debug', lat, lng, roadContact, debug);
    try {
      const aroundRentInfo = await db.query<any>(
        `WITH deduplicated AS (
            SELECT
                n.floor_type,
                n.rent_price,
                n.excl_area,
                lci.road_contact,
                ROW_NUMBER() OVER (
                  PARTITION BY n.lat, n.lng, n.floor_info, n.area, n.excl_area
                  ORDER BY n.price ASC, n.rent_price ASC, n.atcl_no ASC
                ) AS rn
            FROM naver_rent_info AS n
            LEFT JOIN (
              SELECT id, road_contact,
                ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) AS latest
              FROM land_char_info
            ) lci ON n.land_id = lci.id AND lci.latest = 1
            WHERE ST_Distance_Sphere(POINT(?, ?), POINT(n.lng, n.lat)) <= ?
              AND n.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
          ),
          filtered AS (
            SELECT
                floor_type,
                (rent_price / (CAST(excl_area AS DECIMAL(10,4)) * 0.3025)) AS rent_per_py
            FROM deduplicated
            WHERE rn = 1
              AND (
                ? IN ('지정되지않음', '맹지', '')
                OR ? IS NULL
                OR road_contact IS NULL
                OR SUBSTRING(road_contact, 1, 2) = SUBSTRING(?, 1, 2)
              )
          )
          SELECT DISTINCT
              floor_type,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rent_per_py)
                  OVER (PARTITION BY floor_type) AS median_rent_per_py
          FROM filtered
          ORDER BY floor_type;
          `,
        [lng, lat, RENT_CANDIDATE_RADIUS, roadContact, roadContact, roadContact]
      )

      console.log('aroundRentInfo ', aroundRentInfo)

      if (debug) {
        const rentInfoList = await db.query<RentInfo>(
          `WITH deduplicated AS (
              SELECT
                  n.atcl_no,
                  n.floor_info,
                  n.floor_type,
                  n.price,
                  n.rent_price,
                  n.excl_area,
                  n.area,
                  n.lat,
                  n.lng,
                  n.created_at,
                  n.updated_at,
                  lci.road_contact,
                  ROW_NUMBER() OVER (
                    PARTITION BY n.lat, n.lng, n.floor_info, n.area, n.excl_area
                    ORDER BY n.price ASC, n.rent_price ASC, n.atcl_no ASC
                  ) AS rn
              FROM naver_rent_info AS n
              LEFT JOIN (
                SELECT id, road_contact,
                  ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) AS latest
                FROM land_char_info
              ) lci ON n.land_id = lci.id AND lci.latest = 1
              WHERE ST_Distance_Sphere(POINT(?, ?), POINT(n.lng, n.lat)) <= ?
                AND n.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            )
            SELECT
                atcl_no AS atclNo,
                floor_info AS floorInfo,
                floor_type AS floorType,
                price AS price,
                rent_price AS rentPrice,
                excl_area AS exclArea,
                area AS area,
                lat AS lat,
                lng AS lng,
                created_at AS createdAt,
                updated_at AS updatedAt,
                road_contact AS roadContact
            FROM deduplicated
            WHERE rn = 1
              AND (
                ? IN ('지정되지않음', '맹지', '')
                OR ? IS NULL
                OR road_contact IS NULL
                OR SUBSTRING(road_contact, 1, 2) = SUBSTRING(?, 1, 2)
              )
            `,
          [lng, lat, RENT_CANDIDATE_RADIUS, roadContact, roadContact, roadContact]
        );

        // console.log('filteredData ', filteredData);
        return {
          aroundRentInfo: aroundRentInfo,
          rentInfoList: rentInfoList
        };
      }

      return { aroundRentInfo, rentInfoList: null };
    } catch (error) {
      console.error('Error finding around rent info by id:', error);
      throw error;
    }
  }


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
      let results;
      let summary = null;
      let finalRatio = null;
      for (let i = 0; i < MAX_CHECK; i++) {
        const distance = ESTIMATE_REFERENCE_DISTANCE * (i + 1);
        const year = ESTIMATE_REFERENCE_YEAR + Math.min(i, 2);
        const checkUsage = (i !== (MAX_CHECK - 1));

        // const estimatedValues = await this.calcuateEstimatedPrice(id as string, distance, year, checkUsage);

        console.log('estimate ', distance, year, checkUsage)
        results = await db.query<any>(`
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
              b.position,
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
              AND (b.price / b.land_area) >= 200
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
              l.position,
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
              AND l.area IS NOT NULL AND l.area >= 33.3
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
              nb.position,
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
              nl.position,
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
            NULL AS ref_position,
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
            d.position AS ref_position,
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
        if (summary) {
          if (summary.avg_ratio_to_official) {
            finalRatio = summary.avg_ratio_to_official
            break;
          }
        }
      }

      let per = 3.0;
      let estimatedPrice = 0;
      let refDealList: RefDealInfo[] = [];

      if (finalRatio) {
        let adjustFactor = 1
        if (finalRatio <= 1.8) {
          adjustFactor = 1.5
        } else if (finalRatio <= 2.0) {
          adjustFactor = 1.3
        } else if (finalRatio <= 2.3) {
          adjustFactor = 1.25
        } else if (finalRatio <= 2.5) {
          adjustFactor = 1.1
        } else if (finalRatio <= 3.0) {
          adjustFactor = 1
        } else if (finalRatio <= 3.5) {
          adjustFactor = 0.9
        } else if (finalRatio <= 4.0) {
          adjustFactor = 0.8
        } else {
          adjustFactor = 0.7
        }
        const adjusted = summary.avg_ratio_to_official * adjustFactor
        per = Math.floor(adjusted * 10) / 10;
        estimatedPrice = Math.floor(summary.target_official_price_per_m2 * per * summary.target_area_m2)
        if (IS_DEVELOPMENT) {
          refDealList = results?.filter(r => r.row_type === 'detail').map(r => {
            return {
              id: r.ref_id,
              dealPrice: r.ref_deal_total_price_won,
              dealDate: r.ref_date,
              dealType: r.deal_kind,
              usageName: r.ref_usage_name,
              area: r.ref_area_m2,
              position: r.ref_position
            }
          })
        }

      } else {
        if (summary) {
          estimatedPrice = summary.target_official_price_per_m2 * 3.0 * summary.target_area_m2;
          per = 3.0;
        } else {
          estimatedPrice = null;
          per = null
        }
      }

      const result = {
        baseLandId: land.repLandId,
        estimatedPrice,
        per,
        refDealList,
      } as EstimatedPrice;

      return result;

    } catch (error) {
      throw error;
    }
  }


  static async calcEstimatedPriceWithDealInfo(id: string, debug: boolean = false): Promise<EstimatedPriceInfo | null> {
    try {
      let debugText: string[];

      if (debug) {
        debugText = []
      }

      const estimatedPrice = await this.calculateEstimatedPrice(id as string);
      // const dealInfo = await this.findLatestDealInfo(estimatedPrice.baseLandId);
      let resultPrice = estimatedPrice.estimatedPrice

      const {
        totalProjectCost,
        landInfo,
        buildingList
      } = await AIReportModel.getBuildProjectCost(id as string);
      if (landInfo?.dealPrice) {
        if (debug) {
          debugText.push(`💰[실거래가 있음]`);
        }
        const dealPrice = Number(landInfo.dealPrice) * 10000;
        const diffPrice = await LandModel.getPublicPriceDifference(estimatedPrice.baseLandId, landInfo.dealDate.getFullYear());
        console.log('dealInfo.dealDate.getFullYear() ', landInfo.dealDate.getFullYear())
        console.log('dealPrice ', dealPrice)
        console.log('diffPrice ', diffPrice)
        console.log('estimatedPrice.baseLandId ', estimatedPrice.baseLandId)

        if (debug) {
          debugText.push(`실거래가 ${krwUnit(dealPrice, true)}`);
          debugText.push(`${landInfo.dealDate.getFullYear()}년 대비 토지 공시지가 차액 ${krwUnit(diffPrice, true)}`);
        }

        resultPrice = dealPrice + ((diffPrice * landInfo.relTotalArea) * estimatedPrice.per);

        if (debug) {
          debugText.push(`추정가 ${krwUnit(resultPrice, true)} = ${krwUnit(dealPrice, true)}(실거래가) + (${krwUnit(diffPrice, true)}(공시지가 차액) x ${Number(landInfo.relTotalArea).toFixed(1)}(토지면적) x ${estimatedPrice.per}(PER))`);
        }

      } else {
        if (debug) {
          debugText.push(`추정가 ${krwUnit(resultPrice, true)}`);
        }
        if (buildingList?.length > 0) {
          // console.log('devDetailInfo.buildingList', buildingList);
          const buildingAge = getBuildingAge(buildingList[0].useApprovalDate);
          let discountRate = 1.0;
          let textDiscountRate = ''
          if (buildingAge < 5) {
            discountRate = 0.7
            if (debugText) {
              debugText.push(`* 준공 5년미만`);
              textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)} x 70%)`
            }
          } else if (buildingAge < 10) {
            // discountRate = Math.max(1 - (buildingAge * 0.020), 0)
            discountRate = 0.6
            if (debugText) {
              debugText.push(`* 준공 5년이상 10년미만`);
              textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)} x 60%)`
            }
          } else if (buildingAge < 20) {
            // discountRate = Math.max(1 - (buildingAge * 0.025), 0)
            discountRate = 0.4
            if (debugText) {
              debugText.push(`* 준공 10년이상 20년미만`);
              textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)} x 40%)`
            }
          } else {
            discountRate = 0
            if (debugText) {
              debugText.push(`* 준공 20년이상`);
              textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)} x 0%)`
            }

          }
          resultPrice += totalProjectCost * discountRate;
          if (debugText) {
            debugText.push(`${krwUnit(resultPrice, true)}= ${krwUnit(estimatedPrice.estimatedPrice, true)} + ${textDiscountRate}`);
          }
        } else {
          if (debugText) {
            debugText.push(`건물이 없음`);
          }
        }
      }

      const result = {
        estimatedPrice: resultPrice,
        per: Number((resultPrice / (landInfo.relTotalPrice * landInfo.relTotalArea)).toFixed(1)),
        refDealList: estimatedPrice.refDealList,
        debugText
      } as EstimatedPriceInfo;

      return result;
    } catch (err) {
      console.error('Get estimated price error:', err);
      throw err;
    }
  };



  // static async calcuateEstimatedPrice(id: string, referenceDistance: number, referenceYear: number, checkUsage: boolean = true): Promise<any | null> {


  //   console.log('calculateEstimatedPrice start ', id, referenceDistance, referenceYear, checkUsage)


  //   try {
  //     const results = await db.query(`
  //       -- 조회할 대상 id
  //       WITH
  //       /* 0) 대상 필지 좌표 + 최신 공시지가(원/㎡) + 면적(㎡) */
  //       base AS (
  //         SELECT
  //           ap.id,
  //           ap.lat,
  //           ap.lng,
  //           x.usage1_name,
  //           CAST(REPLACE(x.price, ',', '') AS DECIMAL(20,2)) AS official_price_per_m2,
  //           x.area_m2
  //         FROM address_polygon ap
  //         JOIN (
  //           SELECT
  //             id,
  //             price,
  //             usage1_name,
  //             CAST(area AS DECIMAL(20,4)) AS area_m2,
  //             ROW_NUMBER() OVER (
  //               PARTITION BY id
  //               ORDER BY STR_TO_DATE(create_date, '%Y-%m-%d') DESC
  //             ) AS rn
  //           FROM land_char_info
  //           WHERE id = ?
  //         ) x
  //           ON x.id = ap.id AND x.rn = 1
  //         WHERE ap.id = ?
  //       ),

  //       /* 1) 반경 300m 내 최근 3년 건물 실거래 → 원/㎡ + 총액(원) + 면적 + 거리(m) */
  //       near_building AS (
  //         SELECT
  //           b.key,
  //           b.id,
  //           b.leg_dong_code,
  //           b.leg_dong_name,
  //           b.jibun,
  //           b.deal_date,
  //           b.usage_name,
  //           CAST(b.land_area AS DECIMAL(20,4)) AS area_m2,
  //           (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
  //           (CAST(REPLACE(b.price, ',', '') AS DECIMAL(20,0)) * 10000) / NULLIF(b.land_area, 0) AS deal_price_per_m2,
  //           ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) AS distance_m
  //         FROM building_deal_list b
  //         CROSS JOIN base
  //         WHERE b.position IS NOT NULL
  //           AND ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) <= ${referenceDistance}
  //           AND b.price IS NOT NULL AND b.price <> ''
  //           ${checkUsage ? 'AND b.usage_name = base.usage1_name' : ''}
  //           AND b.land_area IS NOT NULL AND b.land_area > 0
  //           AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${referenceYear} YEAR)
  //           AND (b.cancel_yn != 'O' OR b.cancel_yn IS NULL)
  //           AND (b.price / b.land_area) >= 200
  //       ),

  //       /* 2) 반경 300m 내 최근 3년 토지 실거래 → 원/㎡ + 총액(원) + 면적 + 거리(m) */
  //       near_land AS (
  //         SELECT
  //           l.key,
  //           l.id,
  //           l.leg_dong_code,
  //           l.leg_dong_name,
  //           l.jibun,
  //           l.deal_date,
  //           l.usage_name,
  //           CAST(l.area AS DECIMAL(20,4)) AS area_m2,
  //           (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) AS deal_total_price_won,
  //           (CAST(REPLACE(l.price, ',', '') AS DECIMAL(20,0)) * 10000) / NULLIF(l.area, 0) AS deal_price_per_m2,
  //           ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) AS distance_m
  //         FROM land_deal_list l
  //         CROSS JOIN base
  //         WHERE l.position IS NOT NULL
  //           AND ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) <= ${referenceDistance}
  //           AND l.price IS NOT NULL AND l.price <> ''
  //           ${checkUsage ? 'AND l.usage_name = base.usage1_name' : ''}
  //           AND l.area IS NOT NULL AND l.area > 0
  //           AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL ${referenceYear} YEAR)
  //           AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
  //       ),
  //       /* 3) 거래필지 최신 공시지가(원/㎡) – 반경 내 필요한 키만 */
  //       near_keys AS (
  //         SELECT DISTINCT id FROM near_building
  //         UNION
  //         SELECT DISTINCT id FROM near_land
  //       ),
  //       latest_official_per_parcel AS (
  //         SELECT
  //           lci.id,
  //           lci.key,
  //           lci.leg_dong_code,
  //           lci.jibun,
  //           CAST(REPLACE(lci.price, ',', '') AS DECIMAL(20,2)) AS official_price_per_m2,
  //           ROW_NUMBER() OVER (
  //             PARTITION BY lci.leg_dong_code, lci.jibun
  //             ORDER BY STR_TO_DATE(lci.create_date, '%Y-%m-%d') DESC
  //           ) AS rn
  //         FROM land_char_info lci
  //         JOIN near_keys nk
  //           ON nk.id = lci.id
  //         WHERE lci.price IS NOT NULL AND lci.price <> ''
  //       ),

  //       /* 4) 건물/토지 거래 각각 공시지가 붙이기 + 총액(원) 계산 */
  //       building_with_official AS (
  //         SELECT
  //           lo.key,
  //           'building' AS deal_kind,
  //           nb.id, nb.leg_dong_code, nb.leg_dong_name, nb.jibun, nb.deal_date,
  //           nb.usage_name,
  //           nb.area_m2,
  //           nb.deal_total_price_won,
  //           nb.deal_price_per_m2,
  //           nb.distance_m,
  //           lo.official_price_per_m2,
  //           (lo.official_price_per_m2 * nb.area_m2) AS official_total_price_won,
  //           nb.deal_price_per_m2 / lo.official_price_per_m2 AS ratio_to_official,
  //           (nb.deal_price_per_m2 / lo.official_price_per_m2 - 1) * 100 AS premium_pct
  //         FROM near_building nb
  //         JOIN latest_official_per_parcel lo
  //           ON lo.id = nb.id
  //          AND lo.rn = 1
  //         WHERE lo.official_price_per_m2 > 0
  //       ),
  //       land_with_official AS (
  //         SELECT
  //           lo.key,
  //           'land' AS deal_kind,
  //           nl.id, nl.leg_dong_code, nl.leg_dong_name, nl.jibun, nl.deal_date,
  //           nl.usage_name,
  //           nl.area_m2,
  //           nl.deal_total_price_won,
  //           nl.deal_price_per_m2,
  //           nl.distance_m,
  //           lo.official_price_per_m2,
  //           (lo.official_price_per_m2 * nl.area_m2) AS official_total_price_won,
  //           nl.deal_price_per_m2 / lo.official_price_per_m2 AS ratio_to_official,
  //           (nl.deal_price_per_m2 / lo.official_price_per_m2 - 1) * 100 AS premium_pct
  //         FROM near_land nl
  //         JOIN latest_official_per_parcel lo
  //           ON lo.leg_dong_code = nl.leg_dong_code
  //          AND lo.jibun         = nl.jibun
  //          AND lo.rn = 1
  //         WHERE lo.official_price_per_m2 > 0
  //       ),

  //       /* 5) 통합 → 배수 상위 20건만 선별 */
  //       nearby_deals_raw AS (
  //         SELECT * FROM building_with_official
  //         UNION ALL
  //         SELECT * FROM land_with_official
  //       ),
  //       nearby_deals AS (
  //         SELECT *
  //         FROM nearby_deals_raw
  //         WHERE ratio_to_official IS NOT NULL
  //         ORDER BY ratio_to_official DESC
  //         LIMIT 20
  //       ),

  //       /* 6) 집계(상위 20건 기준) */
  //       agg AS (
  //         SELECT
  //           COUNT(*) AS deal_count,                -- 상위 20건(또는 그 이하) 개수
  //           AVG(ratio_to_official) AS avg_ratio_to_official,
  //           AVG(premium_pct) AS avg_premium_pct
  //         FROM nearby_deals
  //       )

  //       /* 7) 최종 출력: summary + (상위 20건) detail */
  //       SELECT
  //         'summary' AS row_type,
  //         base.id AS target_id,
  //         base.usage1_name,
  //         base.area_m2 AS target_area_m2,
  //         base.official_price_per_m2 AS target_official_price_per_m2,
  //         (base.official_price_per_m2 * base.area_m2) AS target_official_total_price_won,
  //         a.deal_count,
  //         a.avg_ratio_to_official,
  //         a.avg_premium_pct,
  //         CASE
  //           WHEN a.avg_ratio_to_official IS NOT NULL
  //             THEN ROUND(base.official_price_per_m2 * a.avg_ratio_to_official)
  //           ELSE base.official_price_per_m2
  //         END AS estimated_deal_price_per_m2,
  //         CASE
  //           WHEN a.avg_ratio_to_official IS NOT NULL
  //             THEN ROUND(base.area_m2 * base.official_price_per_m2 * a.avg_ratio_to_official)
  //           ELSE ROUND(base.area_m2 * base.official_price_per_m2)
  //         END AS estimated_deal_total_price_won,
  //         NULL AS ref_key,
  //         NULL AS deal_kind,
  //         NULL AS ref_id,
  //         NULL AS ref_leg_dong_code,
  //         NULL AS ref_leg_dong_name,
  //         NULL AS ref_jibun,
  //         NULL AS ref_date,
  //         NULL AS ref_usage_name,
  //         NULL AS ref_area_m2,
  //         NULL AS ref_deal_total_price_won,
  //         NULL AS ref_official_total_price_won,
  //         NULL AS ref_deal_price_per_m2,
  //         NULL AS ref_official_price_per_m2,
  //         NULL AS ref_ratio_to_official,
  //         NULL AS ref_premium_pct,
  //         NULL AS ref_distance_m
  //       FROM base
  //       LEFT JOIN agg a ON TRUE

  //       UNION ALL

  //       SELECT
  //         'detail' AS row_type,
  //         NULL AS target_id,
  //         NULL AS usage1_name,
  //         NULL AS target_area_m2,
  //         NULL AS target_official_price_per_m2,
  //         NULL AS target_official_total_price_won,
  //         NULL AS deal_count,
  //         NULL AS avg_ratio_to_official,
  //         NULL AS avg_premium_pct,
  //         NULL AS estimated_deal_price_per_m2,
  //         NULL AS estimated_deal_total_price_won,
  //         d.key AS ref_key,
  //         d.deal_kind,
  //         d.id AS ref_id,
  //         d.leg_dong_code AS ref_leg_dong_code,
  //         d.leg_dong_name AS ref_leg_dong_name,
  //         d.jibun AS ref_jibun,
  //         d.deal_date AS ref_date,
  //         d.usage_name AS ref_usage_name,
  //         d.area_m2 AS ref_area_m2,
  //         d.deal_total_price_won AS ref_deal_total_price_won,
  //         d.official_total_price_won AS ref_official_total_price_won,
  //         d.deal_price_per_m2 AS ref_deal_price_per_m2,
  //         d.official_price_per_m2 AS ref_official_price_per_m2,
  //         d.ratio_to_official AS ref_ratio_to_official,
  //         d.premium_pct AS ref_premium_pct,
  //         d.distance_m AS ref_distance_m
  //       FROM nearby_deals d;
  //           `, [id, id])

  //     return results
  //   } catch (error) {
  //     console.error('Error calculating estimated price:', error);
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

  static async isBookmarked(userId: number, landId: string): Promise<boolean> {
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

  static async addBookmark(userId: number, landId: string, estimatedPrice: number, estimatedPricePer: number, deleteYn: string) {
    try {
      const [rows] = await db.query(`SELECT 1 FROM bookmarked_report WHERE user_id = ? AND land_id = ? LIMIT 1`,
        [userId, landId])

      if (!!rows) {
        await db.query(
          `UPDATE bookmarked_report SET delete_yn = ?, estimated_price = ?, estimated_price_per = ? WHERE user_id = ? AND land_id = ?`,
          [deleteYn, estimatedPrice, estimatedPricePer, userId, landId]
        );
      } else {
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

  static async getTotalBookmarked(userId: number) {
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

  static async getBookmarkList(userId: number, page: number, size: number) {
    try {
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
      return { total, response };
    } catch (err) {
      console.error('Error getting bookmark list:', err);
      throw err;
    }
  }

  static async addConsultRequest(userId: number, landId: string, content: string) {
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
      return { total, response };
    } catch (err) {
      console.error('Error getting consult request list:', err);
      throw err;
    }
  }
}
