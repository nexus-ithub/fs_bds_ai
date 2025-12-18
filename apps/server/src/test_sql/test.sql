INSERT IGNORE INTO users (email, password, name)
VALUES (
  'admin@jungin.com',
  '$2b$08$UwyU1H13QasIkTEKyOOps.xtxnCALMpgX9FjG7/AhAPBfD2b.O6zm',
  '관리자'
);

SELECT 
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
            'usageName', landUsage.usage_name,
            'usageCode', landUsage.usage_code,
            'lawCode', usageCode.law_code,
            'lawName', usageCode.law_name,
            'conflict', landUsage.conflict
          )
        ),
        ']'
      )
      FROM land_usage_info AS landUsage
      LEFT JOIN land_usage_code AS usageCode 
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
    road_width_info.road_width AS roadWidth,
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
  AND jibun.jibun_sub_num = SUBSTRING_INDEX(address_polygon.jibun, '-', -1)
LEFT JOIN address_info AS addr 
  ON addr.address_id = jibun.address_id
LEFT JOIN additional_info AS info 
  ON addr.address_id = info.address_id
LEFT JOIN road_code_info AS road_info 
  ON addr.road_name_code = road_info.road_name_code 
  AND addr.eupmyeondong_serial_num = road_info.eupmyeondong_serial_num
LEFT JOIN road_width AS road_width_info 
  ON road_width_info.road_name = road_info.road_name
WHERE ST_CONTAINS(address_polygon.polygon, GeomFromText('Point(127.028385 37.497614)'));
GROUP BY address_polygon.id;


ALTER TABLE individual_announced_price
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE jibun_info
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE land_char_info
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE land_deal_list
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE land_info
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

ALTER TABLE land_usage_code
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

ALTER TABLE land_usage_info
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

ALTER TABLE land_usage_info_old
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

ALTER TABLE leg_dong_codes
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE public_data_files
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;
  
ALTER TABLE refresh_tokens
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;

  
ALTER TABLE road_code_info
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE road_width
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;


ALTER TABLE users
CONVERT TO CHARACTER SET utf8mb4 
COLLATE utf8mb4_general_ci;




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
    WHERE id = 1111016700101750009
  ) x
    ON x.id = ap.id AND x.rn = 1
  WHERE ap.id = 1111016700101750009
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
    AND ST_Distance_Sphere(POINT(base.lng, base.lat), b.position) <= 300
    AND b.price IS NOT NULL AND b.price <> ''
    AND b.land_area IS NOT NULL AND b.land_area > 0
    AND b.deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
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
    AND ST_Distance_Sphere(POINT(base.lng, base.lat), l.position) <= 300
    AND l.price IS NOT NULL AND l.price <> ''
    AND l.area IS NOT NULL AND l.area > 0
    AND l.deal_date >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
    AND (l.cancel_yn != 'O' OR l.cancel_yn IS NULL)
),

/* 3) 거래필지 최신 공시지가(원/㎡) – 반경 내 필요한 키만 */
near_keys AS (
  SELECT DISTINCT leg_dong_code, jibun FROM near_building
  UNION
  SELECT DISTINCT leg_dong_code, jibun FROM near_land
),
latest_official_per_parcel AS (
  SELECT
    lci.leg_dong_code,
    lci.jibun,
    CAST(REPLACE(lci.price, ',', '') AS DECIMAL(20,2)) AS official_price_per_m2,
    ROW_NUMBER() OVER (
      PARTITION BY lci.leg_dong_code, lci.jibun
      ORDER BY STR_TO_DATE(lci.create_date, '%Y-%m-%d') DESC
    ) AS rn
  FROM land_char_info lci
  JOIN near_keys nk
    ON nk.leg_dong_code = lci.leg_dong_code
    AND nk.jibun         = lci.jibun
  WHERE lci.price IS NOT NULL AND lci.price <> ''
),
/* 4) 건물/토지 거래 각각 공시지가 붙이기 + 총액(원) 계산 */
building_with_official AS (
  SELECT
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
    ON lo.leg_dong_code = nb.leg_dong_code
    AND lo.jibun         = nb.jibun
    AND lo.rn = 1
  WHERE lo.official_price_per_m2 > 0
),
land_with_official AS (
  SELECT
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







