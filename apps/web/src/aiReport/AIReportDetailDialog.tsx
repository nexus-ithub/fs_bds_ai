

import { Dialog } from "@mui/material";
import { AIReportLogo, BuildingShopBIMain, BuildingShopBIText, Button, DotProgress, getAreaStrWithPyeong, getRatioStr, HDivider, krwUnit, VDivider, type AIReportDetail } from "@repo/common";
import { getGradeChip, getSpecialUsageList } from "../utils";
import { type EstimatedPrice } from "@repo/common";
import { useEffect, useMemo, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";
import { ConsultRequestDialog } from "./ConsultRequestDialog";
import { toast } from "react-toastify";


export interface AIReportDetailDialogProps {
  open: boolean;
  landId: string;
  estimatedPrice: EstimatedPrice;
  onClose: () => void;
}

const ItemRow = ({ title, value }: { title: string, value: string }) => {
  return (
    <div className="flex items-center gap-[8px] justify-between">
      <p className="font-s2 text-text-03">{title}</p>
      <p className="font-s1-p">{value}</p>
    </div>
  )
}

const Dot = ({ label = null, isLast = false, variant = "gray" }: { label?: string, isLast?: boolean, color?: string, variant?: "gray" | "primary" | "primary-b" }) => {

  const dotColor = variant === "gray" ? "#585C64" : "var(--primary-050)";
  const borderColor = variant === "gray" ? "var(--gray-020)" : variant === "primary" ? "var(--primary-050)" : "var(--primary-050)";
  const bgColor = variant === "gray" ? "white" : variant === "primary" ? "white" : "var(--primary-050)";
  const textColor = variant === "gray" ? "" : variant === "primary" ? "var(--primary-050)" : "white";


  return (
    <>
      <div className={`absolute ${isLast ? "right-0 translate-x-1/2" : "-translate-x-1/2"} top-[-4px]`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.5" fill="white" stroke={dotColor} stroke-width="3" />
        </svg>
      </div>
      {
        label && (
          <div className={`font-s4 text-text-02 absolute top-[-35px] ${isLast ? "right-0 translate-x-1/2" : "-translate-x-1/2"} whitespace-nowrap border rounded-[4px] px-[8px] py-[4px]`} style={{ borderColor: borderColor, backgroundColor: bgColor }}>
            <p style={{ color: textColor }}>{label}</p>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]" style={{ borderTopColor: borderColor }}></div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[-5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px]" style={{ borderTopColor: bgColor }}></div>
          </div>
        )
      }
    </>
  )
}

export const AIReportDetailDialog = ({ open, landId, estimatedPrice, onClose }: AIReportDetailDialogProps) => {

  const [loading, setLoading] = useState(false);
  const [aiReportDetail, setAiReportDetail] = useState<AIReportDetail | null>(null);
  const axiosInstance = useAxiosWithAuth();
  const [openConsultRequestDialog, setOpenConsultRequestDialog] = useState(false);

  const getAIReportDetail = async () => {

    console.log('request ai report ', landId);
    // const buildingId = buildings?.[0]?.id ?? null;

    const aiReport = {
      landId: landId,
      estimatedPrice: estimatedPrice,
    }

    setLoading(true);
    axiosInstance.post('/api/land/ai-report-detail', aiReport).then((res) => {
      console.log(res.data);
      setAiReportDetail(res.data);
    }).catch((error) => {
      console.error("getAIReportDetail error", error);
      toast.error('AI 상세 보고서 조회 중 오류가 발생했습니다.')
    }).finally(() => {
      setLoading(false);
    });
  }



  const renderDuration = () => {
    if (!aiReportDetail) return;
    const totalMonths = aiReportDetail.value.duration.planningDurationMonths + aiReportDetail.value.duration.designDurationMonths + aiReportDetail.value.duration.constructionDurationMonths;
    // const totalMonths = 10;
    const count = (totalMonths * 2) + 1;
    return (
      <div className="items-center space-y-[16px] w-full">
        <div className="flex items-center gap-[8px] font-s1-p">
          <p className="font-s1-p">총 사업기간</p>
          <VDivider colorClassName="bg-line-03" />
          <p className="font-s1-p">{totalMonths}개월</p>
        </div>
        <HDivider />

        <div className="w-full px-[26px] relative h-[162px] py-[14px]">
          {/* ticks */}
          <div className="w-full flex">
            {
              Array.from({ length: count }).map((_, index) => {
                const isMonthTick = index % 2 === 0;
                const width = (index === count - 1) ? 0 : `${(100 / (count - 1))}%`;
                // console.log('index', index, 'width', width);
                return (
                  <div key={index} className="relative" style={{ width: width }}>
                    {isMonthTick && (
                      <p className="font-c3-p text-text-03 absolute top-[-18px] -translate-x-1/2 whitespace-nowrap">
                        {index / 2}
                      </p>
                    )}
                    {
                      index !== count - 1 && (
                        <div className="w-full h-[4px] bg-primary" />
                      )
                    }
                    {
                      (isMonthTick) && (
                        <div className="w-[2px] h-[128px] bg-line-02 absolute top-[12px] -translate-x-1/2" />
                      )
                    }
                  </div>
                );
              })
            }
          </div>

          {/* center lines */}
          <div className="flex left-[26px] right-[26px] h-[4px] bg-grayscale-020 absolute top-[70px]">
            {
              Array.from({ length: aiReportDetail.value.duration.planningDurationMonths * 2 }).map((_, index) => {
                const width = (index === count - 1) ? 0 : `${(100 / (count - 1))}%`;
                // console.log('index', index, 'width', width);
                return (
                  <div key={index} className="relative" style={{ width: width }}>
                    {
                      index == 0 && <Dot label="기획" />
                    }
                    <div className="w-full h-[4px] bg-content-02" />
                  </div>
                );
              })
            }
            {
              Array.from({ length: aiReportDetail.value.duration.designDurationMonths * 2 }).map((_, index) => {
                const width = (index === count - 1) ? 0 : `${(100 / (count - 1))}%`;
                // console.log('index', index, 'width', width);
                return (
                  <div key={index} className="relative" style={{ width: width }}>
                    {
                      index == 0 && (<Dot label="설계/인허가" />)
                    }
                    {
                      (index == ((aiReportDetail.value.duration.designDurationMonths * 2) - 1)) && (<Dot isLast />)
                    }
                    <div className="w-full h-[4px] bg-content-02" />
                  </div>
                );
              })
            }
          </div>
          {/* bottom lines */}
          <div className="flex left-[26px] right-[26px] h-[4px] bg-grayscale-020 absolute top-[130px]">
            {
              Array.from({ length: (aiReportDetail.value.duration.planningDurationMonths + aiReportDetail.value.duration.designDurationMonths) * 2 }).map((_, index) => {
                const width = (index === count - 1) ? 0 : `${(100 / (count - 1))}%`;
                // console.log('index', index, 'width', width);
                return (
                  <div key={index} className="relative" style={{ width: width }}>
                    {/* {
                      index == 0 && <Dot label="기획"/>
                    } */}
                    <div className="w-full h-[4px] bg-transparent" />
                  </div>
                );
              })
            }
            {
              Array.from({ length: aiReportDetail.value.duration.constructionDurationMonths * 2 }).map((_, index) => {
                const width = (index === count - 1) ? 0 : `${(100 / (count - 1))}%`;
                // console.log('index', index, 'width', width);
                return (
                  <div key={index} className="relative" style={{ width: width }}>
                    {
                      index == 0 && (<Dot label="착공" variant="primary" />)
                    }
                    {
                      (index == ((aiReportDetail.value.duration.constructionDurationMonths * 2) - 1)) && (<Dot label="준공" variant="primary-b" isLast />)
                    }
                    <div className="w-full h-[4px] bg-primary" />
                  </div>
                );
              })
            }
          </div>
        </div>

      </div>
    )
  }

  useEffect(() => {
    getAIReportDetail()
  }, [landId, open])

  const specialUsageList = useMemo(() => {
    if (!aiReportDetail?.landInfo) return [];
    return getSpecialUsageList(aiReportDetail?.landInfo?.usageList);
  }, [aiReportDetail?.landInfo])

  const devBcr = useMemo(() => {
    if (aiReportDetail?.type === 'remodel' || aiReportDetail?.type === 'rent') return aiReportDetail?.buildingList?.[0]?.archLandRatio;
    return aiReportDetail?.landInfo?.relWeightedBcr;
  }, [aiReportDetail])

  const devFar = useMemo(() => {
    if (aiReportDetail?.type === 'remodel' || aiReportDetail?.type === 'rent') return aiReportDetail?.buildingList?.[0]?.floorAreaRatio;
    return aiReportDetail?.landInfo?.relWeightedFar;
  }, [aiReportDetail])

  return (
    <>
      <Dialog
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: '960px',
          },
        }}
        open={open}
        onClose={onClose}
      >
        <div className="px-[24px] h-[64px] flex items-center gap-[8px]">
          <BuildingShopBIMain />
          <AIReportLogo />
        </div>
        <HDivider />
        {
          loading ?
            <div className="flex flex-col items-center justify-center h-[calc(100vh-268px)]">
              <DotProgress />
            </div>
            :
            <div className="space-y-[24px] px-[24px] max-h-[calc(100vh-268px)] overflow-y-auto py-[24px]">
              <div className="space-y-[6px]">
                <p className="font-h2">추천 항목 상세 리포트</p>
                <p className="font-s2 text-text-03">해당 물건을 분석하여 건축 ∙ 리모델링 ∙ 임대 중 추천하는 항목의 상세 리포트를 제공해 드립니다. </p>
              </div>
              <p className="w-full font-s2 text-red-500 bg-red-100 px-[16px] py-[12px] rounded-[4px] space-y-[4px]">
                <p>
                  본 리포트는 수집정보의 업데이트 등에 따라 변경 가능한 자료로
                  정인부동산그룹㈜은 해당 자료의 업데이트에 관한 고지 의무가 없습니다.
                </p>
                <p>
                  또한 해당 리포트는 ‘참고용’ 추정 자료로 법적 효력을 갖지 않으며,
                  본 리포트의 저작권은 정인부동산그룹㈜에 있음을 알려 드립니다.
                </p>
              </p>
              <div className="space-y-[16px]">
                <p className="font-h3">부동산 개요</p>
                <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                  <div className="flex-1 space-y-[12px] pr-[16px]">
                    <ItemRow title="주소" value={aiReportDetail?.landInfo?.legDongName + ' ' + aiReportDetail?.landInfo?.jibun} />
                    <ItemRow title="용도지역" value={aiReportDetail?.landInfo?.usageName || ""} />
                    <ItemRow title={`대지면적${aiReportDetail?.landInfo?.relParcelCount > 1 ? " (합계)" : ""}`} value={getAreaStrWithPyeong(aiReportDetail?.landInfo?.relTotalArea) || ""} />
                    {/* <ItemRow title={`법정 용적률/건폐율${aiReportDetail?.landInfo?.relParcelCount > 1 ? " (평균)" : ""}`} value={`${getRatioStr(aiReportDetail?.landInfo?.relWeightedFar)} / ${getRatioStr(aiReportDetail?.landInfo?.relWeightedBcr)}`} /> */}
                    <ItemRow title={`지역지구`} value={specialUsageList.length > 0 ? specialUsageList.join(', ') : "-"} />
                  </div>
                  <div className="flex-1 space-y-[12px] pl-[16px]">
                    <ItemRow title="건축물/토지개수" value={`${aiReportDetail?.buildingList?.length > 0 ? aiReportDetail?.buildingList?.length + '개' : "없음"} / ${aiReportDetail?.landInfo?.relParcelCount}개`} />
                    <ItemRow title={`건축면적${aiReportDetail?.buildingList?.length > 1 ? " (합계)" : ""}`} value={aiReportDetail?.buildingList?.length > 0 ? getAreaStrWithPyeong(aiReportDetail?.buildingList?.reduce((a, b) => a + (b.archArea ? Number(b.archArea) : 0), 0)) : "-"} />
                    <ItemRow title={`연면적${aiReportDetail?.buildingList?.length > 1 ? " (합계)" : ""}`} value={aiReportDetail?.buildingList?.length > 0 ? getAreaStrWithPyeong(aiReportDetail?.buildingList?.reduce((a, b) => a + (b.totalFloorArea ? Number(b.totalFloorArea) : 0), 0)) : "-"} />
                    <ItemRow title={`현재 용적률/건폐율`} value={aiReportDetail?.buildingList?.length > 0 ? `${getRatioStr(aiReportDetail?.buildingList?.[0]?.floorAreaRatio)} / ${getRatioStr(aiReportDetail?.buildingList?.[0]?.archLandRatio)}` : "-"} />
                  </div>
                </div>
              </div>
              <div className="space-y-[16px]">
                <p className="font-h3">기획설계</p>
                <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                  <div className="flex-1 flex flex-col divide-y-[1px] divide-line-02 pr-[16px]">
                    <div className="flex items-center gap-[8px] pb-[12px]">
                      <p className="font-h4">추천항목</p>
                      <VDivider />
                      <div className="flex gap-[8px]">
                        <p className="font-h4-p">{aiReportDetail?.type === 'rent' ? '임대' : aiReportDetail?.type === 'remodel' ? '리모델링' : '신축'}</p>
                        {getGradeChip(aiReportDetail?.result?.grade)}
                      </div>
                    </div>
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{aiReportDetail?.result?.grade}</p>
                  </div>
                  {
                    aiReportDetail?.type !== 'rent' ? (
                      <div className="flex-1 space-y-[12px] pl-[16px]">
                        <ItemRow title="건축면적" value={getAreaStrWithPyeong(aiReportDetail?.buildInfo?.buildingArea) || ""} />
                        <ItemRow title="연면적" value={getAreaStrWithPyeong(aiReportDetail?.buildInfo?.upperFloorArea + aiReportDetail?.buildInfo?.lowerFloorArea) || ""} />
                        <ItemRow title="설계 용적률/건폐율" value={`${getRatioStr(devFar)} / ${getRatioStr(devBcr)}`} />
                      </div>
                    ) : null
                  }

                </div>
              </div>
              {
                aiReportDetail?.type !== 'rent' ? (
                  <div className="space-y-[16px]">
                    <p className="font-h3">사업기간</p>
                    <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                      {renderDuration()}
                    </div>
                  </div>
                ) : null
              }
              <div className="space-y-[16px]">
                <div className="flex items-center gap-[8px]">
                  <p className="font-h3">사업비</p>
                  {/* <p className="font-s3 text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[3px]">단위 : 만원</p> */}
                </div>
                <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                  <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                    <ItemRow title="토지비" value={krwUnit(aiReportDetail?.value?.landCost.purchaseCost + aiReportDetail?.value?.landCost.agentFee + aiReportDetail?.value?.landCost.acquisitionCost)} />
                    <ItemRow title="해체관련 비용" value={krwUnit(aiReportDetail?.value?.projectCost.demolitionCost + aiReportDetail?.value?.projectCost.demolitionManagementCost)} />
                    <ItemRow title="공사비 및 ENG 용역비 (설계, 감리, PM)" value={krwUnit(aiReportDetail?.value?.projectCost.constructionCost + aiReportDetail?.value?.projectCost.managementCost + aiReportDetail?.value?.projectCost.pmFee)} />
                    <ItemRow title="금융비용/이자" value={`${krwUnit(aiReportDetail?.value?.loan.loanAmount)} / ${krwUnit(aiReportDetail?.value?.loan.loanInterest)}`} />
                    <ItemRow title="기타비용 및 예비비" value={krwUnit(aiReportDetail?.value?.projectCost.reserveFee + aiReportDetail?.value?.projectCost.acquisitionTax)} />

                    {/* <ItemRow title="토지비" value={krwUnit(aiReportDetail?.value?.landCost.purchaseCost + aiReportDetail?.value?.landCost.agentFee + aiReportDetail?.value?.landCost.acquisitionCost)}/>
                  <ItemRow title="해체관련 비용" value={krwUnit(aiReportDetail?.value?.projectCost.demolitionCost + aiReportDetail?.value?.projectCost.demolitionManagementCost)}/>
                  <ItemRow title="ENG 관련비용 (설계, 감리, PM)" value={krwUnit(aiReportDetail?.value?.projectCost.constructionCost + aiReportDetail?.value?.projectCost.managementCost + aiReportDetail?.value?.projectCost.pmFee)}/>
                  <ItemRow title="금융비용/이자" value={`${krwUnit(aiReportDetail?.value?.loan.loanAmount)} / ${krwUnit(aiReportDetail?.value?.loan.loanInterest)}`}/>
                  <ItemRow title="기타비용 및 예비비" value={krwUnit(aiReportDetail?.value?.projectCost.reserveFee + aiReportDetail?.value?.projectCost.acquisitionTax)}/> */}
                  </div>
                  <div className="flex flex-col flex-1 pl-[16px] divide-y-[1px] divide-line-02">
                    <div className="flex items-center justify-center pb-[12px]">
                      <p className="font-h4">총사업비</p>
                    </div>
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{
                      krwUnit(
                        aiReportDetail?.value?.result.totalProjectCost
                      )
                    }</p>
                  </div>
                </div>
              </div>
              <div className="space-y-[16px]">
                <div className="flex items-center gap-[8px]">
                  <p className="font-h3">수익/지출</p>
                  {/* <p className="font-s3 text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[3px]">단위 : 만원</p> */}
                </div>
                <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                  <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                    <ItemRow title="보증금" value={krwUnit(aiReportDetail?.value?.annualDepositProfit)} />
                    <ItemRow title="임대수익(임대료, 관리비)" value={krwUnit(aiReportDetail?.value?.annualRentProfit + aiReportDetail?.value?.annualManagementProfit)} />
                    <ItemRow title="연간지출(이자포함)" value={krwUnit(aiReportDetail?.value?.loan.loanInterestPerYear + aiReportDetail?.tax?.propertyTax + aiReportDetail?.tax?.propertyTaxForBuilding + aiReportDetail?.tax?.comprehensiveRealEstateTax)} />
                  </div>
                  <div className="flex flex-col flex-1 pl-[16px] divide-y-[1px] divide-line-02">
                    <div className="flex items-center justify-center pb-[12px]">
                      <p className="font-h4">연간 순수익(임대수익-연간지출)</p>
                    </div>
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{krwUnit(aiReportDetail?.result?.annualRentProfit - (aiReportDetail?.value?.loan.loanInterestPerYear + aiReportDetail?.tax?.propertyTax + aiReportDetail?.tax?.propertyTaxForBuilding + aiReportDetail?.tax?.comprehensiveRealEstateTax), true)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-[16px]">
                <p className="font-h3">최종</p>
                <div className="p-[16px] gap-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                  <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                    <p className="font-h4 text-center">초기자본금</p>
                    <HDivider />
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{krwUnit(aiReportDetail?.result?.initialCapital, true)}</p>
                  </div>
                  <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                    <p className="font-h4 text-center">임대수익률</p>
                    <HDivider />
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{(aiReportDetail?.result?.profitRatio * 100).toFixed(1)}%</p>
                  </div>
                  {/* <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                  <p className="font-h4 text-center">실투자금 대비 연간수익률</p>
                  <HDivider/>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{(aiReportDetail?.result?.investmentProfitRatio * 100).toFixed(1)}%</p>                       
                </div> */}
                  <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                    <p className="font-h4 text-center">5년 평균 지가 상승률</p>
                    <HDivider />
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{(aiReportDetail?.result?.avgPublicLandPriceGrowthRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="flex-1 flex flex-col space-y-[12px]">
                    <p className="font-h4 text-center">수익률 환산 가치</p>
                    <HDivider />
                    <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{krwUnit(aiReportDetail?.result?.expectedSaleAmount, true)}</p>
                  </div>
                </div>
              </div>
            </div>
        }
        <HDivider />
        <div className="w-full flex p-[24px] gap-[10px]">
          <Button variant="bggray" fontSize="font-h4" size="medium" className="flex-1" onClick={() => { onClose() }}>닫기</Button>
          <Button className="flex-1" fontSize="font-h4" size="medium" onClick={() => { setOpenConsultRequestDialog(true) }}>상담문의</Button>
        </div>

      </Dialog>
      <ConsultRequestDialog open={openConsultRequestDialog} onClose={() => { setOpenConsultRequestDialog(false) }} landId={aiReportDetail?.landInfo?.id} />
    </>

  )
} 