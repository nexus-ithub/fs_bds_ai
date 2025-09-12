
import { ArrowDown, Button, type DistrictInfo } from "@repo/common";
import { Row, Title } from "./Row";
import { useEffect, useState } from "react";
import { Dialog, DialogActions } from "@mui/material";
import { Check } from 'lucide-react';

export const BusinessDistrict = ({businessDistrict = []}: {businessDistrict: DistrictInfo[]}) => {

  const [index, setIndex] = useState(0);
  const selectedDistrict = businessDistrict.length > 0 ? businessDistrict[index] : null;
  const [openSelect, setOpenSelect] = useState(false);

  useEffect(() => {
    if (businessDistrict) {
      setIndex(0);
    }
  }, [businessDistrict]);

  // console.log(buildings);
  return (
    <div className="flex flex-col divide-y divide-line-02 border-b border-b-line-02">
      <div className="flex items-center justify-between">
        <Title title={`상권 ${businessDistrict.length > 0 ? `${businessDistrict.length}` : ''}`}/>
        {/* {
          businessDistrict.length > 1 && (
            <button 
              onClick={() => setOpenSelect(true)}
              className="px-[6px] py-[4px] flex items-center gap-[8px] font-s2 text-text-02 border border-line-03 rounded-[4px]">
              <p>건축물 선택 ({index + 1} / {businessDistrict.length})</p>  
              <ArrowDown/>
            </button>
          )
        } */}
    
      </div>
      {
        businessDistrict?.length > 0 ? 
        <>
          <Row title="상권명" 
            content={
              <>
              {
                businessDistrict.length > 1 ? (
                  <button
                    className="flex items-center gap-[8px]"
                    onClick={() => setOpenSelect(true)}
                  >
                    <p>{selectedDistrict?.name || '-'}</p>  
                    <ArrowDown/>
                  </button>
                ) :
                <p>{selectedDistrict?.name || '-'}</p>
              }
              </>
            } />
          <Row title="상권구분" content={selectedDistrict?.divCodeName || '-'} />
          <Row title="거리" content={selectedDistrict?.distance?.toFixed(0) + 'm'} />
          <Row title="유동인구" content={Number(Number(selectedDistrict?.totalFootPrintPerHa)?.toFixed(0)).toLocaleString() + '명/ha'} />
          <Row title="유동인구(일평균)" content={Number(Number(selectedDistrict?.avgDailyCount)?.toFixed(0)).toLocaleString() + '명'} />
        </>
        : (
          <div>
            <p className="h-[300px] flex justify-center items-center font-s2 text-text-03 bg-surface-second">주변 상권 정보가 없습니다.</p>
          </div>
        )
      }
      <Dialog 
        open={openSelect} 
        onClose={() => setOpenSelect(false)}
      >
        <div className="flex flex-col items-center justify-between p-[20px] gap-[16px] min-w-[520px]">
          <p className="font-h2">상권 선택</p>
          <div className="font-s2 flex flex-col w-full max-h-[280px] overflow-auto divide-y divide-line-02 border border-line-03">
            <table>
              <thead className="sticky top-0 z-[1] text-text-02 bg-surface-second">
                <tr>
                  <th className="text-left px-[8px] py-[6px]">상권명</th>
                  <th className="text-left px-[8px] py-[4px]">상권구분</th>
                  <th className="text-left px-[8px] py-[4px]">거리</th>
                  <th className="text-left px-[8px] py-[4px]"></th>
                </tr>
              </thead>
              <tbody className="text-text-02 divide-y divide-line-02">
                {
                  businessDistrict.map((district, i) => (
                    <tr
                      onClick={() => {
                        setIndex(i);
                        setOpenSelect(false);
                      }} 
                      key={i} className="hover:bg-line-02 cursor-pointer">
                      <td className="text-left px-[8px] py-[6px]">{district.name}</td>
                      <td className="text-left px-[8px] py-[4px]">{district.divCodeName}</td>
                      <td className="text-left px-[8px] py-[4px]">{district.distance?.toFixed(0) + 'm'}</td>
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
}