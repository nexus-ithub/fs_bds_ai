'use client';

import { Avatar } from "@mui/material";
import { useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { CheckIcon, ChevronDownCustomIcon, HDivider, Button } from "@repo/common";
import { type Menu } from "@repo/common";
// import { useQuery } from "@tanstack/react-query";
// import { QUERY_KEY_USER } from "../../constants";
// import { getAccessToken } from "../../authutil";

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
  { label: "관리자 계정", path: "/admin" },
  { label: "회원 관리", path: "/users" },
];

const boardMenu: MenuItemType[] = [
  { label: "공지사항 관리", path: "/board" },
  { label: "FAQ 관리", path: "/faq" },
];

const bdsMenu: MenuItemType[] = [
  { label: "카테고리 관리", path: "/category" },
  { label: "매물 관리", path: "/bds" },
];

const youtubeMenu: MenuItemType[] = [
  { label: "추천 영상 관리", path: "/youtube" },
];

const bdsAIMenu: MenuItemType[] = [
  { label: "에이전트 정보", path: "/agent" },
  { label: "추천 질문", path: "/question" },
  { label: "세션", path: "/session" },
];

const CustomAccordion = ({ title, menuItems, defaultExpanded = false }: CustomAccordionProps) => {
  // const { data : config } = useQuery<User>({
  //   queryKey: [QUERY_KEY_USER, getAccessToken()]
  // })
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const pathname = usePathname();
  const router = useRouter();

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
            const isActive = pathname === item.path;
            return (
              <button
                key={index}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center justify-between block py-[9px] px-[8px] rounded-[4px] transition-colors ${
                  isActive
                    ? 'bg-primary-010 text-primary'
                    : 'text-text-02'
                }`}
              >
                <p className="font-s2">{item.label}</p>
                <CheckIcon size={16} color={isActive ? "#4E52FF" : ""}/>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const router = useRouter();
  
  return (
    <div className="w-[320px] shrink-0 h-full flex flex-col gap-[20px] p-[24px] border-r border-line-02 overflow-y-auto scrollbar-hover">
      <div className="flex flex-col gap-[16px] px-[20px] pt-[24px] pb-[20px] rounded-[8px] border border-line-02">
        <div className="flex flex-col items-center gap-[12px]">
          <Avatar alt="내 프로필" src="" sx={{ width: 72, height: 72 }}/>
          <div className="flex flex-col items-center gap-[4px]">
            <p><span className="font-s1 mr-[4px]">{"김이름"}</span><span className="font-s1 text-primary">마스터</span></p>
            <p className="font-s2">{"이메일@jungin.com"}</p>
          </div>
        </div>
        <HDivider className="!bg-line-02"/>
        <button className="font-h5 text-primary">내 계정 관리</button>
      </div>
      <Button variant="outline" size="medium" fontSize="font-h4" onClick={() => router.push("/")}>DASHBOARD</Button>
      <div className="flex flex-col gap-[16px]">
        <CustomAccordion title="계정 관리" menuItems={accountMenu} defaultExpanded />
        <CustomAccordion title="공지사항•FAQ 관리" menuItems={boardMenu} defaultExpanded />
        <CustomAccordion title="빌딩샵 매물 관리" menuItems={bdsMenu} defaultExpanded />
        <CustomAccordion title="빌딩의 신 관리" menuItems={youtubeMenu} defaultExpanded />
        <CustomAccordion title="빌딩샵 AI 관리" menuItems={bdsAIMenu} defaultExpanded />
      </div>
    </div>
  );
};