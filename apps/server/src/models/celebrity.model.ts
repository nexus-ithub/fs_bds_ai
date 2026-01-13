import { db } from '../utils/database';
import { RowDataPacket } from 'mysql2';

export interface CelebrityEstate {
  id: number;
  name: string;
  region: string;
  lat: number;
  lng: number;
  transactionType: string;
  price: string;
  propertyType: string;
  newsTitle: string;
  newsUrl: string;
  newsDate: string;
}

export interface CelebrityDongPolygon {
  dongName: string;
  legDongCode: string;
  polygon: string;
  lat: number;
  lng: number;
  celebrities: CelebrityEstate[];
  celebrityCount: number;
}

export class CelebrityModel {
  /**
   * 연예인 부동산이 있는 동의 폴리곤 데이터 조회
   * 지도 범위 내의 동만 반환
   */
  static async getDongPolygons(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number
  ): Promise<CelebrityDongPolygon[]> {
    // 1. celebrity_estate에서 동 이름 추출 (예: "서울 강남구 청담동" -> "청담동")
    // 2. district_polygon과 조인하여 폴리곤 가져오기
    const query = `
      WITH celebrity_dongs AS (
        SELECT
          ce.id,
          ce.name,
          ce.region,
          ce.lat,
          ce.lng,
          ce.transaction_type as transactionType,
          ce.price,
          ce.property_type as propertyType,
          ce.news_title as newsTitle,
          ce.news_url as newsUrl,
          ce.news_date as newsDate,
          SUBSTRING_INDEX(ce.region, ' ', -1) as dong_name
        FROM celebrity_estate ce
        WHERE ce.lat IS NOT NULL AND ce.lng IS NOT NULL
      ),
      matched_polygons AS (
        SELECT DISTINCT
          dp.leg_dong_name as dongName,
          dp.leg_dong_code as legDongCode,
          dp.polygon,
          dp.lat,
          dp.lng
        FROM district_polygon dp
        WHERE dp.lat BETWEEN ? AND ?
        AND dp.lng BETWEEN ? AND ?
        AND dp.leg_dong_name IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM celebrity_dongs cd
          WHERE dp.leg_dong_name LIKE CONCAT('%', cd.dong_name)
        )
      )
      SELECT * FROM matched_polygons
    `;

    const polygons = await db.query<RowDataPacket>(
      query,
      [swLat, neLat, swLng, neLng]
    );

    // 각 동에 해당하는 연예인 목록 조회
    const result: CelebrityDongPolygon[] = [];

    for (const polygon of polygons) {
      const celebritiesQuery = `
        SELECT
          ce.id,
          ce.name,
          ce.region,
          ce.lat,
          ce.lng,
          ce.transaction_type as transactionType,
          ce.price,
          ce.property_type as propertyType,
          ce.news_title as newsTitle,
          ce.news_url as newsUrl,
          DATE_FORMAT(ce.news_date, '%Y-%m-%d') as newsDate
        FROM celebrity_estate ce
        WHERE ce.region LIKE ?
      `;

      const celebrities = await db.query<CelebrityEstate>(
        celebritiesQuery,
        [`%${polygon.dongName.replace(/[가-힣]+구 /, '')}%`]
      );

      result.push({
        dongName: polygon.dongName,
        legDongCode: polygon.legDongCode,
        polygon: polygon.polygon,
        lat: polygon.lat,
        lng: polygon.lng,
        celebrities: celebrities,
        celebrityCount: celebrities.length,
      });
    }

    return result;
  }

  /**
   * 모든 연예인 부동산 동 폴리곤 조회 (지도 범위 무관)
   */
  static async getAllDongPolygons(): Promise<CelebrityDongPolygon[]> {
    // 연예인 부동산이 있는 동 이름들 추출
    const dongQuery = `
      SELECT DISTINCT
        SUBSTRING_INDEX(region, ' ', -1) as dong_name,
        region
      FROM celebrity_estate
      WHERE lat IS NOT NULL AND lng IS NOT NULL
    `;

    const dongs = await db.query<RowDataPacket>(dongQuery, []);

    const result: CelebrityDongPolygon[] = [];

    for (const dong of dongs) {
      // 동 이름으로 district_polygon 조회
      const polygonQuery = `
        SELECT
          dp.leg_dong_name as dongName,
          dp.leg_dong_code as legDongCode,
          dp.polygon,
          dp.lat,
          dp.lng
        FROM district_polygon dp
        WHERE dp.leg_dong_name LIKE ?
        LIMIT 1
      `;

      const polygons = await db.query<RowDataPacket>(
        polygonQuery,
        [`%${dong.dong_name}`]
      );

      if (polygons.length > 0) {
        const polygon = polygons[0];

        // 해당 동의 연예인 목록
        const celebritiesQuery = `
          SELECT
            ce.id,
            ce.name,
            ce.region,
            ce.lat,
            ce.lng,
            ce.transaction_type as transactionType,
            ce.price,
            ce.property_type as propertyType,
            ce.news_title as newsTitle,
            ce.news_url as newsUrl,
            DATE_FORMAT(ce.news_date, '%Y-%m-%d') as newsDate
          FROM celebrity_estate ce
          WHERE SUBSTRING_INDEX(ce.region, ' ', -1) = ?
        `;

        const celebrities = await db.query<CelebrityEstate>(
          celebritiesQuery,
          [dong.dong_name]
        );

        result.push({
          dongName: polygon.dongName,
          legDongCode: polygon.legDongCode,
          polygon: polygon.polygon,
          lat: polygon.lat,
          lng: polygon.lng,
          celebrities: celebrities,
          celebrityCount: celebrities.length,
        });
      }
    }

    return result;
  }

  /**
   * 특정 동의 연예인 목록 조회
   */
  static async getCelebritiesByDong(dongName: string): Promise<CelebrityEstate[]> {
    const query = `
      SELECT
        ce.id,
        ce.name,
        ce.region,
        ce.lat,
        ce.lng,
        ce.transaction_type as transactionType,
        ce.price,
        ce.property_type as propertyType,
        ce.news_title as newsTitle,
        ce.news_url as newsUrl,
        DATE_FORMAT(ce.news_date, '%Y-%m-%d') as newsDate
      FROM celebrity_estate ce
      WHERE ce.region LIKE ?
    `;

    return await db.query<CelebrityEstate>(query, [`%${dongName}%`]);
  }

  /**
   * 연예인 부동산 개별 목록 조회 (마커용)
   */
  static async getList(
    neLat: number,
    neLng: number,
    swLat: number,
    swLng: number
  ): Promise<CelebrityEstate[]> {
    const query = `
      SELECT
        ce.id,
        ce.name,
        ce.region,
        ce.lat,
        ce.lng,
        ce.transaction_type as transactionType,
        ce.price,
        ce.property_type as propertyType,
        ce.news_title as newsTitle,
        ce.news_url as newsUrl,
        DATE_FORMAT(ce.news_date, '%Y-%m-%d') as newsDate
      FROM celebrity_estate ce
      WHERE ce.lat BETWEEN ? AND ?
      AND ce.lng BETWEEN ? AND ?
      AND ce.lat IS NOT NULL
      AND ce.lng IS NOT NULL
      LIMIT 500
    `;

    return await db.query<CelebrityEstate>(query, [swLat, neLat, swLng, neLng]);
  }
}
