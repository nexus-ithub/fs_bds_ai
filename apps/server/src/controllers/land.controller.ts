import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { LandModel } from '../models/land.model';
import { BuildingModel } from '../models/buliding.model';
import { DistrictModel } from '../models/district.model';
import axios from 'axios';
import { BuildingInfo, EstimatedPriceInfo, LandInfo } from '@repo/common';
import { AIReportModel, getBuildingAge, krwUnit } from '../models/aireport.model';
import { trackError } from '../utils/analytics';
import { IS_DEVELOPMENT } from '../constants';


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

export const getUsagePolygon = async (req: AuthRequest, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;
    console.log(req.query)
    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const polygon = await LandModel.findUsagePolygon(
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

export const getRentInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { neLat, neLng, swLat, swLng } = req.query;
    // console.log(req.query)
    if (!neLat || !neLng || !swLat || !swLng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const polygon = await LandModel.findRentInfo(
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
      message: 'RentInfo 정보 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getRentInfo',
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

    const buildings = await BuildingModel.findBuildingListByJibun({ legDongCode: legDongCode as string, jibun: jibun as string });

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


// export const getEstimatedPriceV2 = async (req: AuthRequest, res: Response) => {
//   try {
//     const { id } = req.query;
//     if (!id) {
//       return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
//     }

//     const estimatedPrice = await LandModel.calculateEstimatedPrice(id as string);
//     const dealInfo = await LandModel.findLatestDealInfo(estimatedPrice.baseLandId);
//     // const growthRate = await LandModel.calculatePublicPriceGrowthRate(estimatedPrice.baseLandId);
//     const {
//       totalProjectCost,
//       landInfo,
//       buildingList
//     } = await AIReportModel.getBuildProjectCost(id as string);
//     // const devDetailInfo = await AIReportModel.makeDevDetailInfo(id as string, estimatedPrice);
//     // const priceByExpectedSaleAmount = devDetailInfo.devDetailInfo.build.result.expectedSaleAmount * 0.7;
//     let debugText = [];
//     let resultPrice = estimatedPrice.estimatedPrice;

//     debugText.push(`[토지추정가 + 건물가격(사업비에 감가상각적용)]`);
//     if (buildingList?.length > 0) {
//       console.log('devDetailInfo.buildingList', buildingList);
//       const buildingAge = getBuildingAge(buildingList[0].useApprovalDate);
//       let discountRate = 1.0;
//       let textDiscountRate = ''
//       if (buildingAge < 5) {
//         discountRate = 1.0
//         debugText.push(`* 준공 5년미만`);
//         textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)})`
//       } else if (buildingAge < 10) {
//         discountRate = Math.max(1 - (buildingAge * 0.020), 0)
//         debugText.push(`* 준공 5년이상 10년미만`);
//         textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)} x (1 - (${buildingAge}년 x 0.020)))`
//       } else {
//         discountRate = Math.max(1 - (buildingAge * 0.025), 0)
//         debugText.push(`* 준공 10년이상`);
//         textDiscountRate = `(사업비 ${krwUnit(totalProjectCost, true)} x (1 - (${buildingAge}년 x 0.025)))`
//       }
//       resultPrice += totalProjectCost * discountRate;
//       debugText.push(`${krwUnit(resultPrice, true)}= ${krwUnit(estimatedPrice.estimatedPrice, true)} + ${textDiscountRate}`);
//     } else {
//       debugText.push(`건물이 없음`);
//     }

//     // console.log('estimatedPrice', estimatedPrice);
//     console.log('dealInfo', dealInfo);
//     // console.log('growthRate', growthRate);

//     // console.log('priceByDealPrice ', priceByDealPrice);
//     // console.log('priceByExpectedSaleAmount ', priceByExpectedSaleAmount);
//     // console.log('resultPrice ', resultPrice);
//     // console.log('landInfo.dealPrice ', Number(dealInfo?.dealPrice) * 10000);


//     if (dealInfo?.dealPrice && (Number(dealInfo.dealPrice) * 10000) > resultPrice) {
//       debugText.push(`💰[추정가 보다 실거래가가 더 큼]`);
//       const dealPrice = Number(landInfo.dealPrice) * 10000;
//       // const diffYear = new Date().getFullYear() - dealInfo.dealDate.getFullYear();
//       const diffPrice = await LandModel.getPublicPriceDifference(estimatedPrice.baseLandId, dealInfo.dealDate.getFullYear());
//       console.log('dealInfo.dealDate.getFullYear() ', dealInfo.dealDate.getFullYear())
//       console.log('dealPrice ', dealPrice)
//       console.log('diffPrice ', diffPrice)
//       console.log('estimatedPrice.baseLandId ', estimatedPrice.baseLandId)

//       debugText.push(`실거래가 ${krwUnit(dealPrice, true)}`);
//       debugText.push(`${dealInfo.dealDate.getFullYear()}년 대비 토지 공시지가 차액 ${krwUnit(diffPrice, true)}`);


//       resultPrice = dealPrice + ((diffPrice * landInfo.relTotalArea) * estimatedPrice.per);
//       debugText.push(`추정가 ${krwUnit(resultPrice, true)} = ${krwUnit(dealPrice, true)}(실거래가) + (${krwUnit(diffPrice, true)}(공시지가 차액) x ${Number(landInfo.relTotalArea).toFixed(1)}(토지면적) x ${estimatedPrice.per}(PER))`);
//     }
//     // const expectedPrice = Math.max(priceByDealPrice, priceByExpectedSaleAmount, priceByProjectCost);
//     // const expectedPrice = Math.max(priceByDealPrice, priceByProjectCost);

//     // if(priceByExpectedSaleAmount > 0){
//     //   debugText.push(`최종 추정가 ${krwUnit(expectedPrice)} `);
//     // }

//     const result = {
//       estimatedPrice: resultPrice,
//       per: (resultPrice / (landInfo.relTotalPrice * landInfo.relTotalArea)),
//       debugText
//     } as EstimatedPriceInfo;

//     res.status(200).json(result);
//   } catch (err) {
//     console.error('Get estimated price error:', err);
//     // trackError(err, {
//     //   message: '추정가 계산 중 오류 발생',
//     //   query: req.query,
//     //   file: 'land.controller.ts',
//     //   function: 'getEstimatedPriceV2',
//     //   severity: 'error'
//     // })
//     res.status(500).json({ message: '서버 오류가 발생했습니다.' });
//   }
// };



export const getEstimatedPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    // const result = await LandModel.calculateEstimatedPrice(id as string);
    const result = await LandModel.calcEstimatedPriceWithDealInfo(id as string, IS_DEVELOPMENT);


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

    const estimatedPrice = await LandModel.calcEstimatedPriceWithDealInfo(landId as string, IS_DEVELOPMENT);

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

    const estimatedPrice = await LandModel.calcEstimatedPriceWithDealInfo(landId as string, IS_DEVELOPMENT);

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

    if (process.env.NODE_ENV !== 'development') {
      return res.status(400).json({});
    }

    if (!landId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const estimatedPrice = await LandModel.calcEstimatedPriceWithDealInfo(landId as string, IS_DEVELOPMENT);

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
      while (true) {
        console.log('category', category)
        const url = `https://dapi.kakao.com/v2/local/search/category.json?x=${lng}&y=${lat}&radius=1000&sort=distance&category_group_code=${category}&page=${page}`;

        const kakaoResp = await axios.get(url, {
          headers: {
            'Authorization': `KakaoAK ${KAKAO_API_KEY}`,
          }
        }
        )

        const resp_data = kakaoResp.data
        const documents = resp_data['documents']
        const meta = resp_data['meta']

        for (let doc of documents) {
          categoryResult.push({
            addressName: doc['address_name'],
            name: doc['place_name'],
            distance: Number(doc['distance']),
            lat: Number(doc['y']),
            lng: Number(doc['x'])
          })
        }

        if (meta['is_end']) {
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
  } catch (err: any) {
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
  try {
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
    const rawBookmarks = await LandModel.getBookmarkList(userId, page, size) as { total: number, response: any[] };

    const landIds = rawBookmarks.response.map(r => r.landId).filter(Boolean);
    let lands: LandInfo[] = [];
    if (landIds.length > 0) { lands = await LandModel.findLandById(landIds); }

    const buildingIds = rawBookmarks.response.map(r => r.buildingId).filter(Boolean);
    let buildings: BuildingInfo[] = [];
    if (buildingIds.length > 0) { buildings = await BuildingModel.findBuildingListByJibun({ buildingIds }); }

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
    const rawConsultRequests = await LandModel.getConsultRequestList(page, size) as { total: number, response: any[] };
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

export const getAnnouncedPriceAvg = async (req: AuthRequest, res: Response) => {
  try {
    const { legDongCode, landId } = req.query;
    if (!legDongCode || !landId) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }

    const result = await LandModel.findAnnouncedPriceAvg(legDongCode as string, landId as string);

    res.status(200).json(result);
  } catch (err) {
    console.error('Get announced price avg error:', err);
    trackError(err, {
      message: '공시지가 평균 조회 중 오류 발생',
      query: req.query,
      file: 'land.controller.ts',
      function: 'getAnnouncedPriceAvg',
      severity: 'error'
    })
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}