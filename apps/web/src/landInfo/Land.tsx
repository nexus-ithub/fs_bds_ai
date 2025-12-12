import { getAreaStrWithPyeong,  getUsageString,  krwUnit, pricePerM2ToPyong, type LandInfo } from "@repo/common";
import { Row, Title } from "./Row";
import React from "react";

export const Land = React.forwardRef<HTMLDivElement, { landInfo: LandInfo }>(
  ({ landInfo }, ref) => {
    return (
      <div ref={ref} className="space-y-[20px]">
        <div
          className="flex flex-col divide-y divide-line-02 border-b border-line-02"
        >
          <Title title="토지" />
          <Row title="용도지역" content={landInfo.usageName || '-'} />
          <Row title="주용도" content={landInfo.curUse || '-'}/>
          <Row title="지목" content={landInfo.jimokName || '-'} />
          <Row title="면적" content={getAreaStrWithPyeong(landInfo.area)} />
          <Row title="최대용적률" content={landInfo.far ? landInfo.far + '%' : '-'} />
          <Row title="최대건폐률" content={landInfo.bcr ? landInfo.bcr + '%' : '-'} />
          <Row title="도로측면" content={landInfo.roadContact || '-'} />
          <Row title="공시지가" content={
            landInfo.price && landInfo.area ? 
              krwUnit(landInfo.price * landInfo.area, true) + ' (' + krwUnit(landInfo.price, true) + '/㎡, ' + krwUnit(pricePerM2ToPyong(landInfo.price), true) + '/평)' 
              : '-'
          } />
        </div>
        <div
          className=""
        >
          <Title title="토지이용계획" />
          <div className="flex flex-col divide-y divide-line-02 border-b border-line-02">
            <p className="font-h5 py-[12px]">국토의 계획 및 이용에 관한 법률</p>
            <Row title="포함" content={getUsageString(landInfo.usageList, '포함', true)} />
            <Row title="저촉" content={getUsageString(landInfo.usageList, '저촉', true)} />
            <Row title="접함" content={getUsageString(landInfo.usageList, '접함', true)} />
          </div>
          <div className="flex flex-col divide-y divide-line-02 border-b border-line-02">
            <p className="font-h5 py-[12px]">기타법률</p>
            <Row title="포함" content={getUsageString(landInfo.usageList, '포함', false)} />
            <Row title="저촉" content={getUsageString(landInfo.usageList, '저촉', false)} />
            <Row title="접함" content={getUsageString(landInfo.usageList, '접함', false)} />
          </div>
        </div>        
      </div>

    )
  }
)

Land.displayName = "Land";