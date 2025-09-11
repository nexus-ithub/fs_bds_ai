
import type { LandInfo, LandInfoResp } from "@repo/common";
import { getJibunAddress, getRoadAddress, getAreaStrWithPyeong, Button } from "@repo/common";
import { VDivider } from "../common/divider";
import { krwUnit } from "@repo/common";
import { TabButton } from "../common/tab";
import { useState } from "react";
import { Land } from "./Land";
import { Building } from "./Building";

const TABS = [
  "토지",
  "건물",
  "상권",
  "입지"
]

export const LandInfoCard = ({landInfo = null}: {landInfo: LandInfoResp | null}) => {

  const [selectedTab, setSelectedTab] = useState(0);

  if (!landInfo) {
    return null;
  }
  return (
    <div className="h-full flex flex-col pt-[20px]">
      <div className="px-[20px]">
        {/* <p>{landInfo.id}</p> */}
        <div className="space-y-[8px] ">
          <p className="font-s1-p">{getJibunAddress(landInfo.land)}</p>
          {
            landInfo.land.roadName && (
              <div className="flex gap-[6px] items-center">
                <p className="flex-shrink-0 font-c3-p px-[4px] py-[1px] text-text-03 bg-surface-third">도로명</p>
                <p className="font-s3 flex items-center text-text-03">{getRoadAddress(landInfo.land)}</p>
              </div>
            )
          }
        </div>
        <div className="mt-[14px] flex items-center gap-[6px]">
          {
            landInfo.land.usageName && (
              <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.land.usageName}</p>
            )
          }
          {/* {
            landInfo.usageName && (
              <p className="font-c2-p text-primary-040 bg-primary-010 rounded-[2px] px-[6px] py-[2px]">{landInfo.usageName}</p>
            )
          }         */}
        </div>
        <div className="mt-[10px] flex items-center gap-[5px]">
          <div className="flex-1 flex items-center justify-between">
            <p className="font-s4 text-text-03">토지면적</p>
            <p className="font-s4 text-text-02">{getAreaStrWithPyeong(landInfo.land.area)}</p>
          </div>
          <VDivider colorClassName="bg-line-03"/>
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
            <p className="font-h2-p">{krwUnit(landInfo.land.price * landInfo.land.area, true)}</p>
            <p className="font-c3 text-primary-030">{krwUnit(landInfo.land.price)}</p>
          </div>
          <VDivider className="h-[56px]"/>
          <div className="flex-1 flex flex-col items-center gap-[6px]">
            <p className="font-c2-p text-text-02 bg-surface-second rounded-[2px] px-[6px] py-[2px]">실거래가</p>
            <p className="font-h2-p text-primary">??억</p>
            <p className="font-c3 text-primary-030">xxxx.xx.xx</p>
          </div>        
        </div>

        <Button className="w-full mt-[16px] py-[11px]">
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
                onClick={() => {setSelectedTab(index)}}
              >
                {tab}
              </TabButton>
            ))
          }
        </div>
        <div className="pt-[16px] flex-1 min-h-0 space-y-[33px] overflow-y-auto px-[20px]">
          <Land landInfo={landInfo.land} />
          <Building buildings={landInfo.buildings} />
        </div>
      </div>
    </div>
  )
}