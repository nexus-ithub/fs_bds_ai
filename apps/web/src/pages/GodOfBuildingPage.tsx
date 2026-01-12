// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { YoutubeList } from "../homeBoard/YoutubeList";
// // import { GNB } from "../components/GNB";
// import { type YoutubeVideo, type PlayerMode, YoutubeLogo } from "@repo/common";
// import { PictureInPicture, PictureInPicture2, X } from "lucide-react";
// import { useMediaQuery } from "@mui/material";

// export const GodOfBuildingPage = () => {
//   const navigate = useNavigate();
//   const [selectedVideo, setSelectedVideo] = useState<YoutubeVideo | null>(null);
//   const [openVideoMiniPlayer, setOpenVideoMiniPlayer] = useState<boolean>(false);
//   const isDesktop = useMediaQuery('(min-width: 768px)');

//   useEffect(() => {
//     // 전체화면 모드가 아니고, 모바일 기기가 아닌 경우에만 리다이렉트
//     const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
//     const isFullscreen = document.fullscreenElement !== null;
//     if (isDesktop && !isMobileDevice && !isFullscreen) {
//       navigate('/main');
//     }
//   }, [isDesktop, navigate]);

//   return (
//     <div className="h-full flex flex-col pb-[64px]">
//       <div className="flex-1 overflow-y-auto scrollbar-hover">
//         <YoutubeList
//           selectedVideo={selectedVideo}
//           setSelectedVideo={(video) => {
//             setSelectedVideo(video);
//           }}
//           openVideoMiniPlayer={openVideoMiniPlayer}
//           setOpenVideoMiniPlayer={setOpenVideoMiniPlayer}
//         />
//       </div>

//       {/* 비디오 플레이어 */}
//       {openVideoMiniPlayer && (
//         <div
//           className={`fixed z-50 bg-white rounded-b-lg overflow-hidden shadow-lg transition-transform duration-300 border border-line-02 top-[64px] left-0 w-full`
//           }
//         >
//           <div className={`flex items-center justify-between py-[7px] border-b border-line-02 h-[36px]`}>
//             <div className="flex items-center gap-[13px] px-[12px] py-[6px]">
//               <p className="font-h4">빌딩의 신</p>
//               <YoutubeLogo width={68} height={15} />
//             </div>
//             <div className="flex items-center gap-[13px] px-[12px]">
//               <button onClick={() => setOpenVideoMiniPlayer(false)}>
//                 <X size={18} />
//               </button>
//             </div>
//           </div>
//           <div className="w-full aspect-video">
//             <iframe
//               src={`https://www.youtube.com/embed/${selectedVideo?.videoId}?autoplay=1`}
//               allow="autoplay; clipboard-write; encrypted-media; gyroscope;"
//               allowFullScreen
//               className="w-full h-full"
//             />
//           </div>
//         </div>
//       )}

//       {/* <GNB /> */}
//     </div>
//   );
// };
