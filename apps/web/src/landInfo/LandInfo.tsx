import type { BuildingInfo, DistrictInfo, EstimatedPrice, EstimatedPriceInfo, LandInfo, PlaceList } from "@repo/common";
import { getJibunAddress, getRoadAddress, getAreaStrWithPyeong, Button, TabButton, VDivider, getBuildingCreateDate, getBuildingCreateYear, getBuildingRelInfoText } from "@repo/common";
import { krwUnit } from "@repo/common";
import { useEffect, useState, useRef, useMemo } from "react";
import { Land } from "./Land";
import { Building } from "./Building";
import { CircleQuestionMarkIcon, X } from "lucide-react";
import { BusinessDistrict } from "./BusinessDistrict";
import { Place } from "./Place";
import { CompanyInfo } from "../footer/CompanyInfo";
import { format } from "date-fns";
import { usePostHog } from 'posthog-js/react'
import { trackEvent } from "../utils/analytics";
import { Dialog, DialogActions, DialogContent, Tooltip } from "@mui/material";
import { checkIsAIReportNotAvailable, getSpecialUsageList, isDistrictPlanning } from "../utils";
import { AnnouncedPrice, type AnnouncedPriceAvgData } from "./AnnouncedPrice";

const TABS = [
  "공시지가",
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
  announcedPriceAvg = null,
  onClose,
  onOpenAIReport,
}: {
  landInfo: LandInfo | null;
  buildingList: BuildingInfo[] | null;
  businessDistrict: DistrictInfo[] | null;
  estimatedPrice: EstimatedPriceInfo | null;
  place: PlaceList | null;
  announcedPriceAvg: AnnouncedPriceAvgData | null;
  onClose?: () => void;
  onOpenAIReport?: () => void;
}) => {

  const [selectedTab, setSelectedTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const posthog = usePostHog()

  const announcedPriceRef = useRef<HTMLDivElement>(null);
  const landRef = useRef<HTMLDivElement>(null);
  const buildingRef = useRef<HTMLDivElement>(null);
  const businessDistrictRef = useRef<HTMLDivElement>(null);
  const placeRef = useRef<HTMLDivElement>(null);
  const [openEstimationInfo, setOpenEstimationInfo] = useState(false);
  const [selecting, setSelecting] = useState(false);

  const [isAIReportNotAvailable, setIsAIReportNotAvailable] = useState({
    result: false,
    message: "",
  });

  const specialUsageList = useMemo(() => {
    return getSpecialUsageList(landInfo?.usageList);
  }, [landInfo]);

  const handleOpenAIReport = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onOpenAIReport?.();
    if (!landInfo?.sidoName || !landInfo?.sigunguName) {
      trackEvent('report_viewed_missing_region', {
        landInfo: landInfo,
      })
      return;
    }
    trackEvent('report_viewed', {
      region: landInfo?.sidoName + ' ' + landInfo?.sigunguName,
    })
  }

  const scrollToTab = (tab: number) => {
    const tabRef = [
      announcedPriceRef,
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
    if (ref.current) {
      ref.current.scrollTop = 0;
    }

    if (landInfo) {
      const { result, message } = checkIsAIReportNotAvailable(landInfo)
      setIsAIReportNotAvailable({
        result,
        message,
      })
    }
  }, [landInfo]);

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
        const refs = [announcedPriceRef, landRef, buildingRef, businessDistrictRef, placeRef];

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
  }, [ref, announcedPriceRef, landRef, buildingRef, businessDistrictRef, placeRef, selecting]);

  if (!landInfo) {
    return null;
  }

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
              <X size={20} />
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
        <div className="mt-[10px] flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-[6px]">
            {
              landInfo.usageName && (
                <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo?.usageName}</p>
              )
            }
            {/* {
              landInfo.relMainUsageName && (
                <p className="font-c2-p text-purple-060 bg-purple-010 rounded-[2px] px-[6px] py-[2px]">{landInfo?.relMainUsageName}</p>
              )
            } */}
            {
              specialUsageList.map((specialUsage, index) => (
                <Tooltip
                  key={index}
                  title={<div>
                    {specialUsage + "은 사업계획 수립 시 정밀한 검토가 필요한 영역으로 본 자료의 면적 및 계획 내용은 추정치에 기반합니다."}
                    <p>본 자료에 기재된 사업계획은 변동될 수 있으며, 참고용으로 제공되는 것으로 법적 효력을 가지지 않습니다.</p>
                  </div>}
                >
                  <p
                    key={index}
                    className="flex items-center gap-[2px] font-c2-p text-red-500 bg-red-100 rounded-[2px] px-[6px] py-[2px]"
                  >
                    {specialUsage}
                    <CircleQuestionMarkIcon size={14} />
                  </p>
                </Tooltip>

              ))
            }
          </div>
          {/* <div className="flex flex-shrink-0 justify-start items-start font-s3 text-text-02">
            {getBuildingRelInfoText(landInfo)}
          </div> */}
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
          {/* <div className="flex-1 flex items-center justify-between">
            <p className="font-s3 text-text-03">건축면적{landInfo.relBuildingCount > 1 ? ' (합계)' : ''}</p>
            <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo.relArchAreaSum)}</p>
          </div>         */}
          <div className="flex-1 flex items-center justify-between">
            <p className="font-s3 text-text-03">연면적{landInfo.relBuildingCount > 1 ? ' (합계)' : ''}</p>
            <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo.relFloorAreaSum)}</p>
          </div>
          <div className="flex-1 flex items-center justify-between">
            <p className="font-s3 text-text-03">건축물</p>
            <p className="font-s3 text-text-02">{getBuildingRelInfoText(landInfo)}</p>
          </div>
        </div>
        <div className="mt-[16px] flex border border-line-02 rounded-[4px] py-[14px] px-[8px]">
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <div className="flex items-center gap-[2px]">
              <Tooltip
                title={
                  <p className="">
                    본 자료는 빌딩샵AI가 제공하는 토지 및 매매가 추정 자료로서, <br />법적 효력을 갖는 공식 평가가 아닙니다.<br />
                    투자 판단을 위한 참고용으로만 활용해 주시기 바라며, <br />본 자료는 참고용으로 제공되는 것으로 법적 효력을 가지지 않습니다.
                  </p>
                }
              >
                <div
                  onClick={() => setOpenEstimationInfo(true)}
                  className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px] gap-[2px] flex items-center">
                  추정가
                  <CircleQuestionMarkIcon size={14} />
                </div>
              </Tooltip>
            </div>
            <p className="font-h2-p text-primary">{estimatedPrice?.estimatedPrice ? krwUnit(estimatedPrice?.estimatedPrice, true) : '-'}</p>
            {/* <p className="font-c3 text-primary-030">{estimatedPrice?.per ? '공시지가 대비 ' + estimatedPrice?.per + ' 배' : '-'}</p> */}
            <p className="font-c3 text-primary-030">{(estimatedPrice?.estimatedPrice && landInfo) ? krwUnit(Number((estimatedPrice?.estimatedPrice / landInfo?.relTotalArea).toFixed(0)), true) + '/㎡' : '-'}</p>
            {/* <Dialog open={openEstimationInfo} onClose={() => setOpenEstimationInfo(false)}>
              <DialogContent>
                <p className="font-s2 text-text-02">
                  본 자료는 빌딩샵AI가 제공하는 토지 및 매매가 추정 자료로서, <br />법적 효력을 갖는 공식 평가가 아닙니다.<br /><br />
                  투자 판단을 위한 참고용으로만 활용해 주시기 바라며, <br />본 자료는 참고용으로 제공되는 것으로 법적 효력을 갖지 않습니다.
                </p>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenEstimationInfo(false)}>닫기</Button>
              </DialogActions>
            </Dialog> */}
          </div>
          <VDivider className="h-[56px]" />
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">공시지가{(landInfo?.relParcelCount > 1 ? ' (평균)' : '')}</p>
            <p className="font-h2-p">{landInfo.price ? krwUnit(landInfo.relTotalPrice * landInfo.relTotalArea, true) : '-'}</p>
            <p className="font-c3 text-text-03">{landInfo.relTotalPrice ? krwUnit(landInfo.relTotalPrice, true) : '-'}/㎡</p>
          </div>
          <VDivider className="h-[56px]" />
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">실거래가</p>
            <p className="font-h2-p">{landInfo.dealPrice ? krwUnit(landInfo.dealPrice * 10000, true) : '-'}</p>
            <p className="font-c3 text-text-03">{landInfo.dealDate ? format(landInfo.dealDate, 'yyyy.MM.dd') : ''}</p>
          </div>
        </div>

        {/* {
          estimatedPrice && (
            <div className="mt-[6px] flex flex-col border border-line-02 rounded-[4px] py-[14px] px-[8px]">
              <p className="font-h4-p">추정가 : {krwUnit(estimatedPrice?.estimatedPrice, true)} , 공시지가 대비 {estimatedPrice?.per?.toFixed(1)}배</p>
              <div className="flex flex-col text-[14px]">
                {
                  estimatedPrice?.debugText.map((text, index) => (
                    <p key={index}>{text}</p>
                  ))
                }
              </div>
            </div>
          )
        } */}
        {/* {
          specialUsageList.length > 0 && (
            <p className="mt-[6px] font-s3 border border-line-02 rounded-[4px] py-[12px] px-[8px] text-red-500 bg-red-100 ">
              {specialUsageList.join(', ')}은 사업계획 수립 시 정밀한 검토가 필요한 영역으로
              본 자료의 면적 및 계획 내용은 추정치에 기반합니다.
              본 자료에 기재된 사업계획은 변동될 수 있으며,
              참고용으로 제공되는 것으로 법적 효력을 가지지 않습니다.
            </p>
          )
        } */}
        {
          isAIReportNotAvailable.result ? (
            <div className="mt-[6px] font-s3 border border-line-02 rounded-[4px] py-[14px] px-[8px] text-primary-040 bg-primary-020">
              {isAIReportNotAvailable.message?.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          )
            : (
              <Button
                className="w-full mt-[16px] py-[11px]"
                onClick={(e) => handleOpenAIReport(e)}
              >
                {/* AI 설계 • 임대 분석 리포트 */}
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  개발 후 예상 수익 보기
                </span>
              </Button>
            )
        }

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
          className="pt-[20px] pb-[40px] flex-1 min-h-0 space-y-[33px] overflow-y-auto overscroll-y-contain touch-pan-y px-[20px]"
          onTouchStart={(e) => {
            const target = e.currentTarget;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;

            // 스크롤 가능한 영역이 있으면 터치 시작 위치 저장
            if (scrollHeight > clientHeight) {
              target.dataset.touchStartY = e.touches[0].clientY.toString();
            }
          }}
          onTouchMove={(e) => {
            const target = e.currentTarget;
            const scrollTop = target.scrollTop;
            const scrollHeight = target.scrollHeight;
            const clientHeight = target.clientHeight;
            const touchStartY = parseFloat(target.dataset.touchStartY || '0');
            const touchCurrentY = e.touches[0].clientY;
            const touchDelta = touchCurrentY - touchStartY;

            // 위로 스크롤하려는데 이미 최상단이거나, 아래로 스크롤하려는데 이미 최하단인 경우만 부모로 전달
            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
            const scrollingUp = touchDelta > 0;
            const scrollingDown = touchDelta < 0;

            if ((isAtTop && scrollingUp) || (isAtBottom && scrollingDown)) {
              // 스크롤 끝에 도달했을 때는 부모로 전달 허용
              return;
            }

            // 스크롤 중간에서는 부모로 전달 차단
            e.stopPropagation();
          }}
        >
          <AnnouncedPrice
            data={announcedPriceAvg}
            ref={announcedPriceRef}
            cityName={landInfo?.sidoName || "시"}
            districtName={landInfo?.sigunguName || "구"}
            dongName={landInfo?.legEupmyeondongName || "동"}
          />
          <Land landInfo={landInfo} ref={landRef} />
          <Building buildings={buildingList || []} ref={buildingRef} />
          <BusinessDistrict businessDistrict={businessDistrict || []} ref={businessDistrictRef} />
          <Place place={place} ref={placeRef} />
          <CompanyInfo />
        </div>
      </div>
    </div>
  )
}