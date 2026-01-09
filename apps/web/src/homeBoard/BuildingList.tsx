import { useEffect, useState } from "react";
import { getAreaStrWithPyeong, getShortAddress, HDivider, krwUnit, SubTabButton, type BdsSale } from "@repo/common";
import React from "react";
import { CircularProgress } from "@mui/material";
import { BuildingListDialog } from "./BuildingListDialog";
import { BuildingDetailDialog } from "./BuildingDetail";
import axios from "axios";
import { API_HOST } from "../constants";
import { CompanyInfo } from "../footer/CompanyInfo";
import { trackError, trackEvent } from "../utils/analytics";

const FILTER_TABS = [
  // {
  //   label: '👍 빌딩샵 추천 TOP5',
  //   value: 'recommend'
  // },
  {
    label: '👍 핫플레이스',
    value: 'hotplace'
  },
  {
    label: '🚇 역세권',
    value: 'subway'
  },
  {
    label: '💰 수익용',
    value: 'income'
  },
  {
    label: '🏢 사옥용',
    value: 'office'
  },
  {
    label: '🆕 신축빌딩',
    value: 'newbuild'
  },
  {
    label: '🏡 개발부지/토지',
    value: 'development'
  },
  {
    label: '🏬 꼬마빌딩',
    value: 'minibuild'
  },
]

// const ORDER = [
//   // 'recommend',
//   'hotplace',
//   'subway',
//   'income',
//   'office',
//   'newbuild',
//   'development',
// // ]

// const BUILDING_LIST_FILTER_TABS = [
//   // '실거래 슈퍼빌딩',
//   '핫플레이스',
//   '역세권',
//   '수익용',
//   '사옥용',
//   '신축빌딩',
//   '개발부지/토지',
//   '꼬마빌딩'
// ]

// const BUILDING_LIST_ORDER = [
//   // 'recommend',
//   'hotplace',
//   'subway',
//   'income',
//   'office',
//   'newbuild',
//   'development',
//   'minibuild'
// ]

