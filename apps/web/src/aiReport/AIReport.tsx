import { AIReportLogo, BookmarkFilledIcon, BookmarkIcon, BuildingShopBIText, Button, CI, CloseIcon, getAreaStrWithPyeong, getJibunAddress, getRoadAddress, HDivider, krwUnit, ShareIcon, TabButton, VDivider, type BuildingInfo, type EstimatedPrice, type LandInfo, type PolygonInfo } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { format } from "date-fns";
import { Roadview, RoadviewMarker } from "react-kakao-maps-sdk";



export interface AIReportProps {
  polygon: PolygonInfo;
  landInfo: LandInfo;
  buildings: BuildingInfo[];
  estimatedPrice: EstimatedPrice;
  onClose: () => void;
}

export const AIReport = ({ polygon, landInfo, buildings, estimatedPrice, onClose }: AIReportProps) => {
  const axiosWithAuth = useAxiosWithAuth();
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // mount 후 한 프레임 뒤에 translate-x-0 적용
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  
  const addBookmark = async () => {
    // try {
    //   await axiosWithAuth.post('/api/bds/bookmark', {userId: config?.id, building, deleteYn: isBookmarked ? 'Y' : 'N'});
    //   setIsBookmarked(!isBookmarked);
    // } catch (error) {
    //   console.error(error);
    // }
  }

  const getIdBookmarked = async () => {
    // try {
    //   const res = await axiosWithAuth.get('/api/bds/isBookmarked', {params: {userId: config?.id, bdsId: building.idx}});
    //   setIsBookmarked(res.data);
    // } catch (error) {
    //   console.error(error);
    // }
  }

  useEffect(() => {
    getIdBookmarked();
  }, [])

  return (
    <div className="fixed inset-y-0 top-[64px] right-0 z-[40] flex justify-end">
      <div className={`
          flex flex-col w-[768px] h-full bg-white rounded-l-[12px]
          shadow-[-16px_0_32px_0_rgba(0,0,0,0.08)]
          transform transition-transform duration-200 ease-out
          ${mounted ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-[24px] h-[64px]">
          <div className="flex items-center h-full gap-[8px]">
          <BuildingShopBIText/>
          <AIReportLogo/>
          </div>

          <div className="flex items-center font-s3 text-text-03 divide-x-[1px]   divide-line-03">
              {/* <button className="flex items-center px-[16px] gap-[4px]">
                공유하기
                <ShareIcon color="var(--color-content-03)" className="h-[16px]"/>
              </button> */}
              <button 
                className="flex items-center px-[16px] gap-[4px]"
                onClick={addBookmark}
              >
                관심물건 추가
                {isBookmarked ? <BookmarkFilledIcon /> : <BookmarkIcon />}
              </button>            
              <button
                className="flex items-center pl-[16px]"
                onClick={onClose}
              >
                <CloseIcon/>
              </button>
            </div>
        </div>    

        <div className="flex-1 px-[24px] pb-[24px] space-y-[24px] overflow-y-auto">
          <div className="flex rounded-[8px] border border-line-02">
            <Roadview
              onViewpointChange={(viewpoint) => {
                console.log(viewpoint);
                // setRoadViewCenter({
                //   ...roadViewCenter,
                //   pan: viewpoint.getViewpoint().pan,
                // })
              }}
              onPositionChanged={(position) => {
                console.log(position);
                // setRoadViewCenter({
                //   ...roadViewCenter,
                //   lat: position.getPosition().getLat(),
                //   lng: position.getPosition().getLng(),
                // })
              }}
              // pan={roadViewCenter.pan}
              position={{ lat: polygon.lat, lng: polygon.lng, radius: 50 }}
              
              className="w-[320px] h-[220px] object-cover rounded-l-[8px]"
            >
              <RoadviewMarker position={{ lat: polygon.lat, lng: polygon.lng }} />
            </Roadview>
            {/* <img
              className="w-[320px] h-[220px] object-cover rounded-l-[8px]"
              src={'http://buildingshop.co.kr/img/img_box_bg6.jpg'} alt=""/> */}
            <div className="flex-1 flex flex-col p-[16px]">
              <div className="flex items-center gap-[8px]">
                <p className="font-s1-p">{getJibunAddress(landInfo)}</p>
              </div>
              {
                landInfo.roadName && (
                  <div className="mt-[4px] flex gap-[6px] items-center">
                    <p className="flex-shrink-0 font-c3-p px-[4px] py-[1px] text-text-03 bg-surface-third">도로명</p>
                    <p className="font-s4 flex items-center text-text-03">{getRoadAddress(landInfo)}</p>
                  </div>
                )
              } 
              <div className="mt-[8px] flex items-center gap-[6px]">
                {
                  landInfo.usageName && (
                    <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.usageName}</p>
                  )
                }
                {
                  (buildings && buildings.length > 0) && (
                    <p className="font-c2-p text-purple-060 bg-purple-010 rounded-[2px] px-[6px] py-[2px]">{buildings[0].mainUsageName}</p>
                  )
                }        
              </div>            
              <div className="mt-[8px] flex items-center gap-[5px]">
                <div className="flex-1 flex items-center justify-between">
                  <p className="font-s4 text-text-03">대지면적</p>
                  <p className="font-s4 text-text-02">{getAreaStrWithPyeong(landInfo?.area)}</p>
                </div>
                <VDivider colorClassName="bg-line-03"/>
                <div className="flex-1 flex items-center justify-between">
                  <p className="font-s4 text-text-03">건축면적</p>
                  <p className="font-s4 text-text-02">{getAreaStrWithPyeong(buildings?.[0]?.archArea)}</p>
                </div>        
              </div>
              <div className="mt-[12px] flex border border-line-02 rounded-[4px] flex-1 items-center">
                <div className="flex-1 flex flex-col items-center gap-[4px]">
                  <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">추정가</p>
                  <p className="font-h2-p text-primary">{estimatedPrice?.estimatedPrice ? krwUnit(estimatedPrice?.estimatedPrice, true) : '-'}</p>
                  <p className="font-c3 text-primary-030">{estimatedPrice?.per ? '공시지가 대비 ' + estimatedPrice?.per + ' 배' : '-'}</p>
                </div>
                <VDivider className="h-[56px]"/>
                <div className="flex-1 flex flex-col items-center gap-[4px]">
                  <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">공시지가</p>
                  <p className="font-h2-p">{landInfo.price ? krwUnit(landInfo.price * landInfo.area, true) : '-'}</p>
                  <p className="font-c3 text-text-03">{landInfo.price ? krwUnit(landInfo.price, true) : '-'} /㎡</p>
                </div>
                <VDivider className="h-[56px]"/>
                <div className="flex-1 flex flex-col items-center gap-[4px]">
                  <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">실거래가</p>
                  <p className="font-h2-p">{landInfo.dealPrice ? krwUnit(landInfo.dealPrice * 10000, true) : '-'}</p>
                  <p className="font-c3 text-text-03">{landInfo.dealDate ? format(landInfo.dealDate, 'yyyy.MM.dd') : '-'}</p>
                </div>        
              </div>

            </div>            
          </div>
          <div className="space-y-[4px]">
            <p className="font-h3">투자 적합도 분석</p>      
            <p className="text-text-03 font-s3">
            해당 물건을 분석하여 건축 ∙ 리모델링 ∙ 임대 시 적합도를 판단하여 적합도 점수와 함께 AI 평가요약을 작성해 드려요.
            </p>

            <div className="mt-[12px] flex p-[16px] rounded-[8px] border border-line-03 gap-[16px]">
              <div className="w-[236px]">
                <p className="font-h4">항목 별 적합도</p>
                <div className="mt-[12px] border-b-line-02 border-b-[1px]"/>
                <div className="mt-[16px] gap-[18px] flex flex-col">
                  <div className="flex items-center gap-[8px] justify-between">
                    <p className="font-s2 text-text-02">🥇임대</p>
                    <p className="font-s3 text-primary bg-primary-010 rounded-[2px] px-[4px] py-[2px]">적합</p>
                  </div>
                  <div className="flex items-center gap-[8px] justify-between">
                    <p className="font-s2 text-text-02">🥈신축</p>
                    <p className="font-s3 text-purple-060 bg-purple-010 rounded-[2px] px-[4px] py-[2px]">가능</p>
                  </div>
                  <div className="flex items-center gap-[8px] justify-between">
                    <p className="font-s2 text-text-02">🥉리모델링</p>
                    <p className="font-s3 text-secondary-060 bg-[#FFF2F3] rounded-[2px] px-[4px] py-[2px]">부적합</p>
                  </div>
                </div>
              </div>
              <div className="w-[1px] bg-line-02"/>
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-[12px]">
                  <p className="font-h4">추천항목</p>
                  <VDivider/>
                  <p className="font-h4">임대</p>
                  <p className="font-s3 text-primary bg-primary-010 rounded-[2px] px-[4px] py-[2px]">적합</p>
                </div>
                <p className="flex-1 w-full items-center flex justify-center text-[34px] text-primary font-[var(--font-weight-bold)]">
                  A
                </p>
                <p className="w-full font-s3 bg-surface-second px-[12px] py-[8px] rounded-[2px]">
                  즉시 수익 창출이 가능하고 리스크가 낮아 안정적 현금 흐름 확보에 유리한 저위험 투자처입니다.
                </p>
              </div>
              
            </div>
          </div>
          <div className="space-y-[16px]">
            <p className="font-h3">AI 분석 리포트</p>
            <p className="w-full font-b3 bg-surface-second px-[16px] py-[12px] rounded-[4px]">
            서울 강남구 청담동 95-16(압구정로72길 26)은 제2종 일반주거지역에 위치한 지하 1층, 지상 4층 규모의 중소형 빌딩으로, 대지 약 101평, 연면적 약 255평입니다. 2021년에는 약 178억 원에 매매되었으며, 현재 시세는 약 230억~250억 원 수준으로 평가됩니다. 재건축 가능성은 있으나, 제2종 일반주거지역이라는 점에서 용적률 제한과 인허가 절차의 제약이 있으며, 인접 건물과의 관계도 고려해야 합니다. 다만, 리모델링 후 상가+주거 혼합 임대 전략으로 안정적인 수익 창출이 가능하며, 지하층은 상업용(바, 스튜디오), 상층부는 오피스텔 또는 공유오피스로 활용 가능합니다. 예상 월 임대수익은 약 1,100만 원 수준입니다.
            다만, 실거래가와 공시지가 괴리에 따른 세금 부담, 임대 공실 위험, 재건축 관련 규제 등을 충분히 검토해야 하며, 중장기적으로는 재건축 또는 고급 리모델링을 통해 자산가치 상승이 기대되는 건물입니다.
              </p>
          </div>
          <div className="">
            <div className="flex items-center">
              <TabButton fontClassName="font-s1" className="flex-1 h-[48px]" selected={true} onClick={() => {}}>
                신축 설계 리포트
              </TabButton>
              <TabButton fontClassName="font-s1" className="flex-1 h-[48px]" selected={false} onClick={() => {}}>
                리모델링 설계 리포트
              </TabButton>
              <TabButton fontClassName="font-s1" className="flex-1 h-[48px]" selected={false} onClick={() => {}}>
                임대 리포트
              </TabButton>
            </div>
            <div className="flex gap-[16px] border-b-line-03 border-b-[1px] border-x-line-03 border-x-[1px] rounded-b-[8px] p-[16px]">
              <div className="flex-1 space-y-[14px]">
                <div className="flex justify-between">
                  <p className="font-s2 text-text-03">매입 가능 금액</p>
                  <p className="font-s1-p">219.7억원</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-s2 text-text-03">금융 가능 비율</p>
                  <p className="font-s1-p">25%</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-s2 text-text-03">연간수익</p>
                  <p className="font-s1-p">7.03억원</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-s2 text-text-03">연간수익률</p>
                  <p className="font-s1-p">3.2%</p>
                </div>
                <div className="flex justify-between">
                  <p className="font-s2 text-text-03">리모델링후 예상 수익률</p>
                  <p className="font-s1-p">3.5~3.8%</p>
                </div>
              </div>
              <div className="w-[1px] bg-line-02"/>
              <div className="flex-1 flex flex-col items-center gap-[12px]">
                <p className="font-s2">N년후 예상 매각금액</p>
                <HDivider/>
                <p className="flex-1 flex items-center justify-center text-[30px] text-primary font-[var(--font-weight-bold)]">320~340억원</p>
              </div>
            </div>
          </div>          
        </div>
        <div className="">
          <HDivider/>
          <div className="mx-[16px]">
            <Button className="my-[12px] py-[12px] w-full" fontSize="font-h4">추천 항목 상세 리포트 보기</Button>  
          </div>
        </div>        
      </div>
     
    </div>
  );
};