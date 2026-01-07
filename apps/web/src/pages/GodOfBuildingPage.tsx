import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { YoutubeList } from "../homeBoard/YoutubeList";
// import { GNB } from "../components/GNB";
import { type YoutubeVideo, type PlayerMode, YoutubeLogo } from "@repo/common";
import { PictureInPicture, PictureInPicture2, X } from "lucide-react";

export const GodOfBuildingPage = () => {
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
  const [openVideoMiniPlayer, setOpenVideoMiniPlayer] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<PlayerMode>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        navigate('/main');
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  return (
    <div className="h-full flex flex-col pb-[64px]">
      <div className="flex-1 overflow-y-auto scrollbar-hover">
        <YoutubeList
          selectedVideo={selectedVideo}
          setSelectedVideo={(video) => {
            setSelectedVideo(video);
            setPlayerMode("large");
          }}
          openVideoMiniPlayer={openVideoMiniPlayer}
          setOpenVideoMiniPlayer={setOpenVideoMiniPlayer}
        />
      </div>

      {/* 비디오 플레이어 */}
      {openVideoMiniPlayer && (
        <div
          className={`fixed z-50 bg-white rounded-lg overflow-hidden shadow-lg transition-transform duration-300 border border-line-02
            ${playerMode === "large"
              ? "left-[30%] top-[17%] w-[80%] h-[605px] max-w-[960px] aspect-video scale-100"
              : "bottom-2 right-2 w-[480px] h-[320px]"}`
          }
        >
          <div className={`flex items-center justify-between py-[7px] border-b border-line-02 ${playerMode === "mini" ? "h-[44px]" : "h-[64px]"}`}>
            <div className="flex items-center gap-[13px] px-[12px] py-[14px]">
              <p className={playerMode === "mini" ? "font-h4" : "font-h3"}>빌딩의 신</p>
              <YoutubeLogo width={playerMode === "mini" ? 64 : 82} height={playerMode === "mini" ? 14 : 20} />
            </div>
            <div className={`flex items-center gap-[13px] ${playerMode === "mini" ? "px-[12px]" : "px-[20px]"}`}>
              {playerMode === "mini" ? (
                <button onClick={() => setPlayerMode("large")}>
                  <PictureInPicture2 size={20} />
                </button>
              ) : (
                <button onClick={() => setPlayerMode("mini")}>
                  <PictureInPicture size={20} />
                </button>
              )}
              <button onClick={() => setOpenVideoMiniPlayer(false)}>
                <X size={20} />
              </button>
            </div>
          </div>
          <div className={playerMode === "large" ? "w-[960px] h-[540px]" : "w-[488px] h-[275px]"}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo?.videoId}?autoplay=1`}
              allow="autoplay; clipboard-write; encrypted-media; gyroscope;"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* <GNB /> */}
    </div>
  );
};
