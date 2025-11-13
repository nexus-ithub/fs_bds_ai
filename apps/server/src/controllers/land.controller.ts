import { Request, Response } from 'express';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { LandModel } from '../models/land.model';
import { BuildingModel } from '../models/buliding.model';
import { DistrictModel } from '../models/district.model';
import axios from 'axios';
import { getDistance } from 'geolib';
import { BuildingInfo, EstimatedPrice, LandInfo } from '@repo/common';
import { AIReportModel } from '../models/aireport.model';
import { Sentry } from "../instrument"

// const ESTIMATE_REFERENCE_DISTANCE = 300;
// const ESTIMATE_REFERENCE_YEAR = 2;

// export const getLandInfo = async (req: AuthRequest, res: Response) => {
//   try {
//     const { lat, lng, } = req.query;
//     if (!lat || !lng) {
//       return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
//     }
    
//     const land = await LandModel.findLandIdByLatLng(Number(lat), Number(lng));
//     if (!land) {
//       return res.status(404).json({ message: '필지를 찾을 수 없습니다.' });
//     }

//     // const buildings = await BuildingModel.findBuildingListByJibun(land.legDongCode, land.jibun);
//     const buildings = [];
//     let per = 3.0;
//     let estimatedPrice = land.price * per * land.area;
//     // for(let i = 0; i < 4; i++) {
//     //   const distance = ESTIMATE_REFERENCE_DISTANCE * (i + 1);
//     //   const year = ESTIMATE_REFERENCE_YEAR + Math.min(i, 2);
//     //   console.log('distance', distance)
//     //   console.log('year', year)
//     //   const estimatedValues = await LandModel.calcuateEstimatedPrice(land.id, distance, year);
      
//     //   console.log('estimatedValues', estimatedValues)
//     //   const summary = estimatedValues.filter(r => r.row_type === 'summary')[0]
//     //   if(summary){
//     //     let finalRatio = summary.avg_ratio_to_official
//     //     if(finalRatio){
//     //       let adjustFactor = 1
//     //       if(finalRatio <= 1.8){
//     //         adjustFactor = 1.5
//     //       }else if(finalRatio <= 2.0){
//     //         adjustFactor = 1.3
//     //       }else if(finalRatio <= 2.3){
//     //         adjustFactor = 1.25
//     //       }else if(finalRatio <= 2.5){
//     //         adjustFactor = 1.1
//     //       }else if(finalRatio <= 3.0){
//     //         adjustFactor = 1	
//     //       }else if(finalRatio <= 3.5){
//     //         adjustFactor = 0.9				
//     //       }else if(finalRatio <= 4.0){
//     //         adjustFactor = 0.8				
//     //       }else{
//     //         adjustFactor = 0.7
//     //       }
//     //       const adjusted = summary.avg_ratio_to_official * adjustFactor
//     //       per = Math.floor(adjusted * 10) / 10;
//     //       estimatedPrice = Math.floor(land.price * per * land.area)
//     //       console.log('finalRatio', finalRatio)
//     //       console.log('per', per)
//     //       console.log('estimatedPrice', estimatedPrice)
//     //       break;
//     //     }        
//     //   }
//     // }
//     // const estimatedPrice = await LandModel.calcuateEstimatedPrice(land.id, ESTIMATE_REFERENCE_DISTANCE, ESTIMATE_REFERENCE_YEAR);

  
//     const landInfoResp = {
//       land,
//       buildings,
//       estimatedPrice: Math.floor(estimatedPrice / 10) * 10,
//       per,
//     } as LandInfoResp;
    
//     res.status(200).json(landInfoResp);
//   } catch (err) {
//     console.error('Get land info error:', err);
//     res.status(500).json({ message: '서버 오류가 발생했습니다.' });
//   }
// };

