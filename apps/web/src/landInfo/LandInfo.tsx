
import type { LandInfo } from "@repo/common";
import { getJibunAddress, getRoadAddress, getAreaStrWithPyeong, Button } from "@repo/common";
import { VDivider } from "../common/divider";
import { krwUnit } from "@repo/common";


export const LandInfoCard = ({landInfo = null}: {landInfo: LandInfo | null}) => {
  if (!landInfo) {
    return null;
  }
  return (
    <div className="flex flex-col p-[20px]">
      {/* <p>{landInfo.id}</p> */}
      <div className="space-y-[8px]">
        <p className="font-s1-p">{getJibunAddress(landInfo)}</p>
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
        {/* {
          landInfo.usageName && (
            <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.usageName}</p>
          )
        }         */}
      </div>
      <div className="mt-[10px] flex items-center gap-[12px]">
        <div className="flex-1 flex items-center justify-between">
          <p className="font-s4 text-text-03">토지면적</p>
          <p className="font-s4 text-text-02">{getAreaStrWithPyeong(landInfo.area)}</p>
        </div>
        <VDivider/>
        <div className="flex-1 flex items-center justify-between">
          <p className="font-s4 text-text-03">건축면적</p>
          <p className="font-s4 text-text-02">{getAreaStrWithPyeong(null)}</p>
        </div>        
      </div>

      <div className="mt-[16px] flex border border-line-02 rounded-[4px] py-[14px] px-[8px]">
        <div className="flex-1 flex flex-col items-center gap-[6px]">
          <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">추정가</p>
          <p className="font-h2-p text-primary">??억</p>
          <p className="font-c3 text-primary-030">공시지가 대비 xx 배</p>
        </div>
        <VDivider className="h-[56px]"/>
        <div className="flex-1 flex flex-col items-center gap-[6px]">
          <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">공시지가</p>
          <p className="font-h2-p">{krwUnit(landInfo.price * landInfo.area, true)}</p>
          <p className="font-c3 text-primary-030">{krwUnit(landInfo.price)}</p>
        </div>
        <VDivider className="h-[56px]"/>
        <div className="flex-1 flex flex-col items-center gap-[6px]">
          <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">실거래가</p>
          <p className="font-h2-p text-primary">??억</p>
          <p className="font-c3 text-primary-030">xxxx.xx.xx</p>
        </div>        
      </div>

      <Button className="">
        AI 설계 • 임대 분석 리포트
      </Button>


      {/* <p>{landInfo.jimokName}</p>
      <p>{landInfo.curUse}</p>
      <p>{landInfo.height}</p>
      <p>{landInfo.roadContact}</p>
      <p>{landInfo.price}</p>
      <p>{landInfo.shape}</p> */}
    </div>
  )
}