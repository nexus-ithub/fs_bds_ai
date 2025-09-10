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