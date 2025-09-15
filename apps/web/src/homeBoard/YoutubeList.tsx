import { useEffect, useState } from "react";
import { TabButton, SubTabButton, HDivider, VDivider } from "@repo/common";
import React from "react";
import axios from "axios";
export const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export const YOUTUBE_CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;
export const YOUTUBE_SEARCH_URL = import.meta.env.VITE_YOUTUBE_SEARCH_URL;

const FILTER_TABS = [
  '👍 조회수 많은 순',
  '📆 최근 업로드 순',
  '💯 평점 높은 순'
]
const ORDER = [
  'viewCount',
  'date',
  'rating'
]

export const YoutubeList = () => {
  const [selectedFilterTab, setSelectedFilterTab] = useState<number>(0);
  const [order, setOrder] = useState<string>(ORDER[0]);
  const [mainVideo, setMainVideo] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      // setLoading(true);
      try {
        const res = await axios.get(`/api/youtube/list/${order}`);
        // const data = await res.json();

        console.log(">>>>>>>>>>>>", res);
        // setVideos(res);
      } catch (error) {
        console.error(error);
      } finally {
        // setLoading(false);
      }
    };

    fetchVideos();  
  }, [order])

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
                  onClick={() => { setSelectedFilterTab(index); setOrder(ORDER[index]) }}
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