
import { getAreaStrWithPyeong, getRatioStr, type BuildingInfo } from "@repo/common";
import { Row, Title } from "./Row";
import { useState } from "react";

export const Building = ({buildings}: {buildings: BuildingInfo[]}) => {

  const [index, setIndex] = useState(0);
  const selectedBuilding = buildings.length > 0 ? buildings[index] : null;

  console.log(buildings);
  return (
    <div className="flex flex-col divide-y divide-line-02">
      <Title title="건축물 정보"/>
      {
        buildings?.length > 0 ? 
        <>
          <Row title="용도지역" content={selectedBuilding?.mainUsageName || '-'} />
          <Row title="기타용도" content={selectedBuilding?.etcUsageName || '-'} />
          <Row title="건축면적" content={getAreaStrWithPyeong(selectedBuilding?.archArea)} />
          <Row title="건폐율" content={getRatioStr(selectedBuilding?.archLandRatio)} />
          <Row title="연면적" content={getAreaStrWithPyeong(selectedBuilding?.totalFloorArea)} />
          <Row title="용적률" content={getRatioStr(selectedBuilding?.floorAreaRatio)} />
        </>
        : (
          <div>
            <p className="h-[300px] flex justify-center items-center font-s2 text-text-03">건축물 정보가 없습니다.</p>
          </div>
        )
      }
     
    </div>
  )
}