export const getPolygonInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id, lat, lng, } = req.query;
    console.log(req.query)
    if (!id && (!lat || !lng)) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const polygon = await LandModel.findPolygon(id as string, Number(lat), Number(lng));
    // const polygon = await LandModel.findPolygonWithSub(id as string, Number(lat), Number(lng));
    if (!polygon) {
      return res.status(404).json({ message: '위치를 찾을수 없습니다.' });
    }

    res.status(200).json(polygon);
  } catch (err) {
    console.error('Get polygon info error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getPolygonWithSub = async (req: AuthRequest, res: Response) => {
  try {
    const { id, lat, lng, } = req.query;
    console.log(req.query)
    if (!id && (!lat || !lng)) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const polygon = await LandModel.findPolygonWithSub(id as string, Number(lat), Number(lng));
    if (!polygon) {
      return res.status(404).json({ message: '위치를 찾을수 없습니다.' });
    }

    res.status(200).json(polygon);
  } catch (err) {
    console.error('Get polygon info error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getFilteredPolygon = async (req: AuthRequest, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng, startArea, endArea, startFar, endFar, startBdAge, endBdAge, usages } = req.query;
    console.log(req.query)
    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const polygon = await LandModel.findFilteredPolygon(
      Number(neLat),
      Number(neLng),
      Number(swLat),
      Number(swLng),
      Number(startArea),
      Number(endArea),
      Number(startFar),
      Number(endFar),
      Number(startBdAge),
      Number(endBdAge),
      usages as string
    );

    res.status(200).json(polygon);
  } catch (err) {
    console.error('Get filtered polygon info error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getLandInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const land = await LandModel.findLandById([id as string]);
    if (!land) {
      return res.status(404).json({ message: '필지를 찾을 수 없습니다.' });
    }

    res.status(200).json(land);
  } catch (err) {
    console.error('Get land info error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};



export const getBuildingList = async (req: AuthRequest, res: Response) => {
  try {
    const { legDongCode, jibun, } = req.query;
    if (!legDongCode || !jibun) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const buildings = await BuildingModel.findBuildingListByJibun({legDongCode: legDongCode as string, jibun: jibun as string});
    
    res.status(200).json(buildings);
  } catch (err) {
    console.error('Get building list error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

const MAX_CHECK = 4;

export const getEstimatedPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const result = await LandModel.calculateEstimatedPrice(id as string);


    // // console.log('getEstimatedPrice for ', id)

    // let summary = null;
    // let finalRatio = null;
    // for(let i = 0; i < MAX_CHECK; i++) {
    //   const distance = ESTIMATE_REFERENCE_DISTANCE * (i + 1);
    //   const year = ESTIMATE_REFERENCE_YEAR + Math.min(i, 2);
    //   const checkUsage = (i !== (MAX_CHECK - 1));

    //   const estimatedValues = await LandModel.calcuateEstimatedPrice(id as string, distance, year, checkUsage);

    //   // console.log('estimatedValues', estimatedValues)
    //   // console.log('distance', distance)
    //   // console.log('year', year)
    //   // console.log('checkUsage', checkUsage)
      
    //   summary = estimatedValues.filter(r => r.row_type === 'summary')[0]
    //   if(summary){
    //     if(summary.avg_ratio_to_official){
    //       finalRatio = summary.avg_ratio_to_official
    //       break;
    //     }
    //   }
    // }

    // let per = 3.0;
    // let estimatedPrice = 0;
    // if(finalRatio){
    //   let adjustFactor = 1
    //   if(finalRatio <= 1.8){
    //     adjustFactor = 1.5
    //   }else if(finalRatio <= 2.0){
    //     adjustFactor = 1.3
    //   }else if(finalRatio <= 2.3){
    //     adjustFactor = 1.25
    //   }else if(finalRatio <= 2.5){
    //     adjustFactor = 1.1
    //   }else if(finalRatio <= 3.0){
    //     adjustFactor = 1	
    //   }else if(finalRatio <= 3.5){
    //     adjustFactor = 0.9				
    //   }else if(finalRatio <= 4.0){
    //     adjustFactor = 0.8				
    //   }else{
    //     adjustFactor = 0.7
    //   }
    //   const adjusted = summary.avg_ratio_to_official * adjustFactor
    //   per = Math.floor(adjusted * 10) / 10;
    //   estimatedPrice = Math.floor(summary.target_official_price_per_m2 * per * summary.target_area_m2)
    //   // console.log('finalRatio', finalRatio)
    //   // console.log('per', per)
    //   // console.log('estimatedPrice', estimatedPrice)
    // }else{
    //   if(summary){
    //     estimatedPrice = summary.target_official_price_per_m2 * 3.0 * summary.target_area_m2;
    //     per = 3.0;
    //   }else{
    //     estimatedPrice = null;
    //     per = null
    //   }
    // }        

    // const result = {
    //   estimatedPrice,
    //   per,
    // } as EstimatedPrice;

    res.status(200).json(result);
  } catch (err) {
    console.error('Get estimated price error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


export const getAIReport = async (req: AuthRequest, res: Response) => {
  try {
    const { landId } = req.body;
    console.log('landId', landId)
    if (!landId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const estimatedPrice = await LandModel.calculateEstimatedPrice(landId as string);
    
    const aiReportResult = await AIReportModel.getAIReport(landId as string, estimatedPrice);
    
    res.status(200).json(aiReportResult);
  } catch (err) {
    console.error('Get AI report error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getAIReportDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { landId } = req.body;
    console.log('landId', landId)
    if (!landId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const estimatedPrice = await LandModel.calculateEstimatedPrice(landId as string);
    
    const aiReportResult = await AIReportModel.getAIReportDetail(landId as string, estimatedPrice);
    
    res.status(200).json(aiReportResult);
  } catch (err) {
    console.error('Get AI report detail error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


export const getAIReportDebugInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { landId } = req.body;
    console.log('landId', landId)

    if(process.env.NODE_ENV !== 'development') {
      return res.status(400).json({ });
    }

    if (!landId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const estimatedPrice = await LandModel.calculateEstimatedPrice(landId as string);
    
    const debugInfo = await AIReportModel.getAIReportDebugInfo(landId as string, estimatedPrice);
    
    res.status(200).json(debugInfo);
  } catch (err) {
    console.error('Get AI report detail error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getBusinessDistrict = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const districtList = await DistrictModel.findDistrictListByLatLng(Number(lat), Number(lng));
    
    res.status(200).json(districtList);
  } catch (err) {
    console.error('Get business district error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
const PUBLIC_API_KEY = process.env.PUBLIC_API_KEY;
const REQUEST_CATEGORY = [
	// 'MT1', // 대형마트
	'SC4', // 학교
	'SW8', // 지하철역
	// 'PO3', // 공공기관
	'AT4', // 관광명소
	// 'PS3', // 어린이집 유치원
	// 'HP8', // 병원
]

export const getPlace = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    let results = []
    for (const category of REQUEST_CATEGORY) {
			let categoryResult = []
			let page = 1
			while(true){
        console.log('category', category)
        const url = `https://dapi.kakao.com/v2/local/search/category.json?x=${lng}&y=${lat}&radius=1000&sort=distance&category_group_code=${category}&page=${page}`;
      
				const kakaoResp = await axios.get(url, {
            headers : {
              'Authorization' : `KakaoAK ${KAKAO_API_KEY}`,
            }
          }
				)

				const resp_data = kakaoResp.data
				const documents = resp_data['documents']
				const meta = resp_data['meta']

				for(let doc of documents){
					categoryResult.push({
						addressName : doc['address_name'],
						name : doc['place_name'],
						distance : Number(doc['distance']),
						lat : Number(doc['y']),
						lng : Number(doc['x'])
					})
				}

				if(meta['is_end']){
					results.push(categoryResult)
					break
				}
				page++
			}      
    
    }

    const busList = []

    // try{
    //   // console.log('PUBLIC_API_KEY', PUBLIC_API_KEY)
    //   const busResp = await axios.get(`https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${PUBLIC_API_KEY}&gpsLati=${lat}&gpsLong=${lng}`)
    //   const busData = busResp.data
      
    //   // console.log('busData', busData)
    //   // console.log('busData.response.body.items', busData.response.body.items)
    //   if(busData.response.body.items){
    //     for(const item of busData.response.body.items.item){
    //       // console.log('item', item)
    //       const bus = {
    //         name: item.nodenm,
    //         distance: getDistance({latitude: Number(item.gpslati), longitude: Number(item.gpslong)}, {latitude: Number(lat), longitude: Number(lng)}),
    //         lat: item.gpslati,
    //         lng: item.gpslong
    //       }
    //       busList.push(bus)
    //     }
    //   }
    // }catch(err){
    //   // console.error('Get bus error:', err);
    // }


    const placeList = {
      school: results[0],
      subway: results[1],
      tour: results[2],
      bus: busList,
    }
    res.status(200).json(placeList);
  } catch (err : any) {
    console.error('Get place info error:', err.message);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const isBookmarked = async (req: AuthRequest, res: Response) => {
  try{
    const userId = req.userId;
    const landId = req.query.landId as string;
    const isBookmarked = await LandModel.isBookmarked(userId, landId);
    res.status(200).json(isBookmarked);
  } catch (err) {
    console.error('Check bookmarked error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const addBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { landId, buildingId, estimatedPrice, estimatedPricePer, deleteYn } = req.body as { 
      landId: string; 
      buildingId: string;
      estimatedPrice: number;
      estimatedPricePer: number;
      deleteYn: string;
    };
  
    await LandModel.addBookmark(userId, landId, estimatedPrice, estimatedPricePer, deleteYn);
    res.status(200).json({ message: '즐겨찾기 ' + (deleteYn === 'Y' ? '삭제' : '추가') + ' 성공' });
  } catch (err) {
    console.error('Add bookmark error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getTotalBookmarked = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const total = await LandModel.getTotalBookmarked(userId);
    res.status(200).json(total);
  } catch (err) {
    console.error('Get total bookmarked error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getBookmarkList = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const rawBookmarks = await LandModel.getBookmarkList(userId, page, size) as {total: number, response: any[]};
    
    const landIds = rawBookmarks.response.map(r => r.landId).filter(Boolean);
    let lands: LandInfo[] = [];
    if (landIds.length > 0) { lands = await LandModel.findLandById(landIds); }

    const buildingIds = rawBookmarks.response.map(r => r.buildingId).filter(Boolean);
    let buildings: BuildingInfo[] = [];
    if (buildingIds.length > 0) { buildings = await BuildingModel.findBuildingListByJibun({buildingIds}); }

    const bookmarksWithLandInfo = rawBookmarks.response.map(b => ({
      ...b,
      landInfo: lands.find(l => l.id === b.landId) || null,
      buildings: buildings.filter(building => building.id === b.buildingId)
    }));

    // const result: BookmarkedReportType[] = [];
    // for (const bm of rawBookmarks.response) {
    //   const landInfo = await LandModel.findLandById(bm.landId);

    //   result.push({
    //     landInfo,
    //     buildings: buildingInfo,
    //     estimatedPrice: bm.estimatedPrice,
    //     estimatedPricePer: bm.estimatedPricePer,
    //   });
    // }

    res.status(200).json({
      result: bookmarksWithLandInfo,
      total: rawBookmarks.total,
    });
  } catch (err) {
    console.error('Get bookmark list error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}


export const addConsultRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { landId, content } = req.body as { 
      landId: string; 
      content: string;
    };
    await LandModel.addConsultRequest(userId, landId, content);
    res.status(200).json({ message: '상담 요청 추가 성공' });
  } catch (err) {
    console.error('Add consult request error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

export const getConsultRequestList = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 10;
    const rawConsultRequests = await LandModel.getConsultRequestList(page, size) as {total: number, response: any[]};
    res.status(200).json({
      result: rawConsultRequests.response,
      total: rawConsultRequests.total,
    });
  } catch (err) {
    console.error('Get consult request list error:', err);
    Sentry.captureException(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}