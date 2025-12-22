import { AIReportLogo, BookmarkFilledIcon, BookmarkIcon, BuildingShopBIMain, Button, CI, CloseIcon, DotProgress, getAreaStrWithPyeong, getBuildingRelInfoText, getJibunAddress, getRoadAddress, HDivider, krwUnit, ShareIcon, TabButton, VDivider, type AIReportDebugInfo, type AIReportResult, type BuildingInfo, type EstimatedPrice, type LandInfo, type PolygonInfo, type ReportValue } from "@repo/common";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { format } from "date-fns";
import { Roadview, RoadviewMarker } from "react-kakao-maps-sdk";
import { useQuery, useQueryClient } from "react-query";
import { IS_DEVELOPMENT, QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { type User } from "@repo/common";
import { NeedLoginDialog } from "../auth/NeedLoginDialog";
import { bearingFromTo, getGradeChip, getSpecialUsageList } from "../utils";
import { AIReportDetailDialog } from "./AIReportDetailDialog";
import { Dialog, Tooltip } from "@mui/material";
import { toast } from "react-toastify";
import { AIReportDebugInfoDialog } from "./AIReportDebugInfoDialog";
import { CircleQuestionMarkIcon } from "lucide-react";


export interface AIReportProps {
  landId: string;
  onClose: () => void;
  onReportCreated?: (result: AIReportResult | null) => void;
}




const ReportItem = ({ title, value }: { title: string, value: string }) => {
  return (
    <div className="flex justify-between">
      <p className="font-s2 text-text-03">{title}</p>
      <p className="font-s1-p">{value}</p>
    </div>
  )
}

export const AIReport = ({ landId, onClose, onReportCreated }: AIReportProps) => {
  const axiosWithAuth = useAxiosWithAuth();
  // const { data : config } = useQuery<User>({
  //   queryKey: [QUERY_KEY_USER, getAccessToken()],
  //   queryFn: async () => {
  //     const response = await axiosWithAuth.get("/api/user/info");
  //     return response.data;
  //   },
  //   enabled: !!getAccessToken(),
  // })

  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [landInfo, setLandInfo] = useState<LandInfo | null>(null);
  const [polygon, setPolygon] = useState<PolygonInfo | null>(null);
  const [aiReportResult, setAiReportResult] = useState<AIReportResult | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<EstimatedPrice | null>(null);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [openNeedLogin, setOpenNeedLogin] = useState<boolean>(false);
  const [openAIReportDetailDialog, setOpenAIReportDetailDialog] = useState<boolean>(false);
  const [aiReportDebugInfo, setAiReportDebugInfo] = useState<AIReportDebugInfo | null>(null);
  const [openDebugInfo, setOpenDebugInfo] = useState<boolean>(false);
  const didRunRef = useRef(false);

  // const getGrade = (grade: string) => {
  //   switch (grade) {
  //     case 'A':
  //       return <p className="font-s3 text-primary bg-primary-010 rounded-[2px] px-[4px] py-[2px]">적합</p>;
  //     case 'B':
  //       return <p className="font-s3 text-purple-060 bg-purple-010 rounded-[2px] px-[4px] py-[2px]">가능</p>;
  //     case 'C':
  //       return <p className="font-s3 text-secondary-060 bg-[#FFF2F3] rounded-[2px] px-[4px] py-[2px]">부적합</p>;
  //     default:
  //       return <p className="font-s3 text-secondary-060 bg-[#FFF2F3] rounded-[2px] px-[4px] py-[2px]">부적합</p>;
  //   }
  // }

  const specialUsageList = useMemo(() => {
    if (!landInfo) return [];
    return getSpecialUsageList(landInfo);
  }, [landInfo]);

  useEffect(() => {
    // mount 후 한 프레임 뒤에 translate-x-0 적용
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);


  const getAIReport = async () => {

    console.log('request ai report ', landId);
    // const buildingId = buildings?.[0]?.id ?? null;

    const aiReport = {
      landId: landId,
    }

    setLoading(true);
    axiosWithAuth.post('/api/land/ai-report', aiReport).then((res) => {
      console.log(res.data);
      setAiReportResult(res.data);
      onReportCreated?.(res.data);
    }).catch((error) => {
      console.error("getAIReport error", error);
      toast.error('AI 보고서 조회 중 오류가 발생했습니다.')
    }).finally(() => {
      setLoading(false);
    });
  }


  const getLandInfo = async () => {
    try {
      const res = await axiosWithAuth.get('/api/land/info', {
        params: { id: landId }
      });
      console.log(res.data[0]);
      setLandInfo(res.data[0]);
    } catch (error) {
      console.error("getLandInfo error", error);
      toast.error('토지 정보 조회 중 오류가 발생했습니다.')
    }
  }

  const getPolygonInfo = async () => {
    try {
      const res = await axiosWithAuth.get('/api/land/polygon', {
        params: { id: landId }
      });
      console.log(res.data);
      setPolygon(res.data);
    } catch (error) {
      console.error("getPolygonInfo error", error);
      toast.error('지도 표시 정보 조회 중 오류가 발생했습니다.')
    }
  }



  const getEstimatedPrice = async () => {
    try {
      const res = await axiosWithAuth.get('/api/land/estimated-price', {
        params: { id: landId }
      });
      console.log(res.data);
      setEstimatedPrice(res.data);
    } catch (error) {
      console.error("getEstimatedPrice error", error);
      toast.error('추정 가격 정보 조회 중 오류가 발생했습니다.')
    }
  }

  const getAIReportDebugInfo = async () => {
    try {
      const res = await axiosWithAuth.post('/api/land/ai-report-debug-info', {
        landId: landId
      });
      console.log(res.data);
      setAiReportDebugInfo(res.data);
      setOpenDebugInfo(true);
    } catch (error) {
      console.error("getAIReportDebugInfo error", error);
      toast.error('AI 상세 보고서 조회 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {

    if (!landId) return;


    if (didRunRef.current) return;
    didRunRef.current = true;

    getLandInfo();
    getPolygonInfo();
    getEstimatedPrice();
    getAIReport();

    // getAIReportDebugInfo();
  }, [landId]);


  const addBookmark = async () => {
    try {
      if (!config) {
        setOpenNeedLogin(true);
        return;
      }
      await axiosWithAuth.post('/api/land/bookmark', {
        landId: landId,
        estimatedPrice: estimatedPrice?.estimatedPrice,
        estimatedPricePer: estimatedPrice?.per,
        deleteYn: isBookmarked ? 'Y' : 'N'
      });
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("addBookmark error", error);
      toast.error('북마크 수정 중 오류가 발생했습니다.')
    }
  }

  const getIdBookmarked = async () => {
    try {
      if (!config) return;
      const res = await axiosWithAuth.get('/api/land/is-bookmarked', {
        params: { landId: landId }
      });
      setIsBookmarked(res.data);
    } catch (error) {
      console.error("getIdBookmarked error", error);
      toast.error('북마크 조회 중 오류가 발생했습니다.')
    }
  }

  useEffect(() => {
    getIdBookmarked();
  }, [])

  const handleDetailReport = () => {
    console.log('handleDetailReport ', config);
    if (!config) {
      setOpenNeedLogin(true);
      return;
    }

    setOpenAIReportDetailDialog(true);

  }

  const sortedItems = useMemo(() => {
    if (aiReportResult) {
      const list = [
        { title: '신축', value: aiReportResult.build },
        { title: '리모델링', value: aiReportResult.remodel },
        { title: '임대', value: aiReportResult.rent }
      ]
        .filter((item) => item.value !== null)
        .sort((a, b) => b.value.grade > a.value.grade ? -1 : 1)
      return list
    }
    return []
  }, [aiReportResult])

  const sortedReportItems = useMemo(() => {
    if (aiReportResult) {
      const list = [
        { title: '신축', value: aiReportResult.build },
        { title: '리모델링', value: aiReportResult.remodel },
        { title: '임대', value: aiReportResult.rent }
      ]
        .filter((item) => item.value !== null)
        .sort((a, b) => b.value.grade > a.value.grade ? -1 : 1)

      if (IS_DEVELOPMENT) {
        return list
      } else {
        return [list[0]]
      }

    }
    return []
  }, [aiReportResult])

  const handleLoad = useCallback((rv: kakao.maps.Roadview) => {
    const pos = rv.getPosition(); // kakao.maps.LatLng
    const currentLat = pos.getLat();
    const currentLng = pos.getLng();
    const pan = bearingFromTo(currentLat, currentLng, polygon?.lat, polygon?.lng);
    rv.setViewpoint({ pan, tilt: 0, zoom: -3 });
  }, [polygon?.lat, polygon?.lng]);



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
            <BuildingShopBIMain />
            <AIReportLogo />
          </div>

          <div className="flex items-center font-s3 text-text-03 divide-x-[1px]   divide-line-03">
            {/* <button className="flex items-center px-[16px] gap-[4px]">
                공유하기
                <ShareIcon color="var(--color-content-03)" className="h-[16px]"/>
              </button> */}

            {
              IS_DEVELOPMENT &&
              <button
                className="flex items-center px-[16px] gap-[4px] text-red-500 font-bold"
                onClick={() => {
                  getAIReportDebugInfo()

                }}
              >
                상세보기 (개발확인용)
              </button>
            }

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
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 px-[24px] pb-[24px] space-y-[24px] overflow-y-auto">
          <div className="flex rounded-[8px] border border-line-02">
            <Roadview
              zoom={-3}
              onInit={handleLoad}
              // onLoad={handleLoad}
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
              position={{ lat: polygon?.lat, lng: polygon?.lng, radius: 200 }}
              className="w-[340px] h-[260px] object-cover rounded-l-[8px]"
            >
              <RoadviewMarker position={{ lat: polygon?.lat, lng: polygon?.lng }} />
            </Roadview>
            {/* <img
              className="w-[320px] h-[220px] object-cover rounded-l-[8px]"
              src={'http://buildingshop.co.kr/img/img_box_bg6.jpg'} alt=""/> */}
            <div className="flex-1 flex flex-col p-[16px]">
              <div className="flex items-center gap-[8px]">
                <p className="font-s1-p">{getJibunAddress(landInfo)}</p>
              </div>
              {
                landInfo?.roadName && (
                  <div className="mt-[4px] flex gap-[6px] items-center">
                    <p className="flex-shrink-0 font-c3-p px-[4px] py-[1px] text-text-03 bg-surface-third">도로명</p>
                    <p className="font-s4 flex items-center text-text-03">{getRoadAddress(landInfo)}</p>
                  </div>
                )
              }
              <div className="mt-[8px] flex items-center justify-between">
                <div className="flex items-center gap-[6px]">
                  {
                    landInfo?.usageName && (
                      <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo?.usageName}</p>
                    )
                  }
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
                          title={specialUsage}
                          className="flex items-center gap-[2px] font-c2-p text-red-500 bg-red-100 rounded-[2px] px-[6px] py-[2px]"
                        >
                          {specialUsage}
                          <CircleQuestionMarkIcon size={14} />
                        </p>
                      </Tooltip>

                    ))
                  }
                  {/* {
                    (landInfo?.relMainUsageName) && (
                      <p className="font-c2-p text-purple-060 bg-purple-010 rounded-[2px] px-[6px] py-[2px]">{landInfo?.relMainUsageName}</p>
                    )
                  } */}
                </div>
                {/* <div className="flex items-center gap-[4px] font-s4 text-text-02">
                  {getBuildingRelInfoText(landInfo)}
                </div> */}
              </div>
              <div className="mt-[8px] flex-col space-y-[5px]">
                <div className="flex-1 flex items-center justify-between">
                  <p className="font-s4 text-text-03">토지면적{landInfo?.relParcelCount > 1 ? ' (합계)' : ''}</p>
                  <p className="font-s4 text-text-02">{getAreaStrWithPyeong(landInfo?.relTotalArea)}</p>
                </div>
                {/* <div className="flex-1 flex items-center justify-between">
                  <p className="font-s4 text-text-03">건축면적{landInfo?.relBuildingCount > 1 ? ' (합계)' : ''}</p>
                  <p className="font-s4 text-text-02">{getAreaStrWithPyeong(landInfo?.relArchAreaSum)}</p>
                </div>         */}
                <div className="flex-1 flex items-center justify-between">
                  <p className="font-s3 text-text-03">연면적{landInfo?.relBuildingCount > 1 ? ' (합계)' : ''}</p>
                  <p className="font-s3 text-text-02">{getAreaStrWithPyeong(landInfo?.relFloorAreaSum)}</p>
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <p className="font-s3 text-text-03">건축물</p>
                  <p className="font-s3 text-text-02">{getBuildingRelInfoText(landInfo)}</p>
                </div>
              </div>
              <div className="mt-[12px] flex border border-line-02 rounded-[4px] flex-1 items-center">
                <div className="flex-1 flex flex-col items-center gap-[4px]">
                  {/* <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">추정가</p> */}
                  <Tooltip
                    title={
                      <p className="">
                        본 자료는 빌딩샵AI가 제공하는 토지 및 매매가 추정 자료로서, <br />법적 효력을 갖는 공식 평가가 아닙니다.<br />
                        투자 판단을 위한 참고용으로만 활용해 주시기 바라며, <br />본 자료는 참고용으로 제공되는 것으로 법적 효력을 가지지 않습니다.
                      </p>
                    }
                  >
                    <div className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px] gap-[2px] flex items-center">
                      추정가
                      <CircleQuestionMarkIcon size={14} />
                    </div>
                  </Tooltip>
                  <p className="font-h2-p text-primary">{estimatedPrice?.estimatedPrice ? krwUnit(estimatedPrice?.estimatedPrice, true) : '-'}</p>
                  <p className="font-c3 text-primary-030">{(estimatedPrice?.estimatedPrice && landInfo) ? krwUnit(Number((estimatedPrice?.estimatedPrice / landInfo?.relTotalArea).toFixed(0)), true) + '/㎡' : '-'}</p>
                </div>
                <VDivider className="h-[56px]" />
                <div className="flex-1 flex flex-col items-center gap-[4px]">
                  <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">공시지가{(landInfo?.relParcelCount > 1 ? ' (평균)' : '')}</p>
                  <p className="font-h2-p">{landInfo?.price ? krwUnit(landInfo.relTotalPrice * landInfo.relTotalArea, true) : '-'}</p>
                  <p className="font-c3 text-text-03">{landInfo?.price ? krwUnit(landInfo.relTotalPrice, true) : '-'}/㎡</p>
                </div>
                <VDivider className="h-[56px]" />
                <div className="flex-1 flex flex-col items-center gap-[4px]">
                  <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">실거래가</p>
                  <p className="font-h2-p">{landInfo?.dealPrice ? krwUnit(landInfo.dealPrice * 10000, true) : '-'}</p>
                  <p className="font-c3 text-text-03">{landInfo?.dealDate ? format(landInfo.dealDate, 'yyyy.MM.dd') : '-'}</p>
                </div>
              </div>

            </div>
          </div>
          {
            loading ?
              <div className="flex flex-col items-center justify-center">
                <DotProgress />
                <p className="font-s2 text-text-03">AI 가 투자적합도를 분석 중입니다...</p>
              </div>
              :
              <>
                <div className="space-y-[4px]">
                  <p className="font-h3">투자 적합도 분석</p>
                  <p className="text-text-03 font-s3">
                    해당 물건을 분석하여 건축 ∙ 리모델링 ∙ 임대 시 적합도를 판단하여 적합도 점수와 함께 AI 평가요약을 작성해 드려요.
                  </p>
                  <div className="mt-[12px] flex p-[16px] rounded-[8px] border border-line-03 gap-[16px]">
                    <div className="w-[236px]">
                      <p className="font-h4">항목 별 적합도</p>
                      <div className="mt-[12px] border-b-line-02 border-b-[1px]" />
                      <div className="mt-[16px] gap-[18px] flex flex-col">
                        {
                          sortedItems?.map((item, index) => (
                            <div key={index} className="flex items-center gap-[8px] justify-between">
                              <p className="font-s2 text-text-02">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}{item.title}</p>
                              {getGradeChip(item.value.grade)}
                            </div>
                          ))
                        }
                        {/* <div className="flex items-center gap-[8px] justify-between">
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
                      </div> */}
                      </div>
                    </div>
                    <div className="w-[1px] bg-line-02" />
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-[12px]">
                        <p className="font-h4">추천항목</p>
                        <VDivider />
                        <p className="font-h4">{sortedItems?.[0]?.title}</p>
                        {getGradeChip(sortedItems?.[0]?.value.grade)}
                      </div>
                      <p className="flex-1 w-full items-center flex justify-center text-[34px] text-primary font-[var(--font-weight-bold)]">
                        {sortedItems?.[0]?.value.grade}
                      </p>
                      <p className="w-full font-s3 bg-surface-second px-[12px] py-[8px] rounded-[2px]">
                        {aiReportResult?.summary}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="">
                  <div className="flex items-center">
                    {sortedReportItems?.map((item, index) => (
                      <TabButton key={index} fontClassName="font-s1" className="flex-1 h-[48px]" selected={selectedTab === index} onClick={() => { setSelectedTab(index) }}>
                        {item.title} 설계 리포트
                      </TabButton>
                    ))}
                  </div>
                  <div className="flex gap-[16px] border-b-line-03 border-b-[1px] border-x-line-03 border-x-[1px] rounded-b-[8px] p-[16px]">
                    <div className="flex-1 space-y-[14px]">
                      <ReportItem title="총사업비" value={krwUnit(sortedReportItems?.[selectedTab]?.value.totalProjectCost || 0, true)} />
                      <ReportItem title="초기자본금" value={krwUnit(sortedReportItems?.[selectedTab]?.value.initialCapital || 0, true)} />
                      <ReportItem title="연간임대수익" value={krwUnit(sortedReportItems?.[selectedTab]?.value.annualRentProfit || 0, true)} />
                      <ReportItem title="개발후임대수익률" value={(sortedReportItems?.[selectedTab]?.value.profitRatio * 100).toFixed(1) + '%'} />
                      <ReportItem title="연간지가상승률(5개년 평균)" value={(sortedReportItems?.[selectedTab]?.value.avgPublicLandPriceGrowthRate * 100).toFixed(1) + '%'} />
                    </div>
                    <div className="w-[1px] bg-line-02" />
                    <div className="flex-1 flex flex-col items-center gap-[12px]">
                      <p className="font-s2">수익률 환산 가치</p>
                      <HDivider />
                      <p className="flex-1 flex items-center justify-center text-[30px] text-primary font-[var(--font-weight-bold)]">{krwUnit(sortedReportItems?.[selectedTab]?.value?.expectedSaleAmount || 0, true)}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-[16px]">
                  <p className="font-h3">AI 분석 리포트</p>
                  <p className="w-full font-b3 text-red-500 bg-red-100 px-[16px] py-[12px] rounded-[4px]">
                    본 사업성 분석 자료는 공공 데이터 및 추정치로 계산한 것으로,
                    해당 자료만으로 정확성과 완전성을 보장할 수 없습니다.<br />
                    최종 사업성 검토는 개인의 자본 상황 등 개별 특수성을 반영하여
                    전문가의 검토를 받으시기 바랍니다.
                  </p>
                  <p className="w-full font-b3 bg-surface-second px-[16px] py-[12px] rounded-[4px]">
                    {aiReportResult?.analysisMessage}
                  </p>
                </div>
              </>
          }

        </div>
        <div className="">
          <HDivider />
          <div className="mx-[16px]">
            <Button
              disabled={aiReportResult === null}
              className="my-[12px] py-[12px] w-full"
              fontSize="font-h4"
              onClick={() => handleDetailReport()}>
              추천 항목 상세 리포트 보기
            </Button>
          </div>
        </div>
      </div>
      <NeedLoginDialog open={openNeedLogin} onClose={() => setOpenNeedLogin(false)} />
      {
        openAIReportDetailDialog &&
        <AIReportDetailDialog open={openAIReportDetailDialog} landId={landId} estimatedPrice={estimatedPrice} onClose={() => setOpenAIReportDetailDialog(false)} />
      }
      {
        openDebugInfo &&
        <AIReportDebugInfoDialog open={openDebugInfo} onClose={() => setOpenDebugInfo(false)} aiReportDebugInfo={aiReportDebugInfo} />
      }
      {/* <Dialog
        maxWidth="xl"
        open={openDebugInfo} onClose={() => setOpenDebugInfo(false)}>

        <p className="px-[20px] py-[20px] font-h3">사업계획서 확인(개발용)</p>
        <div className="p-[20px] h-[100vh] space-y-[16px] overflow-y-auto">
          <div className="flex-1">
            <p className="font-s2 space-y-[4px] bg-gray-200 p-[16px] rounded-[8px]">{aiReportDebugInfo?.devDetailInfo.debugExtraInfo.map((item, index) => (
              <p key={index}>{item}</p>
            ))}</p>
          </div>          
          <div className="flex gap-[16px]">
            <div className="flex-1">
              <p className="font-s2 space-y-[4px] bg-surface-second p-[16px] rounded-[8px]">{aiReportDebugInfo?.devDetailInfo.debugBuildInfo?.map((item, index) => (
                <p key={index}>{item}</p>
              ))}</p>
            </div>
            <div className="flex-1">
              <p className="font-s2 space-y-[4px] bg-surface-second p-[16px] rounded-[8px]">{aiReportDebugInfo?.devDetailInfo.debugRemodelInfo?.map((item, index) => (
                <p key={index}>{item}</p>
              ))}</p>
            </div>       
            <div className="flex-1">
              <p className="font-s2 space-y-[4px] bg-surface-second p-[16px] rounded-[8px]">{aiReportDebugInfo?.devDetailInfo.debugRentInfo?.map((item, index) => (
                <p key={index}>{item}</p>
              ))}</p>
            </div>                 
          </div>
        </div>
          <Button 
            className="my-[12px] py-[12px] w-full" 
            fontSize="font-h4"
            onClick={() => setOpenDebugInfo(false)}>
            확인
          </Button>          
      </Dialog> */}
    </div>
  );
};