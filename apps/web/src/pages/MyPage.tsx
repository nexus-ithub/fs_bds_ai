import { Route, Routes, Navigate } from "react-router-dom";
import { Profile } from "../myPage/Profile";
import { CheckIcon, ChevronRightCustomIcon, HDivider, type User } from "@repo/common";

import { useEffect, useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Avatar, useMediaQuery } from "@mui/material";
import { ChevronDownCustomIcon } from "@repo/common";
import { BookmarkedBds } from "../myPage/BookmarkedBds";
import { BookmarkedReport } from "../myPage/BookmarkedReport";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { MyAdditionalInfo } from "../myPage/MyAdditionalInfo";
import { trackError } from "../utils/analytics";
// import { GNB } from "../components/GNB";

interface MenuItemType {
  label: string;
  path: string;
}

interface CustomAccordionProps {
  title: string;
  menuItems: MenuItemType[];
  defaultExpanded?: boolean;
}

const accountMenu: MenuItemType[] = [
  { label: "개인정보 수정", path: "/myPage/profile" },
  { label: "추가정보 수정", path: "/myPage/additional-info" },
  // { label: "비밀번호 변경", path: "/myPage/edit-pw" },
];

const favoriteMenu: MenuItemType[] = [
  { label: "빌딩샵 추천매물", path: "/myPage/bookmarked-bds" },
  { label: "저장된 관심물건", path: "/myPage/bookmarked-report" },
];

// const reportMenu: MenuItemType[] = [
//   { label: "생성한 AI 리포트", path: "/myPage/ai-report" },
// ];

