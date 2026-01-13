import { db } from '../utils/database';
import { RowDataPacket } from 'mysql2';

export interface Politician {
  id: number;
  name: string;
  organization: string;
  position_title: string;
  lat: number;
  lng: number;
  accuracy_grade: 'A' | 'B' | 'C' | 'F';
  price: number;
  address_normalized: string;
  asset_type: '건물' | '토지';
}

export interface PoliticianCluster {
  count: number;
  lat: number;
  lng: number;
  location_key: string;
  isCluster: boolean;
  id: string;
}

export class PoliticianModel {
  /**
   * 지도 범위 내의 정치인 부동산 클러스터 조회 (서버에서 지리적 클러스터링)
   * 줌 레벨에 따라 클러스터 범위 조정
   */
  static async getClusters(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number,
    level: number
  ): Promise<PoliticianCluster[]> {
    // 줌 레벨에 따라 클러스터링 정밀도 조정
    // level이 높을수록 줌 아웃 → 더 넓은 범위로 클러스터링
    let precision: number;
    if (level >= 8) {
      precision = 1; // 약 11km 반경
    } else if (level >= 6) {
      precision = 2; // 약 1.1km 반경
    } else if (level >= 4) {
      precision = 3; // 약 110m 반경
    } else {
      precision = 4; // 약 11m 반경
    }

    const query = `
      SELECT
        COUNT(*) as count,
        AVG(lat) as lat,
        AVG(lng) as lng,
        CONCAT(
          ROUND(lat, ?),
          ',',
          ROUND(lng, ?)
        ) as location_key
      FROM politician_estate
      WHERE lat BETWEEN ? AND ?
      AND lng BETWEEN ? AND ?
      AND lat IS NOT NULL
      AND lng IS NOT NULL
      GROUP BY location_key
      HAVING count > 0
      ORDER BY count DESC
    `;

    const rows = await db.query<RowDataPacket>(
      query,
      [precision, precision, swLat, neLat, swLng, neLng]
    );

    return rows.map((row) => ({
      count: row.count,
      lat: row.lat,
      lng: row.lng,
      location_key: row.location_key,
      isCluster: true,
      id: `cluster-${row.location_key}`,
    }));
  }

  /**
   * 지도 범위 내의 정치인 부동산 개별 데이터 조회 (매우 줌인했을 때)
   */
  static async getList(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number
  ): Promise<Politician[]> {
    const query = `
      SELECT
        id,
        name,
        organization,
        position_title,
        lat,
        lng,
        accuracy_grade,
        price,
        address_normalized,
        asset_type
      FROM politician_estate
      WHERE lat BETWEEN ? AND ?
      AND lng BETWEEN ? AND ?
      AND lat IS NOT NULL
      AND lng IS NOT NULL
      LIMIT 500
    `;

    const rows = await db.query<Politician>(query, [swLat, neLat, swLng, neLng]);

    return rows;
  }

  /**
   * 특정 정치인 부동산 상세 조회
   */
  static async getDetail(id: number): Promise<Politician | null> {
    const query = `
      SELECT
        id,
        name,
        organization,
        position_title,
        category,
        registered_date,
        asset_type,
        asset_subtype,
        owner,
        price,
        area,
        address_original,
        address_normalized,
        address_polygon_id,
        lat,
        lng,
        accuracy_grade,
        created_at,
        updated_at
      FROM politician_estate
      WHERE id = ?
    `;

    const rows = await db.query<Politician>(query, [id]);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }
}
