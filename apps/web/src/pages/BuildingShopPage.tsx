import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BuildingList } from "../homeBoard/BuildingList";
// import { GNB } from "../components/GNB";

export const BuildingShopPage = () => {
  const navigate = useNavigate();

  // 데스크탑 사이즈로 변경 시 /main으로 리다이렉트
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        navigate('/main');
      }
    };

    // 초기 체크
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navigate]);

  return (
    <div className="h-full flex flex-col pb-[64px]">
      <div className="flex-1 overflow-y-auto scrollbar-hover">
        <BuildingList />
      </div>
      {/* <GNB /> */}
    </div>
  );
};
