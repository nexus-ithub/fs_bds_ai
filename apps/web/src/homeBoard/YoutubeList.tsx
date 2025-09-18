import { useEffect, useState } from "react";
import { TabButton, SubTabButton, HDivider, VDivider, Spinner, YoutubeVideoLogo, ShareIcon, MiniPlayerIcon, FullScreenIcon } from "@repo/common";
import React from "react";
import axios from "axios";
import { API_HOST } from "../constants";
import { PlayIcon } from "@repo/common";
import type { YoutubeVideo } from "@repo/common";
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { formatTimeAgo, formatDuration } from "../../utils";
import { Dialog, DialogActions } from "@mui/material";
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

function formatViews(num: number) {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "억";
  } else if (num >= 10_000) {
    return (num / 10_000).toFixed(1) + "만";
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "천";
  } else {
    return num.toString();
  }
}

export const YoutubeList = ({
  selectedVideo,
  setSelectedVideo,
  openVideoMiniPlayer,
  setOpenVideoMiniPlayer
}: {
  selectedVideo: YoutubeVideo | null;
  setSelectedVideo: (video: YoutubeVideo) => void;
  openVideoMiniPlayer: boolean;
  setOpenVideoMiniPlayer: (open: boolean) => void;
}) => {
  const [selectedFilterTab, setSelectedFilterTab] = useState<number>(0);
  const [order, setOrder] = useState<string>(ORDER[0]);
  const [mainVideo, setMainVideo] = useState<YoutubeVideo | null>(null);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);

  const getVideoList = async () => {
    try {
      const res = await axios.get(`${API_HOST}/api/youtube/list`, {params: {order}});

      console.log("VideoList : res.data >>>>>>>>>>>>", res.data);
      setVideos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getVideoList();  
  }, [order])

  useEffect(() => {
    const getBrandingVideo = async () => {
      try {
        const res = await axios.get(`${API_HOST}/api/youtube/branding`);
        console.log("Branding : res.data >>>>>>>>>>>>", res.data);
        setMainVideo(res.data);
      } catch (error) {
        console.error(error);
      }
    }
    getBrandingVideo();
  }, [])

  return (
    <div className="flex flex-col overflow-auto">
      <div className="flex flex-col gap-[4px] pt-[20px] px-[20px]">
        <p className="font-h3">빌딩의 신</p>
        <p className="font-s4 text-text-03">당신의 빌딩 투자 파트너 박준연 '빌딩의신' 채널에 오신 것을 환영합니다.</p>
        <p className="font-s4 text-text-03">https://www.youtube.com/@빌딩의신</p>
      </div>
      {videos.length > 0 ? (
        <>
          <div className="flex flex-col gap-[12px] p-[20px]">
            <p className="font-h3">추천 영상</p>
            {mainVideo ? (
              <div className="flex flex-col gap-[8px]">
                <div className="relative h-[200px] rounded-[8px] overflow-hidden">
                  <img
                    src={mainVideo.thumbnail}
                    alt="대표영상"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50"></div>
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setSelectedVideo(mainVideo);
                      setOpenVideoMiniPlayer(true);
                    }}>
                    <PlayIcon />
                  </div>
                  <div className="absolute bottom-[12px] right-[14px] flex gap-[12px]">
                    <YoutubeVideoLogo />
                    {/* <ShareIcon className="cursor-pointer"/>
                    <MiniPlayerIcon className="cursor-pointer"/>
                    <FullScreenIcon className="cursor-pointer"/> */}
                  </div>
                </div>
                <p className="font-h3">{mainVideo.title}</p>
                <p className="font-s2 text-text-03">
                  조회수 {formatViews(mainVideo.viewCount || 0)}회 ∙ {formatDistanceToNow(new Date(mainVideo.publishedAt), { locale: ko })} 전
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[8px]">
                <div className="rounded-[8px] bg-surface-third h-[200px] flex items-center justify-center">
                  <Spinner/>
                </div>
                <p className="font-h3">{""}</p>
                <p className="font-s2 text-text-03">
                  조회수 {formatViews(0)}회
                </p>
              </div>
            )}
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
          <div className="flex flex-col gap-[16px] p-[20px]">
            {videos.map((video, index) => (
              <React.Fragment key={index}>
                <div className="flex gap-[12px] items-center justify-between">
                  <div className="relative group w-[154px] h-[86px] shrink-0 rounded-[8px] overflow-hidden">
                    <img src={video.thumbnail} alt="" className="w-full h-full object-cover"/>
                    <span className="absolute bottom-[4px] right-[4px] bg-black/60 text-white font-c3 px-[4px] py-[1px] rounded-[4px]">
                      {formatDuration(video.duration || "")}
                    </span>
                    <div 
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      onClick={() => {
                        setSelectedVideo(video);
                        setOpenVideoMiniPlayer(true);
                      }}
                    >
                      <PlayIcon className="w-[24px] h-[24px]"/>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-[8px]">
                    <p className="font-h4 h-[60px] line-clamp-3">{video.title}</p>
                    <p className="font-s2 text-text-03">조회수 {formatViews(video.viewCount || 0)}회 ∙ {formatTimeAgo(new Date(video.publishedAt))}</p>
                  </div>
                </div>
                {index < videos.length - 1 && <HDivider dashed={true} className="!border-b-line-02"/>}
              </React.Fragment>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-[30px]">
          <div className="flex flex-col items-center gap-[12px]">
            <div className="flex flex-col items-center gap-[2px] text-secondary-040">
              <p className="font-s3">매물 정보를 가져오는데 실패했습니다.</p>
              <p className="font-s3">잠시후 다시 시도해 주세요.</p>
            </div>
            <button 
              onClick={() => getVideoList()}
              className="font-s3 text-primary border border-primary rounded-[4px] px-[12px] py-[8px]"
            >
              다시 시도
            </button>
          </div>
        </div>
      )}
    </div>
  )
}