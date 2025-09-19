import { Route, Routes } from "react-router-dom";
import { Profile } from "../myPage/Profile";
import { Board } from "../support/Board";
import { Terms } from "../support/Terms";
import { Privacy } from "../support/Privacy";
import { BoardDetail } from "../support/BoardDetail";
import { HDivider } from "@repo/common";

import { useLocation, Link } from "react-router-dom";
import { Avatar, Accordion, AccordionSummary, AccordionDetails, Typography, List, ListItem, ListItemText } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface MenuItemType {
  label: string;
  path: string; // 클릭 시 이동할 URL
}

interface TogglePanelProps {
  title: string;
  menuItems: MenuItemType[];
  defaultExpanded?: boolean;
}

const TogglePanel = ({ title, menuItems, defaultExpanded = false }: TogglePanelProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
            return (
              <ListItem
                key={index}
                component={Link}
                to={item.path}
                sx={{
                  backgroundColor: isActive ? "rgba(25, 118, 210, 0.1)" : "transparent",
                  "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
                }}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};


export const MyPage = () => {
  return (
    <div className="flex h-full">
      <div className="w-[320px] h-full flex flex-col shrink-0 gap-[32px] p-[24px] border-r border-line-02">
        <div className="flex flex-col gap-[16px] px-[20px] pt-[24px] pb-[20px] rounded-[8px] border border-line-02">
          <div className="flex flex-col items-center gap-[12px]">
            <Avatar alt="내 프로필" src="/support_header.jpg" sx={{ width: 64, height: 64 }}/>
            <div className="flex flex-col items-center gap-[4px]">
              <p className="font-s2-p"><span className="font-s1-p mr-[4px]">김이름</span><span className="font-s1 text-text-02">고객님</span></p>
              <p className="font-s2-p">admin@jungin.com</p>
            </div>
          </div>
          <HDivider className="!border-b-line-02"/>
          <div className="flex flex-col gap-[16px]">
            <p className="font-s1">관심물건</p>
            <div className="flex items-center justify-between gap-[6px]">
              <p className="font-s2 text-text-03">빌딩샵 추천매물</p>
              <p className="font-s2 text-text-02">8</p>
            </div>
            <div className="flex items-center justify-between gap-[6px]">
              <p className="font-s2 text-text-03">저장된 관심물건</p>
              <p className="font-s2 text-text-02">12</p>
            </div>
            <HDivider className="!border-b-line-02" dashed={true}/>
            <div className="flex items-center justify-between gap-[6px]">
              <p className="font-s2 text-text-03">생성한 AI 리포트</p>
              <p className="font-s2 text-text-02">32</p>
            </div>
          </div>
        </div>
        <div>
          
        </div>
      </div>
      <Routes>
        <Route path="/" element={<Profile />} />
        {/* <Route path="notice" element={<Board type="notice" />} />
        <Route path="notice/:id" element={<BoardDetail />} />
        <Route path="faq" element={<Board type="faq" />} />
        <Route path="faq/:id" element={<BoardDetail />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} /> */}
      </Routes>
    </div>
  )
}