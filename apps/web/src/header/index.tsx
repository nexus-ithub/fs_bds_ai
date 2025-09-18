import { BuildingShopBIText, VDivider, AlarmIcon } from "@repo/common"
import { useLocation } from "react-router-dom";

const SUPPORT_MENU = [
  {
    title: "공지사항",
    path: "/support/notice"
  },
  {
    title: "FAQ",
    path: "/support/faq"
  },
  {
    title: "서비스 이용약관",
    path: "/support"
  },
  {
    title: "개인정보 처리방침",
    path: "/support"
  },
]

export const Header = () => {
  const location = useLocation();
  const isSupportPage = location.pathname.startsWith("/support");

  return (
    <div className={`px-[20px] flex items-center justify-between h-[64px] bg-white border-b border-line-03 ${isSupportPage ? "w-[1920px]" : "w-full"}`}>
      <div className="flex items-center gap-[16px]">
        <BuildingShopBIText/>
        {isSupportPage && (
          <>
            <span className="font-s1-p mr-[8px]">고객센터</span>
            {SUPPORT_MENU.map((menu, index) => (
              <>
                <VDivider/>
                <button key={index} className="font-s2-p text-text-04">{menu.title}</button>
              </>
            ))}
          </>
        )}
      </div>
      <div className="flex items-center gap-[16px]">
        <div className="flex items-center gap-[8px]">
          <div className="w-[24px] h-[24px] bg-purple-300 rounded-full">😁</div>
          <p className="flex items-center gap-[4px]">
            <span className="font-s2-p">김이름</span>
            <span className="font-s2 text-text-02">고객님</span>
          </p>
        </div>
        <VDivider colorClassName="bg-line-04"/>
        <button>
          <AlarmIcon/>
        </button>
        <VDivider colorClassName="bg-line-04"/>
        <a 
          href="/support"
          target="_blank"
          rel="noopener noreferrer"
          className="font-s2-p">
          고객센터
        </a>
        <VDivider colorClassName="bg-line-04"/>
        <button className="font-s2-p">
          LOGOUT
        </button>
        <VDivider colorClassName="bg-line-04"/>
        <div className="w-[160px] h-full font-b3 text-text-04 rounded-[2px] border border-line-03">
          빌딩샵 관련 사이트 (TODO)
        </div>
      </div>
    </div>
  )
}