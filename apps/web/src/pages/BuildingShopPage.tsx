// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { BuildingList } from "../homeBoard/BuildingList";
// import { useMediaQuery } from "@mui/material";
// // import { GNB } from "../components/GNB";

// export const BuildingShopPage = () => {
//   const navigate = useNavigate();
//   const isDesktop = useMediaQuery('(min-width: 768px)');

//   // 데스크탑 사이즈로 변경 시 /main으로 리다이렉트
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
//         <BuildingList />
//       </div>
//       {/* <GNB /> */}
//     </div>
//   );
// };
