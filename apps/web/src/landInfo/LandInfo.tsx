import type { BuildingInfo, DistrictInfo, EstimatedPrice, LandInfo, PlaceList } from "@repo/common";
import { getJibunAddress, getRoadAddress, getAreaStrWithPyeong, Button, TabButton, VDivider } from "@repo/common";
import { krwUnit } from "@repo/common";
import { useEffect, useState, useRef } from "react";
import { Land } from "./Land";
import { Building } from "./Building";
import { X } from "lucide-react";
import { BusinessDistrict } from "./BusinessDistrict";
import { Place } from "./Place";
import { CompanyInfo } from "../footer/CompanyInfo";
import { format } from "date-fns";

const TABS = [
  "토지",
  "건물",
  "상권",
  "입지"
]

export const LandInfoCard = ({
  landInfo = null,
  buildingList = null,
  businessDistrict = null,
  estimatedPrice = null,
  place = null,
  onClose,
  onOpenAIReport,
}: {
  landInfo: LandInfo | null;
  buildingList: BuildingInfo[] | null;
  businessDistrict: DistrictInfo[] | null;
  estimatedPrice: EstimatedPrice | null;
  place: PlaceList | null;
  onClose?: () => void;
  onOpenAIReport?: () => void;
}) => {

  const [selectedTab, setSelectedTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const landRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const businessDistrictRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLDivElement>(null);

  if (!landInfo) {
    return null;
  }

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = 0;
    }
  }, [landInfo]);


  const [selecting, setSelecting] = useState(false);

  const scrollToTab = (tab: number) => {
    const tabRef = [
      landRef,
      buildingRef,
      businessDistrictRef,
      placeRef
    ]
    tabRef[tab].current?.scrollIntoView({ behavior: "instant" });
    setSelectedTab(tab);
    setSelecting(true);
    setTimeout(() => {
      setSelecting(false);
    }, 1000);
  }

  useEffect(() => {
    
    const scrollContainer = ref.current;
    if (!scrollContainer) return;
  
    const ACTIVATION_OFFSET = 24; // 섹션 상단에서 약간 내려왔을 때 활성화
    let ticking = false;
  
    const getRelativeTop = (el: HTMLElement, container: HTMLElement) => {
      const elRect = el.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      // 컨테이너 상단 기준 절대 위치(=scrollTop 비교용)
      return elRect.top - cRect.top + container.scrollTop;
    };
  
    const handleScroll = () => {

      console.log('handleScroll', selecting);
      if (ticking) return;
      ticking = true;

      if (selecting) return;
  
      
      requestAnimationFrame(() => {
        const scrollTop = scrollContainer.scrollTop;
        const refs = [landRef, buildingRef, businessDistrictRef, placeRef];
  
        // 각 섹션의 컨테이너 기준 top 계산
        const tops = refs.map(r =>
          r.current ? getRelativeTop(r.current, scrollContainer) : Number.POSITIVE_INFINITY
        );
  
        // 현재 스크롤 위치보다 위(또는 근처)에 있는 가장 마지막 섹션을 선택
        let active = 0;
        for (let i = 0; i < tops.length; i++) {
          if (tops[i] <= scrollTop + ACTIVATION_OFFSET) active = i;
        }

        // 스크롤이 맨 아래에 도달했을 때 마지막 탭 선택
        const isAtBottom = scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10;
        if (isAtBottom) {
          active = refs.length - 1;
        }

  
        setSelectedTab(active);
        ticking = false;
      });
    };
  
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    // 초기 진입 시 상태 동기화
    handleScroll();
  
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [ref, landRef, buildingRef, businessDistrictRef, placeRef, selecting]);
    

  return (
    <div className="h-full flex flex-col pt-[20px]">
      <div className="px-[20px]">
        {/* <p>{landInfo.id}</p> */}
        <div className="space-y-[8px] ">
          <div className="flex items-center gap-[6px] justify-between">
            <p className="font-s1-p">{getJibunAddress(landInfo)}</p>
            <button
              onClick={() => onClose?.()}
            >
              <X size={20}/>
            </button>
          </div>
          {
            landInfo.roadName && (
              <div className="flex gap-[6px] items-center">
                <p className="flex-shrink-0 font-c3-p px-[4px] py-[1px] text-text-03 bg-surface-third">도로명</p>
                <p className="font-s3 flex items-center text-text-03">{getRoadAddress(landInfo)}</p>
              </div>
            )
          }
        </div>
        <div className="mt-[14px] flex items-center gap-[6px]">
          {
            landInfo.usageName && (
              <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.usageName}</p>
            )
          }
          {
            (buildingList && buildingList.length > 0) && (
              <p className="font-c2-p text-purple-060 bg-purple-010 rounded-[2px] px-[6px] py-[2px]">{buildingList[0].mainUsageName}</p>
            )
          }        
        </div>
        {/* <div className="mt-[10px] flex items-center gap-[5px]">
          <div className="flex-1 flex items-center justify-between">
            <p className="font-s4 text-text-03">토지면적</p>
            <p className="font-s4 text-text-02">{getAreaStrWithPyeong(landInfo.area)}</p>
          </div>
          <VDivider colorClassName="bg-line-03"/>
          <div className="flex-1 flex items-center justify-between">
            <p className="font-s4 text-text-03">건축면적</p>
            <p className="font-s4 text-text-02">{getAreaStrWithPyeong((buildingList && buildingList.length > 0) ? buildingList[0].archArea : null)}</p>
          </div>        
        </div> */}
        <div className="mt-[10px] flex-col space-y-[6px]">
          <div className="flex-1 flex items-center justify-between">
            <p className="font-s3 text-text-03">토지면적{landInfo.relParcelCount > 1 ? ' (합계)' : ''}</p>
            <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo.relTotalArea)}</p>
          </div>
         <div className="flex-1 flex items-center justify-between">
            <p className="font-s3 text-text-03">건축면적{landInfo.relBuildingCount > 1 ? ' (합계)' : ''}</p>
            <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo.relArchAreaSum)}</p>
          </div>        
        </div>
        <div className="mt-[16px] flex border border-line-02 rounded-[4px] py-[14px] px-[8px]">
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">추정가</p>
            <p className="font-h2-p text-primary">{estimatedPrice?.estimatedPrice ? krwUnit(estimatedPrice?.estimatedPrice, true) : '-'}</p>
            <p className="font-c3 text-primary-030">{estimatedPrice?.per ? '공시지가 대비 ' + estimatedPrice?.per + ' 배' : '-'}</p>
          </div>
          <VDivider className="h-[56px]"/>
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">공시지가(평균)</p>
            <p className="font-h2-p">{landInfo.price ? krwUnit(landInfo.relTotalPrice * landInfo.relTotalArea, true) : '-'}</p>
            <p className="font-c3 text-text-03">{landInfo.relTotalPrice ? krwUnit(landInfo.relTotalPrice, true) : '-'} /㎡</p>
          </div>
          <VDivider className="h-[56px]"/>
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">실거래가</p>
            <p className="font-h2-p">{landInfo.dealPrice ? krwUnit(landInfo.dealPrice * 10000, true) : '-'}</p>
            <p className="font-c3 text-text-03">{landInfo.dealDate ? format(landInfo.dealDate, 'yyyy.MM.dd') : ''}</p>
          </div>        
        </div>

        <Button 
          className="w-full mt-[16px] py-[11px]"
          onClick={() => onOpenAIReport?.()}
        >
          AI 설계 • 임대 분석 리포트
        </Button>
      </div>

      <div className="mt-[8px] min-h-0 flex-1 flex flex-col overflow-hidden">
        <div className="flex w-full flex-shrink-0 px-[20px]">
          {
            TABS.map((tab, index) => (
              <TabButton
                key={index}
                className="flex-1 py-[11px]"
                selected={index === selectedTab}
                onClick={() => {
                  setSelectedTab(index);
                  scrollToTab(index);
                }}
              >
                {tab}
              </TabButton>
            ))
          }
        </div>
        <div
          ref={ref}
          className="pt-[20px] pb-[40px] flex-1 min-h-0 space-y-[33px] overflow-y-auto px-[20px]">
          <Land landInfo={landInfo} ref={landRef}/>
          <Building buildings={buildingList || []} ref={buildingRef}/>
          <BusinessDistrict businessDistrict={businessDistrict || []} ref={businessDistrictRef}/>
          <Place place={place} ref={placeRef}/>
          <CompanyInfo/>
        </div>
      </div>
    </div>
  )
}