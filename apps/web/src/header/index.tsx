import { BuildingShopBIText, VDivider, AlarmIcon, HDivider, MenuDropdown } from "@repo/common"
import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, MenuItem, IconButton, Avatar, Typography, Box, Divider } from "@mui/material";

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
    path: "/support/terms"
  },
  {
    title: "개인정보 처리방침",
    path: "/support/privacy"
  },
]

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSupportPage = location.pathname.startsWith("/support");

  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const ProfileRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={`min-w-[1440px] px-[20px] flex items-center justify-between h-[64px] bg-white border-b border-line-03`}>
      <div className="flex items-center gap-[16px] h-[64px]">
        <button onClick={() => navigate("/main")}>
          <BuildingShopBIText />
        </button>
        {isSupportPage && (
          <>
            <span className="font-s1-p mr-[8px] cursor-pointer" onClick={() => navigate("/support")}>고객센터</span>
            {SUPPORT_MENU.map((menu, index) => (
              <React.Fragment key={index}>
                <VDivider/>
                <button 
                  className={`h-full font-s2-p text-text-04 border-b-[2px] box-border ${location.pathname.startsWith(menu.path) ? "border-b-primary" : "border-b-transparent"}`}
                  onClick={() => navigate(menu.path)}
                >
                  {menu.title}
                </button>
              </React.Fragment>
            ))}
          </>
        )}
      </div>
      <div className="flex items-center gap-[16px]">
        <div className="flex items-center gap-[8px]">
          {/* <button ref={ProfileRef} className="w-[24px] h-[24px] bg-purple-300 rounded-full" onClick={() => {setAnchorEl(ProfileRef.current)}}>😁</button> */}
          <IconButton ref={ProfileRef} onClick={() => {setAnchorEl(ProfileRef.current)}} className="!p-0">
            <Avatar alt="내 프로필" src="/support_header.jpg" sx={{ width: 24, height: 24 }}/>
          </IconButton>
          <p className="flex items-center gap-[4px] cursor-pointer" onClick={() => {setAnchorEl(ProfileRef.current)}}>
            <span className="font-s2-p">김이름</span>
            <span className="font-s2 text-text-02">고객님</span>
          </p>
        </div>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => {setAnchorEl(null)}}
          disableScrollLock={true}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
          PaperProps={{
            className: "mt-[16px] p-[32px]",
          }}
          MenuListProps={{
            disablePadding: true,
          }}
        >
          <div className="flex flex-col gap-[12px]">
            <div className="flex items-center gap-[12px]">
              <Avatar alt="내 프로필" src="/support_header.jpg" sx={{ width: 48, height: 48 }}/>
              <div className="flex flex-col gap-[2px]">
                <p><span className="font-s1 mr-[4px]">김이름</span><span className="font-s1 text-text-02">고객님</span></p>
                <p className="font-s1">admin@jungin.com</p>
              </div>
            </div>
            <HDivider/>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s1 border-b border-line-03 py-[10px]">계정관리</p>
              <div>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null); navigate('/myPage')}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">개인정보 수정</span></MenuItem>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">추가정보 수정</span></MenuItem>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">비밀번호 변경</span></MenuItem>
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s1 border-b border-line-03 py-[10px]">관심물건 관리</p>
              <div>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">빌딩샵 추천매물</span></MenuItem>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">저장된 관심물건</span></MenuItem>
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s1 border-b border-line-03 py-[10px]">AI 리포트</p>
              <div>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">생성한 AI 리포트</span></MenuItem>
              </div>
            </div>
            <HDivider/>
            <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">로그아웃</span></MenuItem>
          </div>
        </Menu>
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
        {/* <div className="w-[160px] h-full font-b3 text-text-04 rounded-[2px] border border-line-03">
          빌딩샵 관련 사이트 (TODO)
        </div> */}
        <MenuDropdown 
          options={[
            { value: 'apple', label: '🍎 사과' },
            { value: 'banana', label: '🍌 바나나' },
            { value: 'orange', label: '🍊 오렌지' },
            { value: 'grape', label: '🍇 포도' },
            { value: 'strawberry', label: '🍓 딸기' },
          ]} 
          value={selectedMenu} 
          onChange={(value) => {setSelectedMenu(value)}}
          placeholder="빌딩샵 관련 사이트"
        />
      </div>
    </div>
  )
}