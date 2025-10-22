

import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { AIReportLogo, BuildingShopBIText, Button, HDivider, VDivider } from "@repo/common";
import { getGradeChip } from "../utils";

export interface AIReportDetailDialogProps {
  open: boolean;
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

export const AIReportDetailDialog = ({open, onClose}: AIReportDetailDialogProps) => {
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
        <div className="space-y-[24px] px-[24px] max-h-[calc(100vh-268px)] overflow-y-auto py-[24px]">
          <div className="space-y-[6px]">
            <p className="font-h2">추천 항목 상세 리포트</p>
            <p className="font-s2 text-text-03">해당 물건을 분석하여 건축 ∙ 리모델링 ∙ 임대 중 추천하는 항목의 상세 리포트를 제공해 드립니다. </p>
          </div>
          <div className="space-y-[16px]">
            <p className="font-h3">부동산 개요</p>
            <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
              <div className="flex-1 space-y-[12px] pr-[16px]">
                <ItemRow title="용도지역" value="0000"/>
                <ItemRow title="대지면적" value="0000"/>
                <ItemRow title="법정 용적률/건폐율" value="0000"/>
              </div>
              <div className="flex-1 space-y-[12px] pl-[16px]">
                <ItemRow title="건축면적" value="0000"/>
                <ItemRow title="연면적" value="0000"/>
                <ItemRow title="설계 용적률/건폐율" value="0000"/>
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
                    <p className="font-h4-p">신축</p>
                    {getGradeChip('A')}
                  </div>
                </div>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">A</p>
              </div>
              <div className="flex-1 space-y-[12px] pl-[16px]">
                <ItemRow title="건축면적" value="0000"/>
                <ItemRow title="연면적" value="0000"/>
                <ItemRow title="설계 용적률/건폐율" value="0000"/>
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
              <p className="font-s3 text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[3px]">단위 : 만원</p>
            </div>
            <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
              <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                <ItemRow title="토지비" value="0000"/>
                <ItemRow title="해체관련 비용" value="0000"/>
                <ItemRow title="ENG 관련비용 (설계, 감리, PM)" value="0000"/>
                <ItemRow title="금융비용" value="0000"/>
                <ItemRow title="기타비용 및 예비비" value="0000"/>
              </div>
              <div className="flex flex-col flex-1 pl-[16px] divide-y-[1px] divide-line-02">
                <div className="flex items-center justify-center pb-[12px]">
                  <p className="font-h4">사업비 합계</p>
                </div>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">0000</p>                
              </div>
            </div>
          </div>    
          <div className="space-y-[16px]">
            <div className="flex items-center gap-[8px]">
              <p className="font-h3">수익/지출</p>
              <p className="font-s3 text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[3px]">단위 : 만원</p>
            </div>
            <div className="p-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
              <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                <ItemRow title="보증금" value="0000"/>
                <ItemRow title="임대수익(평당임대료, 관리비)" value="0000"/>
                <ItemRow title="연간지출" value="0000"/>
              </div>
              <div className="flex flex-col flex-1 pl-[16px] divide-y-[1px] divide-line-02">
                <div className="flex items-center justify-center pb-[12px]">
                  <p className="font-h4">연간 순이익</p>
                </div>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">0000</p>                
              </div>
            </div>
          </div>   
          <div className="space-y-[16px]">
            <p className="font-h3">최종</p>
            <div className="p-[16px] gap-[16px] flex rounded-[8px] border-[1px] border-line-03 divide-x-[1px] divide-line-02">
              <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                <p className="font-h4 text-center">연간 순이익</p>
                <HDivider/>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">0000</p>                       
              </div>
              <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                <p className="font-h4 text-center">실투자금 대비 임대 수익률</p>
                <HDivider/>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">0000</p>                       
              </div>
              <div className="flex-1 flex flex-col space-y-[12px] pr-[16px]">
                <p className="font-h4 text-center">연간 자산상승률</p>
                <HDivider/>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">0000</p>                       
              </div>
              <div className="flex-1 flex flex-col space-y-[12px]">
                <p className="font-h4 text-center">실투자금 대비 연간 수익률</p>
                <HDivider/>
                <p className="flex-1 text-[34px] text-primary font-[var(--font-weight-bold)] flex items-center justify-center">0000</p>                       
              </div>                            
            </div>
          </div>                                                
        </div>
        <HDivider/>
        <div className="w-full flex p-[24px] gap-[10px]">
          <Button variant="bggray" fontSize="font-h4" size="medium" className="flex-1" onClick={() => {onClose()}}>닫기</Button>
          <Button className="flex-1" fontSize="font-h4" size="medium" onClick={() => {}}>설계상담요청하기</Button>
        </div>
    </Dialog>
  )
} 