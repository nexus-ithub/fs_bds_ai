import { Request, Response } from 'express';
import { db } from '../utils/database';
import { AuthRequest } from 'src/middleware/auth.middleware';
import { LandModel } from '../models/land.model';
import { BuildingModel } from '../models/buliding.model';
import { LandInfoResp } from '@repo/common';
import { DistrictModel } from '../models/district.model';
import axios from 'axios';

export const getLandInfo = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: '필수 파라미터가 제공되지 않았습니다.' });
    }
    
    const land = await LandModel.findLandIdByLatLng(Number(lat), Number(lng));
    const buildings = await BuildingModel.findBuildingListByJibun(land.legDongCode, land.jibun);
    if (!land) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const landInfoResp = {
      land,
      buildings,
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
        const url = `https://dapi.kakao.com/v2/local/search/category.json?x=${lng}&y=${lat}&radius=1000&sort=distance&category_group_code=${category}`;
      
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

    const placeList = {
      school: results[0],
      subway: results[1],
      tour: results[2],
    }
    res.status(200).json(placeList);
  } catch (err) {
    console.error('Get land info error:', err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};