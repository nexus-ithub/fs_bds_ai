import { Row, Title } from "./Row";
import { type PlaceList, type PlaceInfo, ArrowUpIcon, ArrowDownIcon } from "@repo/common";
import { useEffect, useState } from "react";
import React from 'react';

const PlaceInfo = ({title, info = []}: {title: string, info: PlaceInfo[]}) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (info) {
      setOpen(false);
    }
  }, [info]);
  return (
    <>
    {
      info?.length > 0 && (
        <div>
          <Row title={title} content={
            <button 
              onClick={() => setOpen(!open)}
              className="flex items-center gap-[8px]">
              {info?.length}
              {
                open ? (
                  <ArrowUpIcon />
                ) : (
                  <ArrowDownIcon />
                )
              }
            </button>
          } />
          {
            open && (
            <div className="bg-surface-second flex flex-col p-[16px] gap-[16px] rounded-[4px]">
              {
                info?.map((data, index) => (
                  <div
                    className="flex items-center gap-[8px] justify-between"
                    key={index}>
                    <p className="font-s4 text-text-02">{data.name}</p>
                    <p className="font-s4">{data.distance + 'm'}</p>
                  </div>
                ))
              }
            </div>
            )
          }
        </div>
      )
    }
    </>
  )
}

export const Place = React.forwardRef<HTMLDivElement, {place: PlaceList | null}>(({place = null}, ref) => {

  if(!place) {
    return null;
  }

  return (
    <div ref={ref} className="flex flex-col divide-y divide-line-02 border-b border-b-line-02">
      <Title title={`입지`}/>
      {
        (place?.subway?.length > 0 || place?.school?.length > 0 || place?.tour?.length > 0) ? 
        <>
          <PlaceInfo title="버스" info={place?.bus || []} />
          <PlaceInfo title="지하철" info={place?.subway || []} />
          <PlaceInfo title="학교" info={place?.school || []} />
          <PlaceInfo title="주변관광지" info={place?.tour || []} />
        </>
        : (
          <div>
            <p className="h-[300px] flex justify-center items-center font-s2 text-text-03 bg-surface-second">주변 입지 정보가 없습니다.</p>
          </div>
        )
      }
    
    </div>
  )
})

Place.displayName = 'Place';