import { Route, Routes } from "react-router-dom";
import { Profile } from "../myPage/Profile";
import { CheckIcon, HDivider, type User } from "@repo/common";

import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Avatar } from "@mui/material";
import { ChevronDownCustomIcon } from "@repo/common";
import { BookmarkedBds } from "../myPage/BookmarkedBds";
import { BookmarkedReport } from "../myPage/BookmarkedReport";
import useAxiosWithAuth from "../axiosWithAuth";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { MyAdditionalInfo } from "../myPage/MyAdditionalInfo";
import { EditPassword } from "../myPage/EditPassword";
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
  { label: "개인정보", path: "/myPage" },
  { label: "추가정보", path: "/myPage/additional-info" },
  { label: "비밀번호 변경", path: "/myPage/edit-pw" },
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
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? `max-h-[${menuItems.length * 36}px] opacity-100` : 'max-h-0 opacity-0'
        }`}
      >
        <div className="">
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center justify-between block py-[9px] px-[8px] rounded-[4px] transition-colors ${
                  isActive
                    ? 'bg-primary-010 text-primary'
                    : 'text-text-02'
                }`}
              >
                <p className="font-s2">{item.label}</p>
                <CheckIcon size={16} color={isActive ? "#4E52FF" : ""}/>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const MyPage = () => {
  const axiosWithAuth = useAxiosWithAuth();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [bdsCount, setBdsCount] = useState<number>(0);
  const [reportCount, setReportCount] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getTotalBookmarkedBds = async () => {
    try {
      const response = await axiosWithAuth.get('/api/bds/total-bookmarked');
      setBdsCount(response.data);
    } catch (error) {
      console.error('Failed to fetch total bookmarked:', error);
      // toast.error("북마크 총 개수 조회 중 오류 발생");
    }
  }

  const getTotalBookmarkedReport = async () => {
    try {
      const response = await axiosWithAuth.get('/api/land/total-bookmarked');
      setReportCount(response.data);
    } catch (error) {
      console.error('Failed to fetch total bookmarked:', error);
    }
  }

  useEffect(() => {
    getTotalBookmarkedBds();
    getTotalBookmarkedReport();
  }, [])

  return (
    <div className="flex h-full">
      <div className="w-[320px] h-full flex flex-col shrink-0 gap-[32px] p-[24px] border-r border-line-02 overflow-y-auto scrollbar-hover">
        <div className="flex flex-col gap-[16px] px-[20px] pt-[24px] pb-[20px] rounded-[8px] border border-line-02">
          <div className="flex flex-col items-center gap-[12px]">
            <Avatar alt="내 프로필" src={config?.profile} sx={{ width: 64, height: 64 }}/>
            <div className="flex flex-col items-center gap-[4px]">
              <p className="font-s2-p"><span className="font-s1-p mr-[4px]">{config?.name}</span><span className="font-s1 text-text-02">고객님</span></p>
              <p className="font-s2-p">{config?.email}</p>
            </div>
          </div>
          <HDivider colorClassName="bg-line-02"/>
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hover">
        <Routes>
          <Route path="/" element={<Profile />} />
          <Route path="additional-info" element={<MyAdditionalInfo />} />
          <Route path="edit-pw" element={<EditPassword userId={config?.id}/> } />
          <Route path="bookmarked-bds" element={<BookmarkedBds scrollRef={scrollRef}/> } />
          <Route path="bookmarked-report" element={<BookmarkedReport scrollRef={scrollRef} />} />
        </Routes>
      </div>
    </div>
  )
}