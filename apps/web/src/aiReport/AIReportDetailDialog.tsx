

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { AIReportLogo, BuildingShopBIText, Button, DotProgress, getAreaStrWithPyeong, getRatioStr, HDivider, krwUnit, VDivider, type AIReportDetail } from "@repo/common";
import { getGradeChip } from "../utils";
import { type EstimatedPrice } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../axiosWithAuth";


export interface AIReportDetailDialogProps {
  open: boolean;
  landId: string;
  estimatedPrice: EstimatedPrice;
  onClose: () => void;
}

const ItemRow = ({title, value}: {title: string, value: string}) => {
  return (
    <div className="flex items-center gap-[8px] justify-between">
      <p className="font-s2 text-text-03">{title}</p>
      <p className="font-s1-p">{value}</p>
    </div>
  )
}

export const AIReportDetailDialog = ({open, landId, estimatedPrice, onClose}: AIReportDetailDialogProps) => {

  const [loading, setLoading] = useState(false);
  const [aiReportDetail, setAiReportDetail] = useState<AIReportDetail | null>(null);
  const axiosInstance = useAxiosWithAuth();

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
      console.error(error);
    }).finally(() => {
      setLoading(false);
    });
  }


  useEffect(() => {
    getAIReportDetail()
  }, [landId, open])

  return (
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
          <BuildingShopBIText/>
          <AIReportLogo/>
        </div>
        <HDivider/>
        { 
          loading ? 
          <div className="flex flex-col items-center justify-center h-[calc(100vh-268px)]">
            <DotProgress/>
          </div>
          :
          <div className="space-y-[24px] px-[24px] max-h-[calc(100vh-268px)] overflow-y-auto py-[24px]">
            <div className="space-y-[6px]">
              <p className="font-h2">추천 항목 상세 리포트</p>
              <p className="font-s2 text-text-03">해당 물건을 분석하여 건축 ∙ 리모델링 ∙ 임대 중 추천하는 항목의 상세 리포트를 제공해 드립니다. </p>
            </div>
            <div className="space-y-[16px]">
              <p className="font-h3">부동산 개요</p>
              <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                <div className="flex-1 space-y-[12px] pr-[16px]">
                  <ItemRow title="주소" value={aiReportDetail?.landInfo?.legDongName + ' ' + aiReportDetail?.landInfo?.jibun}/>
                  <ItemRow title="용도지역" value={aiReportDetail?.landInfo?.usageName || ""}/>
                  <ItemRow title={`대지면적${aiReportDetail?.landInfo?.relParcelCount > 1 ? " (합계)" : ""}`} value={getAreaStrWithPyeong(aiReportDetail?.landInfo?.relTotalArea) || ""}/>
                  <ItemRow title={`법정 용적률/건폐율${aiReportDetail?.landInfo?.relParcelCount > 1 ? " (평균)" : ""}`} value={`${getRatioStr(aiReportDetail?.landInfo?.relWeightedFar)} / ${getRatioStr(aiReportDetail?.landInfo?.relWeightedBcr)}`}/>
                </div>
                <div className="flex-1 space-y-[12px] pl-[16px]">
                  <ItemRow title="건축물/토지개수" value={`${aiReportDetail?.buildingList?.length > 0 ? aiReportDetail?.buildingList?.length + '개' : "없음"} / ${aiReportDetail?.landInfo?.relParcelCount}개`}/>
                  <ItemRow title={`건축면적${aiReportDetail?.buildingList?.length > 1 ? " (합계)" : ""}`} value={aiReportDetail?.buildingList?.length > 0 ? getAreaStrWithPyeong(aiReportDetail?.buildingList?.reduce((a, b) => a + (b.archArea ? Number(b.archArea) : 0), 0)) : "-"}/>
                  <ItemRow title={`연면적${aiReportDetail?.buildingList?.length > 1 ? " (합계)" : ""}`} value={aiReportDetail?.buildingList?.length > 0 ? getAreaStrWithPyeong(aiReportDetail?.buildingList?.reduce((a, b) => a + (b.totalFloorArea ? Number(b.totalFloorArea) : 0), 0)) : "-"}/>
                  <ItemRow title={`설계 용적률/건폐율`} value={aiReportDetail?.buildingList?.length > 0 ? `${getRatioStr(aiReportDetail?.buildingList?.[0]?.floorAreaRatio)} / ${getRatioStr(aiReportDetail?.buildingList?.[0]?.archLandRatio)}` : "-"}/>
                </div>
              </div>
            </div>
            <div className="space-y-[16px]">
              <p className="font-h3">기획설계</p>
              <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                <div className="flex-1 flex flex-col divide-y-[1px] divide-line-02 pr-[16px]">
                  <div className="flex items-center gap-[8px] pb-[12px]">
                    <p className="font-h4">추천항목</p>
                    <VDivider/>
                    <div className="flex gap-[8px]">
                      <p className="font-h4-p">{aiReportDetail?.type === 'rent' ? '임대' : aiReportDetail?.type === 'remodel' ? '리모델링' : '신축'}</p>
                      {getGradeChip(aiReportDetail?.result?.grade)}
                    </div>
                  </div>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{aiReportDetail?.result?.grade}</p>
                </div>
                <div className="flex-1 space-y-[12px] pl-[16px]">
                  <ItemRow title="건축면적" value={getAreaStrWithPyeong(aiReportDetail?.buildInfo?.buildingArea) || ""}/>
                  <ItemRow title="연면적" value={getAreaStrWithPyeong(aiReportDetail?.buildInfo?.upperFloorArea + aiReportDetail?.buildInfo?.lowerFloorArea) || ""}/>
                  <ItemRow title="설계 용적률/건폐율" value={`${getRatioStr(aiReportDetail?.landInfo?.far)} / ${getRatioStr(aiReportDetail?.landInfo?.bcr)}`}/>
                </div>
              </div>
            </div>  
            <div className="space-y-[16px]">
              <p className="font-h3">사업기간</p>
              <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                <div className="h-[120px]">

                </div>
              </div>
            </div>    
            <div className="space-y-[16px]">
              <div className="flex items-center gap-[8px]">
                <p className="font-h3">사업비</p>
                {/* <p className="font-s3 text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[3px]">단위 : 만원</p> */}
              </div>
              <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                  <ItemRow title="토지비" value={krwUnit(aiReportDetail?.value?.landCost.purchaseCost + aiReportDetail?.value?.landCost.agentFee + aiReportDetail?.value?.landCost.acquisitionCost)}/>
                  <ItemRow title="해체관련 비용" value={krwUnit(aiReportDetail?.value?.projectCost.demolitionCost + aiReportDetail?.value?.projectCost.demolitionManagementCost)}/>
                  <ItemRow title="ENG 관련비용 (설계, 감리, PM)" value={krwUnit(aiReportDetail?.value?.projectCost.constructionCost + aiReportDetail?.value?.projectCost.managementCost + aiReportDetail?.value?.projectCost.pmFee)}/>
                  <ItemRow title="금융비용/이자" value={`${krwUnit(aiReportDetail?.value?.loan.loanAmount)} / ${krwUnit(aiReportDetail?.value?.loan.loanInterestPerYear)}`}/>
                  <ItemRow title="기타비용 및 예비비" value={krwUnit(aiReportDetail?.value?.projectCost.reserveFee + aiReportDetail?.value?.projectCost.acquisitionTax)}/>
                </div>
                <div className="flex flex-col flex-1 pl-[16px] divide-y-[1px] divide-line-02">
                  <div className="flex items-center justify-center pb-[12px]">
                    <p className="font-h4">사업비 합계</p>
                  </div>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{
                    krwUnit(
                      aiReportDetail?.value?.landCost.purchaseCost + 
                      aiReportDetail?.value?.landCost.agentFee + 
                      aiReportDetail?.value?.landCost.acquisitionCost + 
                      aiReportDetail?.value?.projectCost.demolitionCost + 
                      aiReportDetail?.value?.projectCost.demolitionManagementCost + 
                      aiReportDetail?.value?.projectCost.constructionCost + 
                      aiReportDetail?.value?.projectCost.managementCost + 
                      aiReportDetail?.value?.projectCost.pmFee 
                      // aiReportDetail?.value?.loan.loanAmount + 
                      // aiReportDetail?.value?.loan.loanInterest + 
                      // aiReportDetail?.value?.projectCost.reserveFee + 
                      // aiReportDetail?.value?.projectCost.acquisitionTax
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
                  <ItemRow title="보증금" value={krwUnit(aiReportDetail?.value?.annualDepositProfit)}/>
                  <ItemRow title="임대수익(임대료, 관리비)" value={krwUnit(aiReportDetail?.value?.annualRentProfit + aiReportDetail?.value?.annualManagementProfit)}/>
                  <ItemRow title="연간지출" value={krwUnit(aiReportDetail?.value?.loan.loanInterestPerYear + aiReportDetail?.tax?.propertyTax + aiReportDetail?.tax?.propertyTaxForBuilding + aiReportDetail?.tax?.comprehensiveRealEstateTax)}/>
                </div>
                <div className="flex flex-col flex-1 pl-[16px] divide-y-[1px] divide-line-02">
                  <div className="flex items-center justify-center pb-[12px]">
                    <p className="font-h4">연간 순이익</p>
                  </div>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{krwUnit(aiReportDetail?.result?.annualProfit, true)}</p>                
                </div>
              </div>
            </div>   
            <div className="space-y-[16px]">
              <p className="font-h3">최종</p>
              <div className="p-[16px] gap-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
                <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                  <p className="font-h4 text-center">연간 순이익</p>
                  <HDivider/>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{krwUnit(aiReportDetail?.result?.annualProfit, true)}</p>                       
                </div>
                <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                  <p className="font-h4 text-center">임대 수익률</p>
                  <HDivider/>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{(aiReportDetail?.result?.rentProfitRatio * 100).toFixed(1)}%</p>                       
                </div>
                <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                  <p className="font-h4 text-center">실투자금 대비 연간수익률</p>
                  <HDivider/>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{(aiReportDetail?.result?.investmentProfitRatio * 100).toFixed(1)}%</p>                       
                </div>
                <div className="flex-1 flex flex-col space-y-[12px]">
                  <p className="font-h4 text-center">예상매각금액</p>
                  <HDivider/>
                  <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">{krwUnit(aiReportDetail?.result?.expectedSaleAmount, true)}</p>                       
                </div>                            
              </div>
            </div>                                                
          </div>
        }
        <HDivider/>
        <div className="w-full flex p-[24px] gap-[10px]">
          <Button variant="bggray" fontSize="font-h4" size="medium" className="flex-1" onClick={() => {onClose()}}>닫기</Button>
          <Button className="flex-1" fontSize="font-h4" size="medium" onClick={() => {}}>설계상담요청하기</Button>
        </div>
    </Dialog>
  )
} 