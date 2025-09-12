import { useState } from "react";
import { TabButton } from "../common/tab";

const TABS = [
  '빌딩샵 매물',
  '빌딩의 신'
]

export const LandInfoGuest = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <div>
      <div className="flex w-full">
        {
          TABS.map((tab, index) => (
            <TabButton
              key={index}
              className="flex-1 py-[11px]"
              selected={index === selectedTab}
              onClick={() => {setSelectedTab(index)}}
            >
              {tab}
              {tab === '빌딩의 신' && <p className="text-primary-040">아이콘 넣기</p>}
            </TabButton>
          ))
        }
      </div>
      <p>비로그인 상태에서 보여주는 페이지</p>
    </div>
  )
}