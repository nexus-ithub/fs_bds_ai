import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { LandModel } from '../models/land.model';
import { BuildingModel } from '../models/buliding.model';
import { DistrictModel } from '../models/district.model';
import axios from 'axios';
import { getDistance } from 'geolib';
import { BuildingInfo, EstimatedPrice, EstimatedPriceV2, LandInfo } from '@repo/common';
import { AIReportModel, getBuildingAge, krwUnit } from '../models/aireport.model';
import { trackError } from '../utils/analytics';

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
    trackError(err, {
      message: 'Polygon 정보 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getPolygonInfo',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'PolygonWithSub 정보 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getPolygonWithSub',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

export const getBuildingRepairedPolygon = async (req: AuthRequest, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;
    console.log(req.query)
    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const polygon = await LandModel.findBuildingRepairedPolygon(
      Number(neLat),
      Number(neLng),
      Number(swLat),
      Number(swLng)
    );
    if (!polygon) {
      return res.status(404).json({ message: '위치를 찾을수 없습니다.' });
    }

    res.status(200).json(polygon);
  } catch (err) {
    console.error('Get polygon info error:', err);
    trackError(err, {
      message: 'BuildingRepairedPolygon 정보 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getBuildingRepairedPolygon',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'FilteredPolygon 정보 조회 중 오류 발생',
      file: 'land.controller.ts',
      function: 'getFilteredPolygon',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'Land 정보 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getLandInfo',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'Building 리스트 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getBuildingList',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};


export const getEstimatedPriceV2 = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const estimatedPrice = await LandModel.calculateEstimatedPrice(id as string);
    const dealInfo = await LandModel.findLatestDealInfo(estimatedPrice.baseLandId);
    const growthRate = await LandModel.calculatePublicPriceGrowthRate(estimatedPrice.baseLandId);
    const devDetailInfo = await AIReportModel.makeDevDetailInfo(id as string, estimatedPrice);
    const priceByExpectedSaleAmount = devDetailInfo.devDetailInfo.build.result.expectedSaleAmount * 0.7;
    
    let priceByDealPrice = 0;
    console.log('dealInfo', dealInfo);
    console.log('growthRate', growthRate , typeof growthRate);
    let debugText = [];

    debugText.push(`[예상매각금액의 70%]`);
    debugText.push(`${krwUnit(priceByExpectedSaleAmount, true)} (${krwUnit(devDetailInfo.devDetailInfo.build.result.expectedSaleAmount, true)}(예상매각금액) x 70%)`);

    debugText.push(`[실거래 + 평균지가상승률반영가]`);
    if(dealInfo){
      const diffYear = new Date().getFullYear() - dealInfo.dealDate.getFullYear();
      priceByDealPrice = (Number(dealInfo.dealPrice) * 10000) * Math.pow(1 + growthRate, diffYear);
      debugText.push(`${krwUnit(priceByDealPrice, true)} (실거래가 ${krwUnit(dealInfo.dealPrice * 10000, true)} 에 ${diffYear}년 ${(growthRate * 100).toFixed(1)}% 복리 적용)`);
    }else{
      debugText.push(`실거래가가 없음`);
    }

    const totalProjectCost = 
      devDetailInfo.devDetailInfo.build.projectCost.constructionCost + 
      devDetailInfo.devDetailInfo.build.projectCost.constructionDesignCost + 
      devDetailInfo.devDetailInfo.build.projectCost.demolitionCost + 
      devDetailInfo.devDetailInfo.build.projectCost.demolitionManagementCost + 
      devDetailInfo.devDetailInfo.build.projectCost.managementCost + 
      devDetailInfo.devDetailInfo.build.projectCost.pmFee;

    
    let priceByProjectCost = estimatedPrice.estimatedPrice;

    debugText.push(`[추정가 + 건물가격(사업비에 감가상각적용)]`);
    if(devDetailInfo.buildingList?.length > 0){
      console.log('devDetailInfo.buildingList', devDetailInfo.buildingList);
      const buildingAge = getBuildingAge(devDetailInfo.buildingList[0].useApprovalDate);
      priceByProjectCost += totalProjectCost * (Math.max(1 - (buildingAge * 0.025), 0));
      debugText.push(`${krwUnit(priceByProjectCost, true)}= ${krwUnit(estimatedPrice.estimatedPrice, true)} + (사업비 ${krwUnit(totalProjectCost, true)} x (1 - (${buildingAge}년 x 0.025)))`);
    }else{
      debugText.push(`건물이 없음`);
    }
    console.log('estimatedPrice', estimatedPrice);
    console.log('dealInfo', dealInfo);
    console.log('growthRate', growthRate);

    console.log('priceByDealPrice ', priceByDealPrice);
    console.log('priceByExpectedSaleAmount ', priceByExpectedSaleAmount);
    console.log('priceByProjectCost ', priceByProjectCost);

    const expectedPrice = Math.max(priceByDealPrice, priceByExpectedSaleAmount, priceByProjectCost);

    // if(priceByExpectedSaleAmount > 0){
    //   debugText.push(`최종 추정가 ${krwUnit(expectedPrice)} `);
    // }
    
    const result = {
      estimatedPrice: expectedPrice,
      debugText
    } as EstimatedPriceV2;

    res.status(200).json(result);
  } catch (err) {
    console.error('Get estimated price error:', err);
    // trackError(err, {
    //   message: '추정가 계산 중 오류 발생',
    //   query: req.query,
    //   file: 'land.controller.ts',
    //   function: 'getEstimatedPriceV2',
    //   severity: 'error'
    // })
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
    trackError(err, {
      message: '추정가 계산 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getEstimatedPrice',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'AI 리포트 생성 중 오류 발생',
      landId: req.body?.landId,
      file: 'land.controller.ts',
      function: 'getAIReport',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'AI 상세 리포트 생성 중 오류 발생',
      landId: req.body?.landId,
      file: 'land.controller.ts',
      function: 'getAIReportDetail',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'AI 상세 리포트(개발용) 생성 중 오류 발생',
      landId: req.body?.landId,
      file: 'land.controller.ts',
      function: 'getAIReportDebugInfo',
      severity: 'error'
    })
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
    trackError(err, {
      message: 'Business District 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getBusinessDistrict',
      severity: 'error'
    })
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
    trackError(err, {
      message: '장소 정보 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getPlace',
      severity: 'error'
    })
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
    trackError(err, {
      message: '리포트 북마크 여부 조회 중 오류 발생',
      userId: req.userId,
      landId: req.query?.landId,
      file: 'land.controller.ts',
      function: 'isBookmarked',
      severity: 'error'
    })
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
    trackError(err, {
      message: '리포트 북마크 추가 중 오류 발생',
      userId: req.userId,
      landId: req.body?.landId,
      file: 'land.controller.ts',
      function: 'addBookmark',
      severity: 'error'
    })
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
    trackError(err, {
      message: '리포트 북마크 전체 개수 조회 중 오류 발생',
      userId: req.userId,
      file: 'land.controller.ts',
      function: 'getTotalBookmarked',
      severity: 'error'
    })
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
    trackError(err, {
      message: '리포트 북마크 리스트 조회 중 오류 발생',
      userId: req.userId,
      file: 'land.controller.ts',
      function: 'getBookmarkList',
      severity: 'error'
    })
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
    trackError(err, {
      message: '설계 상담 요청 추가 중 오류 발생',
      userId: req.userId,
      landId: req.body?.landId,
      file: 'land.controller.ts',
      function: 'addConsultRequest',
      severity: 'error'
    })
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
    trackError(err, {
      message: '설계 상담 요청 리스트 조회 중 오류 발생',
      file: 'land.controller.ts',
      function: 'getConsultRequestList',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}