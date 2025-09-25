import { ArrowDown, Button, getAreaStrWithPyeong, getBuildingCreateDate, getRatioStr, type BuildingInfo } from "@repo/common";
import { Row, Title } from "./Row";
import { useEffect, useState } from "react";
import { Dialog, DialogActions } from "@mui/material";
import { Check } from 'lucide-react';
import React from 'react';
import { format } from "date-fns";

export const Building = React.forwardRef<HTMLDivElement, { buildings: BuildingInfo[] }>(({buildings}, ref) => {

  const [index, setIndex] = useState(0);
  const selectedBuilding = buildings.length > 0 ? buildings[index] : null;
  const [openSelect, setOpenSelect] = useState(false);

  useEffect(() => {
    if (buildings) {
      setIndex(0);
    }
  }, [buildings]);

  const getBuildingCreateDateStr = (date: string) => {
    const buildingCreateDate = getBuildingCreateDate(date);
    return buildingCreateDate ? format(buildingCreateDate, 'yyyy년 MM월 dd일') : '-';
  }

  // console.log(buildings);
  return (
    <div ref={ref} className="flex flex-col divide-y divide-line-02 border-b border-b-line-02">
      <div className="flex items-center justify-between">
        <Title title={`건축물 정보 ${buildings.length > 0 ? `${buildings.length}` : ''}`}/>
        {/* {
          buildings.length > 1 && (
            <button 
              onClick={() => setOpenSelect(true)}
              className="px-[6px] py-[4px] flex items-center gap-[8px] font-s2 text-text-02 border border-line-03 rounded-[4px]">
              <p>건축물 선택 ({index + 1} / {buildings.length})</p>  
              <ArrowDown/>
            </button>
          )
        } */}
      </div>
      {
        buildings?.length > 0 ? 
        <>
          <Row title="빌딩이름" 
            content={        
              <>
              {
                buildings.length > 1 ? (
                  <button
                    className="flex items-center gap-[8px]"
                    onClick={() => setOpenSelect(true)}
                  >
                    <p>{selectedBuilding?.buildingName || '-'}</p>  
                    <ArrowDown/>
                  </button>
                ) :
                <p>{selectedBuilding?.buildingName || '-'}</p>
              }
              </>
            } />
          <Row title="동이름" content={selectedBuilding?.dongName || '-'} />
          <Row title="용도지역" content={selectedBuilding?.mainUsageName || '-'} />
          <Row title="기타용도" content={selectedBuilding?.etcUsageName || '-'} />
          <Row title="건축면적" content={getAreaStrWithPyeong(selectedBuilding?.archArea)} />
          <Row title="건폐율" content={getRatioStr(selectedBuilding?.archLandRatio)} />
          <Row title="연면적" content={getAreaStrWithPyeong(selectedBuilding?.totalFloorArea)} />
          <Row title="용적률" content={getRatioStr(selectedBuilding?.floorAreaRatio)} />
          <Row title="준공년도" content={getBuildingCreateDateStr(selectedBuilding?.useApprovalDate)} />
        </>
        : (
          <div>
            <p className="h-[300px] flex justify-center items-center font-s2 text-text-03 bg-surface-second">건축물 정보가 없습니다.</p>
          </div>
        )
      }
      <Dialog 
        open={openSelect} 
        onClose={() => setOpenSelect(false)}
      >
        <div className="flex flex-col items-center justify-between p-[20px] gap-[16px] min-w-[520px]">
          <p className="font-h2">건축물 선택</p>
          <div className="font-s2 flex flex-col w-full max-h-[280px] overflow-auto divide-y divide-line-02 border border-line-03">
            <table>
              <thead className="sticky top-0 z-[1] text-text-02 bg-surface-second">
                <tr>
                  <th className="text-left px-[8px] py-[6px]">건축물 이름</th>
                  <th className="text-left px-[8px] py-[4px]">동이름</th>
                  <th className="text-left px-[8px] py-[4px]"></th>
                </tr>
              </thead>
              <tbody className="text-text-02 divide-y divide-line-02">
                {
                  buildings.map((building, i) => (
                    <tr
                      onClick={() => {
                        setIndex(i);
                        setOpenSelect(false);
                      }} 
                      key={i} className="hover:bg-line-02 cursor-pointer">
                      <td className="text-left px-[8px] py-[6px]">{building.buildingName}</td>
                      <td className="text-left px-[8px] py-[4px]">{building.dongName}</td>
                      <td className="flex items-center justify-end text-right px-[8px] py-[4px]">{i === index && <Check size={20}/>}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

        </div>
        <DialogActions>
          <Button onClick={() => setOpenSelect(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
})

Building.displayName = 'Building';