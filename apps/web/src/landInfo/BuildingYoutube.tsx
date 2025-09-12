import { useState } from "react";
import { TabButton, SubTabButton, HDivider, VDivider } from "@repo/common";
import React from "react";

const FILTER_TABS = [
  '👍 조회수 많은 순',
  '📆 최근 업로드 순',
  '❤️ 좋아요 많은 순'
]

export const BuildingYoutube = () => {
  const [selectedFilterTab, setSelectedFilterTab] = useState(0);

  return (
    <div className="flex flex-col overflow-auto">
      <div className="flex flex-col gap-[4px] pt-[20px] px-[20px]">
        <p className="font-h3">빌딩의 신</p>
        <p className="font-s4 text-text-03">당신의 빌딩 투자 파트너 박준연 '빌딩의신' 채널에 오신 것을 환영합니다.</p>
        <p className="font-s4 text-text-03">https://www.youtube.com/@빌딩의신</p>
      </div>
      <div className="flex flex-col gap-[12px] p-[20px]">
        <p className="font-h3">추천 영상</p>
        <div className="bg-purple-100 h-[200px]">
          영상
        </div>
        <div className="flex flex-col gap-[8px]">
          <p className="font-h3">영상제목</p>
          <p className="font-s2">조회수랑 며칠전</p>
        </div>
      </div>
      <div className="flex w-full px-[20px]">
        <div className="flex w-full items-center border-t border-b border-line-02">
          {
            FILTER_TABS.map((tab, index) => (
              <React.Fragment key={index}>
                <SubTabButton
                  className="py-[14px] flex items-center justify-center"
                  selected={index === selectedFilterTab}
                  onClick={() => { setSelectedFilterTab(index) }}
                >
                  {tab}
                </SubTabButton>
                {index < FILTER_TABS.length - 1 && (
                  <div className="flex flex-1 items-center justify-center">
                    <VDivider colorClassName="bg-line-03" className="!h-[12px]"/>
                  </div>
                )}
              </React.Fragment>
            ))
          }
        </div>
      </div>
      <div>
        영상 주르륵
      </div>
      <div>
        영상 주르륵
      </div>
      <div>
        영상 주르륵
      </div>
      <div>
        영상 주르륵
      </div>
      <div>
        영상 주르륵
      </div>
    </div>
  )
}