import { BuildingShopBIText, VDivider, AlarmIcon, HDivider, MenuDropdown, Button } from "@repo/common"
import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, MenuItem, IconButton, Avatar, Dialog } from "@mui/material";
import { useQuery } from "react-query";
import { BUILDINGSHOP_URL, INSTAGRAM_URL, JUNGIN_URL, KAKAO_CHANNEL_URL, NAVER_BLOG_URL, QUERY_KEY_USER, YOUTUBE_CHANNEL_URL } from "../constants";
import type { User } from "@repo/common";
import { getAccessToken, logout } from "../authutil";

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

export const Header = ({user} : {user : User}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSupportPage = location.pathname.startsWith("/support");

  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [logoutConfirm, setLogoutConfirm] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const ProfileRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div className={`fixed top-0 left-0 z-50 w-full px-[20px] flex items-center justify-between h-[64px] bg-white border-b border-line-03`}>
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
        {user && (
          <div className="flex items-center gap-[8px]">
            {/* <button ref={ProfileRef} className="w-[24px] h-[24px] bg-purple-300 rounded-full" onClick={() => {setAnchorEl(ProfileRef.current)}}>😁</button> */}
            <IconButton ref={ProfileRef} onClick={() => {setAnchorEl(ProfileRef.current)}} className="!p-0">
              <Avatar alt="내 프로필" src="/support_header.jpg" sx={{ width: 24, height: 24 }}/>
            </IconButton>
            <p className="flex items-center gap-[4px] cursor-pointer" onClick={() => {setAnchorEl(ProfileRef.current)}}>
              <span className="font-s2-p">{user?.name}</span>
              <span className="font-s2 text-text-02">고객님</span>
            </p>
          </div>
        )}
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
                <p><span className="font-s1 mr-[4px]">{user?.name}</span><span className="font-s1 text-text-02">고객님</span></p>
                <p className="font-s1">{user?.email}</p>
              </div>
            </div>
            <HDivider/>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s1 border-b border-line-03 py-[10px]">계정관리</p>
              <div>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null); navigate('/myPage')}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">개인정보 수정</span></MenuItem>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null); navigate('/myPage/additional-info')}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">추가정보 수정</span></MenuItem>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null)}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">비밀번호 변경</span></MenuItem>
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s1 border-b border-line-03 py-[10px]">관심물건 관리</p>
              <div>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null); navigate('/myPage/bookmarked-bds')}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">빌딩샵 추천매물</span></MenuItem>
                <MenuItem className="!p-0" onClick={() => {setAnchorEl(null); navigate('/myPage/bookmarked-report')}}><span className="font-s2 text-text-02 px-[8px] py-[9px]">저장된 관심물건</span></MenuItem>
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
        {/* <VDivider colorClassName="bg-line-04"/>
        <button>
          <AlarmIcon/>
        </button> */}
        {user && <VDivider colorClassName="bg-line-04"/>}
        <a 
          href="/support"
          target="_blank"
          rel="noopener noreferrer"
          className="font-s2-p">
          고객센터
        </a>
        <VDivider colorClassName="bg-line-04"/>
        {user ? 
          <button className="font-s2-p" onClick={() => {setLogoutConfirm(!logoutConfirm)}}>
            LOGOUT
          </button> 
        : <button className="font-s2-p" onClick={() => {navigate('/login')}}>
            LOGIN
          </button>
        }
        <VDivider colorClassName="bg-line-04"/>
        {/* <div className="w-[160px] h-full font-b3 text-text-04 rounded-[2px] border border-line-03">
          빌딩샵 관련 사이트 (TODO)
        </div> */}
        <MenuDropdown 
          options={[
            { value: "buildingshop", label: "빌딩샵 홈페이지", url: BUILDINGSHOP_URL },
            { value: "jungin", label: "정인부동산 홈페이지", url: JUNGIN_URL },
            { value: "youtube", label: "YouTube 채널", url: YOUTUBE_CHANNEL_URL },
            { value: "kakao", label: "Kakao 채널", url: KAKAO_CHANNEL_URL },
            { value: "naver", label: "네이버 블로그", url: NAVER_BLOG_URL },
            { value: "instagram", label: "인스타그램", url: INSTAGRAM_URL },
          ]}
          value={selectedMenu} 
          onChange={(value, option) => {
            setSelectedMenu(value);
            if (option?.url) {
              window.open(option.url, "_blank", "noopener,noreferrer");
            }
          }}
          placeholder="빌딩샵 관련 사이트"
        />
      </div>
      <Dialog
        open={logoutConfirm}
        onClose={() => {setLogoutConfirm(false)}}
        disableScrollLock={true}
      >
        <div className="flex flex-col gap-[20px] min-w-[300px]">
          <h3 className="font-h3 px-[20px] py-[12px] border-b border-line-03">로그아웃</h3>
          <p className="font-s1 px-[20px]">로그아웃 하시겠습니까?</p>

          <div className="flex justify-end gap-[12px] px-[20px] py-[12px]">
            <Button variant="bggray" className="w-[60px]" onClick={() => {setLogoutConfirm(false)}}>취소</Button>
            <Button className="w-[100px]" onClick={() => {logout(); setLogoutConfirm(false); navigate("/main")}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}