
import { getAreaStrWithPyeong, krwUnit, pricePerM2ToPyong, type LandInfo } from "@repo/common";
import { Row, Title } from "./Row";

export const Land = ({landInfo}: {landInfo: LandInfo}) => {
  return (
    <div className="flex flex-col divide-y divide-line-02">
      <Title title="토지"/>
      <Row title="용도지역" content={landInfo.usageName} />
      <Row title="주용도" content={landInfo.curUse} />
      <Row title="지목" content={landInfo.jimokName} />
      <Row title="면적" content={getAreaStrWithPyeong(landInfo.area)} />
      <Row title="최대용적률" content={"-"} />
      <Row title="최대건폐률" content={"-"} />
      <Row title="도로측면" content={landInfo.roadContact || '-'} />
      <Row title="공시지가" content={
          landInfo.price && landInfo.area ? 
            krwUnit(landInfo.price * landInfo.area, true) + ' (' + krwUnit(landInfo.price) + '/m², ' + krwUnit(pricePerM2ToPyong(landInfo.price)) + '/평)' 
            : '-'
      } />
    </div>
  )
}