const CustomAccordion = ({ title, menuItems, defaultExpanded = false }: CustomAccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex flex-col gap-[12px]">
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between py-[12px] text-left hover:bg-gray-50 transition-colors border-b border-line-03"
      >
        <p className="font-s1">{title}</p>
        <ChevronDownCustomIcon
          className={`mr-[8px] transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
          width={14}
          height={14}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? `max-h-[${menuItems.length * 36}px] opacity-100` : 'max-h-0 opacity-0'
          }`}
      >
        <div className="">
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center justify-between block py-[9px] px-[8px] rounded-[4px] transition-colors ${isActive
                  ? 'md:bg-primary-010 md:text-primary text-text-02'
                  : 'text-text-02'
                  }`}
              >
                <p className="font-s2">{item.label}</p>
                <div className="hidden md:block">
                  <CheckIcon size={16} color={isActive ? "#4E52FF" : ""} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const MyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const axiosWithAuth = useAxiosWithAuth();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [bdsCount, setBdsCount] = useState<number>(0);
  const [reportCount, setReportCount] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isSubPage = location.pathname !== '/myPage';
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // 현재 페이지 제목 가져오기
  const getPageTitle = () => {
    const allMenus = [...accountMenu, ...favoriteMenu];
    const currentMenu = allMenus.find(menu => menu.path === location.pathname);
    return currentMenu?.label || '';
  };

  const getTotalBookmarkedBds = async () => {
    try {
      const response = await axiosWithAuth.get('/api/bds/total-bookmarked');
      setBdsCount(response.data);
    } catch (error) {
      console.error('Failed to fetch total bookmarked:', error);
      trackError(error, {
        message: '빌딩샵 북마크 총 개수 조회 중 오류 발생',
        endpoint: '/myPage',
        file: 'MyPage.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
    }
  }

  const getTotalBookmarkedReport = async () => {
    try {
      const response = await axiosWithAuth.get('/api/land/total-bookmarked');
      setReportCount(response.data);
    } catch (error) {
      console.error('Failed to fetch total bookmarked:', error);
      trackError(error, {
        message: '관심물건 북마크 총 개수 조회 중 오류 발생',
        endpoint: '/myPage',
        file: 'MyPage.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
    }
  }

  useEffect(() => {
    if (!config) navigate("/")
    getTotalBookmarkedBds();
    getTotalBookmarkedReport();
  }, [config])

  useEffect(() => {
    if (location.pathname === '/myPage' && isDesktop) {
      navigate('/myPage/profile', { replace: true });
    } else if (location.pathname !== '/myPage' && !isDesktop) {
      navigate('/myPage', { replace: true });
    }
  }, [location.pathname, navigate, isDesktop])

  return (
    <>
      <div className="flex h-full pb-[64px] md:pb-0">
        {/* 사이드바: 모바일에서는 메인 페이지일 때만, 데스크탑에서는 항상 */}
        <div className={`w-full md:w-[320px] h-full flex-col shrink-0 gap-[32px] p-[24px] md:border-r border-line-02 overflow-y-auto scrollbar-hover ${isSubPage ? 'hidden md:flex' : 'flex'
          }`}>
          <div className="flex flex-col gap-[16px] px-[20px] pt-[24px] pb-[20px] rounded-[8px] border border-line-02">
            <div className="flex flex-col items-center gap-[12px]">
              <Avatar alt="" src={config?.profile} sx={{ width: 64, height: 64 }} />
              <div className="flex flex-col items-center gap-[4px]">
                <p className="font-s2-p"><span className="font-s1-p mr-[4px]">{config?.name}</span><span className="font-s1 text-text-02">고객님</span></p>
                <p className="font-s2-p">{config?.email}</p>
              </div>
            </div>
            <HDivider colorClassName="bg-line-02" />
            <div className="flex flex-col gap-[16px]">
              <p className="font-s1">관심물건</p>
              <div className="flex items-center justify-between gap-[6px]">
                <p className="font-s2 text-text-03">빌딩샵 추천매물</p>
                <p className="font-s2 text-text-02">{bdsCount}</p>
              </div>
              <div className="flex items-center justify-between gap-[6px]">
                <p className="font-s2 text-text-03">저장된 관심물건</p>
                <p className="font-s2 text-text-02">{reportCount}</p>
              </div>
              {/* <HDivider colorClassName="bg-line-02" dashed={true}/>
            <div className="flex items-center justify-between gap-[6px]">
              <p className="font-s2 text-text-03">생성한 AI 리포트</p>
              <p className="font-s2 text-text-02">32TODO</p>
            </div> */}
          </div>
        </div>
        <CustomAccordion title="계정 관리" menuItems={accountMenu} defaultExpanded />
        <CustomAccordion title="관심물건 관리" menuItems={favoriteMenu} defaultExpanded />
        {/* <CustomAccordion title="AI 리포트" menuItems={reportMenu} defaultExpanded /> */}
      </div>
      {/* 컨텐츠: 모바일에서는 서브페이지일 때만, 데스크탑에서는 항상 */}
      <div className={`flex-1 overflow-y-auto scrollbar-hover ${isSubPage ? 'flex flex-col' : 'hidden md:block'}`}>
        {/* 모바일 헤더 */}
        {isSubPage && (
          <div className="md:hidden flex items-center justify-center p-[16px] border-b border-line-02 relative">
            <button
              onClick={() => navigate('/myPage')}
              className="absolute left-[20px] flex items-center gap-[8px] font-s1-p text-text-01 rotate-180"
            >
              <ChevronRightCustomIcon size={16} />
            </button>
            <p className="font-s1-p">{getPageTitle()}</p>
          </div>
        )}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hover">
          <Routes>
            <Route path="profile" element={<Profile />} />
            <Route path="additional-info" element={<MyAdditionalInfo />} />
            {/* <Route path="edit-pw" element={<EditPassword /> } /> */}
            <Route path="bookmarked-bds" element={<BookmarkedBds scrollRef={scrollRef} /> } />
            <Route path="bookmarked-report" element={<BookmarkedReport scrollRef={scrollRef} />} />
          </Routes>
        </div>
      </div>
    </div>
    {/* <GNB /> */}
    </>
  )
}