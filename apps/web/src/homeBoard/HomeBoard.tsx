import { useState } from "react";
import { TabButton, YoutubeLogo } from "@repo/common";
import { BuildingList } from "./BuildingList";
import { YoutubeList } from "./YoutubeList";

const MAIN_TABS = [
  '빌딩샵 매물',
  '빌딩의 신'
]

export const HomeBoard = () => {
  const [selectedMainTab, setSelectedMainTab] = useState(0);
  
  return (
    <div className="flex flex-col h-full scrollbar-hover">
      <div className="flex w-full">
        {
          MAIN_TABS.map((tab, index) => (
            <TabButton
              key={index}
              className="flex-1 py-[14px] gap-[10px]"
              selected={index === selectedMainTab}
              onClick={() => {setSelectedMainTab(index)}}
            >
              {tab}
              {tab === '빌딩의 신' && <YoutubeLogo />}
            </TabButton>
          ))
        }
      </div>
      {
        selectedMainTab === 0 && (
          <BuildingList/>
        )
      }
      {
        selectedMainTab === 1 && (
          <YoutubeList/>
        )
      }
    </div>
  )
}