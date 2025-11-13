import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { CloseIcon, getAreaStrWithPyeong, getShortAddress, krwUnit, Spinner, SubTabButton, TabButton, VDivider, type BdsSale } from "@repo/common";
import React from "react";
import { CircularProgress, Dialog, DialogContent } from "@mui/material";
import { BuildingListDialog } from "./BuildingListDialog";
import { BuildingDetailDialog } from "./BuildingDetail";
import axios from "axios";
import { API_HOST } from "../constants";
import { CompanyInfo } from "../footer/CompanyInfo";
import posthog from "posthog-js";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseConfig";
import * as Sentry from "@sentry/react";

const FILTER_TABS = [
  // '👍 빌딩샵 추천 TOP5',
  '👍 핫플레이스 추천매물',
  '💸 역세권 추천매물',
  '💰 수익용 추천매물'
]

const ORDER = [
  // 'recommend',
  'hotplace',
  'subway',
  'income'
]

const BUILDING_LIST_FILTER_TABS = [
  '실거래 슈퍼빌딩',
  '핫플레이스',
  '역세권',
  '수익용',
  '사옥용',
  '신축빌딩',
  '개발부지/토지',
  '꼬마빌딩'
]

const BUILDING_LIST_ORDER = [
  'recommend',
  'hotplace',
  'subway',
  'income',
  'office',
  'newbuild',
  'development',
  'minibuild'
]

export const BuildingList = () => {
  const [buildings, setBuildings] = useState<BdsSale[]>([]);
  const [selectedFilterTab, setSelectedFilterTab] = useState<number>(0);
  const [order, setOrder] = useState<string>(ORDER[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  const [showBuildingListDialog, setShowBuildingListDialog] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BdsSale | null>(null);
  const getBuildings = async () => {
    try {
      setLoading(true);
      setIsError(false);
      // const res = await axiosWithAuth.get('/api/bds/list', {params: {filter: order}});
      const res = await axios.get(`${API_HOST}/api/bds/list`, {params: {filter: order}});
      setBuildings(res.data as BdsSale[]);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    getBuildings();
  }, [order]);

  useEffect(() => {
    console.log("selectedBuilding", selectedBuilding);
  }, [selectedBuilding]);

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-[20px] pt-[20px]">
        <p className="font-h3">빌딩샵 <span className="text-primary">추천 매물</span></p>
        <button onClick={() => setShowBuildingListDialog(true)} className="font-h6 text-primary">전체매물보기</button>
      </div>
      <p className="px-[20px] mt-[7px] font-s2 text-text-03">빌딩샵에서 추천하는 실거래 매물을 소개해 드려요.</p>
      <div className="mt-[12px] flex w-full px-[20px]">
        <div className="flex w-full items-center border-t border-b border-line-02">
          {
            FILTER_TABS.map((tab, index) => (
              <React.Fragment key={index}>
                <SubTabButton
                  className="py-[14px] flex items-center justify-center"
                  selected={index === selectedFilterTab}
                  onClick={() => { setSelectedFilterTab(index); setOrder(ORDER[index]) }}
                >
                  {tab}
                </SubTabButton>
                {index < FILTER_TABS.length - 1 && (
                  <div className="flex flex-1 items-center justify-center">
                    <VDivider colorClassName="bg-line-03" className="!h-[12px]"/>
                  </div>
                )}
              </React.Fragment>
            ))
          }
        </div>
      </div>      
      <div className="min-h-0 flex-1 overflow-y-auto flex flex-col w-full divide-y divide-line-02">
        {loading ? (  
          <div className="flex items-center justify-center py-[60px]">
            <CircularProgress size={24}/>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-[30px]">
            <div className="flex flex-col items-center gap-[12px]">
              <div className="flex flex-col items-center gap-[2px] text-secondary-040">
                <p className="font-s3">매물 정보를 가져오는데 실패했습니다.</p>
                <p className="font-s3">잠시후 다시 시도해 주세요.</p>
              </div>
              <button 
                onClick={() => getBuildings()}
                className="font-s3 text-primary border border-primary rounded-[4px] px-[12px] py-[8px]"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          buildings.map((building, index) => (
            <button 
              key={index} 
              onClick={() => {
                setSelectedBuilding(building); 
                posthog.capture('bds_viewed', { region: building.addr.split(" ").slice(0, 2).join(" ") });
                logEvent(analytics, 'bds_viewed', { region: building.addr.split(" ").slice(0, 2).join(" ") });
              }}
              className="space-y-[12px] px-[20px] py-[20px] text-start hover:bg-primary-010">
              <div className="flex items-center gap-[12px]">
                <div className="flex-shrink-0 relative">
                  <img
                    className="w-[160px] h-[160px] rounded-[8px] object-cover" 
                    src={building.imagePath || '/bd_img.png'} 
                    width={160} 
                    height={160}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/bd_img.png';
                    }}
                    alt=""/>
                  <p className="absolute top-[4px] left-[4px] w-[20px] h-[20px] flex items-center justify-center bg-primary text-white rounded-[2px] font-s3-p">{index+1}</p>  
                </div>
              <div className="flex-1 flex flex-col h-[160px] justify-between">
                {/* <p className="font-h4">{building.name}</p> */}
                <div className="flex-1 flex flex-col gap-[4px]">
                  <div className="flex-1 w-full font-s4 flex items-center justify-between"><p className="text-text-03">위치</p><p>{getShortAddress(building.addr)}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">매매가</p><p className="font-s1-p text-primary">{krwUnit(building.saleAmount * 10000, true)}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">가치평가 점수</p><p className="font-s1-p">{Number(building.buildValue).toFixed(0) + '점'}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">수익율</p><p className="font-s3">{(building.sellProfit && building.sellProfit > 0) ? building.sellProfit.toFixed(1) + '%' : '-'}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">대지면적</p><p className="font-s3">{getAreaStrWithPyeong(building.platArea)}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[12px] justify-between"><p className="text-text-03">연면적</p><p className="font-s3">{getAreaStrWithPyeong(building.totalArea)}</p></div>
                </div>
              </div>
            </div>
            <div className="font-b3 rounded-[4px] px-[16px] py-[12px] bg-surface-second">
              {building.memo?.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            
          </button>
        )))}
        <CompanyInfo/>
      </div>
      <BuildingListDialog 
        open={showBuildingListDialog} 
        onClose={() => setShowBuildingListDialog(false)} 
        onBuildingClick={setSelectedBuilding}/>
      {
        selectedBuilding && (
          <BuildingDetailDialog 
            open={selectedBuilding !== null} 
            onClose={() => setSelectedBuilding(null)} 
            building={selectedBuilding}/>
        )
      }
    </div>
  )
}