export const BuildingList = () => {
  const [buildings, setBuildings] = useState<BdsSale[]>([]);
  const [selectedFilterTab, setSelectedFilterTab] = useState<{label: string, value: string}>(FILTER_TABS[0]);
  // const [order, setOrder] = useState<string>(ORDER[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showBuildingListDialog, setShowBuildingListDialog] = useState<boolean>(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BdsSale | null>(null);
  const tabScrollRef = React.useRef<HTMLDivElement>(null);
  const getBuildings = async () => {
    try {
      setLoading(true);
      setIsError(false);
      // const res = await axiosWithAuth.get('/api/bds/list', {params: {filter: order}});
      const res = await axios.get(`${API_HOST}/api/bds/list`, {params: {filter: selectedFilterTab.value}});
      setBuildings(res.data as BdsSale[]);
    } catch (error) {
      console.error(error);
      trackError(error, {
        message: '빌딩샵 매물 정보 조회 중 오류 발생',
        endpoint: '/main',
        file: 'BuildingList.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    getBuildings();
  }, [selectedFilterTab]);

  useEffect(() => {
    console.log("selectedBuilding", selectedBuilding);
  }, [selectedBuilding]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (tabScrollRef.current) {
      const scrollAmount = 200;
      tabScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-[20px] pt-[20px]">
        <p className="font-h3">빌딩샵 <span className="text-primary">추천 매물</span></p>
        {
          !isMobile && (
            <button onClick={() => setShowBuildingListDialog(true)} className="font-h6 text-primary">전체매물보기</button>
          )
        }
      </div>
      <p className="px-[20px] mt-[7px] font-s2 text-text-03">빌딩샵에서 추천하는 실거래 매물을 소개해 드려요.</p>
      {isMobile ? (
        <div className="mt-[12px] w-full border-t border-b border-line-02 relative">
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 bg-white/90 px-[8px] hover:bg-white"
          >
            <span className="text-[20px]">‹</span>
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 bg-white/90 px-[8px] hover:bg-white"
          >
            <span className="text-[20px]">›</span>
          </button>
          <div
            ref={tabScrollRef}
            className="overflow-x-auto scrollbar-hide px-[8px]"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div className="flex items-center divide-x divide-line-03 min-w-max">
              {
                FILTER_TABS.map((tab, index) => (
                  <React.Fragment key={index}>
                    <SubTabButton
                      className="flex-shrink-0 px-[20px] py-[12px]"
                      selected={tab.value === selectedFilterTab.value}
                      onClick={() => { setSelectedFilterTab(tab); }}
                    >
                      {tab.label}
                    </SubTabButton>
                  </React.Fragment>
                ))
              }
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-[12px] flex flex-col w-full border-t border-b border-line-02">
          <div className="flex w-full items-center divide-x divide-line-03">
            {
              FILTER_TABS.slice(0, 3).map((tab, index) => (
                <React.Fragment key={index}>
                  <SubTabButton
                    className="flex-1 flex items-center justify-center py-[12px]"
                    selected={tab.value === selectedFilterTab.value}
                    onClick={() => { setSelectedFilterTab(tab); }}
                  >
                    {tab.label}
                  </SubTabButton>
                  {/* {index < 2 && (
                    <div className="flex items-center justify-center">
                      <VDivider colorClassName="bg-line-03" className="h-[12px]"/>
                    </div>
                  )} */}
                </React.Fragment>
              ))
            }
          </div>
          <HDivider colorClassName="bg-line-02"/>
          <div className="flex w-full items-center divide-x divide-line-03">
            {
              FILTER_TABS.slice(3, 6).map((tab, index) => (
                <React.Fragment key={index}>
                  <SubTabButton
                    className="flex-1 flex items-center justify-center py-[12px]"
                    selected={tab.value === selectedFilterTab.value}
                    onClick={() => { setSelectedFilterTab(tab); }}
                  >
                    {tab.label}
                  </SubTabButton>
                  {/* {index < 2 && (
                    <div className="flex items-center justify-center">
                      <VDivider colorClassName="bg-line-03" className="!h-[12px]"/>
                    </div>
                  )} */}
                </React.Fragment>
              ))
            }
          </div>  
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto flex flex-col w-full divide-y divide-line-02 scrollbar-hover">
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
                trackEvent('bds_viewed', { region: building.addr.split(" ").slice(0, 2).join(" ") })
              }}
              className="space-y-[12px] px-[20px] py-[20px] text-start hover:bg-primary-010">
              <div className="flex items-center gap-[12px]">
                <div className="flex-shrink-0 relative">
                  <img
                    className={`rounded-[8px] object-cover ${isMobile ? 'w-[128px] h-[128px]' : 'w-[160px] h-[160px]'}`} 
                    src={building.imagePath || '/bd_img.png'} 
                    width={isMobile ? 128 : 160} 
                    height={isMobile ? 128 : 160}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/bd_img.png';
                    }}
                    alt=""/>
                  <p className="absolute top-[4px] left-[4px] w-[20px] h-[20px] flex items-center justify-center bg-primary text-white rounded-[2px] font-s3-p">{index+1}</p>  
                </div>
              <div className={`flex-1 flex flex-col ${isMobile ? '' : 'h-[160px]'} justify-between`}>
                {/* <p className="font-h4">{building.name}</p> */}
                <div className="flex-1 flex flex-col gap-[4px]">
                  <div className="flex-1 w-full font-s4 flex items-center justify-between"><p className="text-text-03">위치</p><p>{getShortAddress(building.addr)}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">매매가</p><p className={`${isMobile ? 'font-s2-p' : 'font-s1-p'} text-primary`}>{krwUnit(building.saleAmount * 10000, true)}</p></div>
                  <div className="flex-1 w-full font-s4 flex items-center gap-[2px] justify-between"><p className="text-text-03">가치평가 점수</p><p className={`${isMobile ? 'font-s2-p' : 'font-s1-p'}`}>{Number(building.buildValue).toFixed(0) + '점'}</p></div>
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