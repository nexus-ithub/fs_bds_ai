import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { LandModel } from '../models/land.model';
import { BuildingModel } from '../models/buliding.model';
import { LandInfoResp } from '@repo/common';
import { DistrictModel } from '../models/district.model';
import axios from 'axios';
import { getDistance } from 'geolib';


const ESTIMATE_REFERENCE_DISTANCE = 300;
const ESTIMATE_REFERENCE_YEAR = 3;

export const getLandInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const land = await LandModel.findLandIdByLatLng(Number(lat), Number(lng));
    if (!land) {
      return res.status(404).json({ message: '필지를 찾을 수 없습니다.' });
    }

    const buildings = await BuildingModel.findBuildingListByJibun(land.legDongCode, land.jibun);
  
    let per = 3.0;
    let estimatedPrice = land.price * per * land.area;
    for(let i = 0; i < 4; i++) {
      const estimatedValues = await LandModel.calcuateEstimatedPrice(land.id, ESTIMATE_REFERENCE_DISTANCE * (i + 1), ESTIMATE_REFERENCE_YEAR);
      
      // console.log('estimatedValues', estimatedValues)
      const summary = estimatedValues.filter(r => r.row_type === 'summary')[0]
      
      let finalRatio = summary.avg_ratio_to_official
      console.log('finalRatio', finalRatio)
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
        estimatedPrice = Math.floor(land.price * per * land.area)
        break;
      }

    }
    // const estimatedPrice = await LandModel.calcuateEstimatedPrice(land.id, ESTIMATE_REFERENCE_DISTANCE, ESTIMATE_REFERENCE_YEAR);

  
    const landInfoResp = {
      land,
      buildings,
      estimatedPrice: Math.floor(estimatedPrice / 10) * 10,
      per,
    } as LandInfoResp;
    
    res.status(200).json(landInfoResp);
  } catch (err) {
    console.error('Get land info error:', err);
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
    console.error('Get land info error:', err);
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
						address_name : doc['address_name'],
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

    console.log('PUBLIC_API_KEY', PUBLIC_API_KEY)
    const busResp = await axios.get(`https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${PUBLIC_API_KEY}&gpsLati=${lat}&gpsLong=${lng}`)
    const busData = busResp.data
    const busList = []
    console.log('busData', busData)
    console.log('busData.response.body.items', busData.response.body.items)
    if(busData.response.body.items){
      for(const item of busData.response.body.items.item){
        console.log('item', item)
        const bus = {
          name: item.nodenm,
          distance: getDistance({latitude: Number(item.gpslati), longitude: Number(item.gpslong)}, {latitude: Number(lat), longitude: Number(lng)}),
          lat: item.gpslati,
          lng: item.gpslong
        }
        busList.push(bus)
      }
    }
    console.log('busList', busList)
    // if(busData.response.body.items){
      
    //   // busData.response.body.items = busData.response.body.items.map((item: any) => {
    //   //   return {
    //   //     name: item.sttn_name,
    //   //     distance: item.distance,
    //   //     lat: item.gpsLati,
    //   //     lng: item.gpsLong
    //   //   }
    //   // })
    // }
    const placeList = {
      school: results[0],
      subway: results[1],
      tour: results[2],
      bus: busList,
    }
    res.status(200).json(placeList);
  } catch (err) {
    console.error('Get land info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};