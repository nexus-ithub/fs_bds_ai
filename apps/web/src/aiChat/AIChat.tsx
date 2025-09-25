import { useRef, useState, useEffect } from "react";
import { Button, VDivider, CloseIcon, type ChatMessage, SendIcon, ChevronDownCustomIcon, MenuIcon, AILogo } from "@repo/common";
import { Menu, MenuItem, IconButton } from "@mui/material";

const HistorySample = [
  {label: "채팅1번이고 이름 길게길게길게 더어어어 길게", id: 1},
  {label: "채팅2도 기이이이이이이이일게 기이이이이이일게", id: 2},
  {label: "채팅3", id: 3},
  {label: "채팅4", id: 4},
  {label: "채팅5", id: 5},
]

interface AIChatProps {
  open: boolean;
  onClose: () => void;
}

interface MenuItemType {
  label: string;
  id: number;
}

interface CustomAccordionProps {
  title: string;
  menuItems: MenuItemType[];
  defaultExpanded?: boolean;
}

export const AIChat = ({open, onClose}: AIChatProps) => {
  const [mounted, setMounted] = useState(false);
  const [chatHistory, setChatHistory] = useState<Record<string, string[]>>({});
  const [questionInput, setQuestionInput] = useState<string>('');
  const [currentChat, setCurrentChat] = useState<ChatMessage[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const CustomAccordion = ({ title, menuItems, defaultExpanded = false }: CustomAccordionProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null); // 추가
  
    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };
  
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, itemId: number) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedMenuItemId(itemId); // 선택된 아이템 ID 저장
    };
  
    const handleMenuClose = () => {
      setAnchorEl(null);
      setSelectedMenuItemId(null); // 메뉴 닫을 때 초기화
    };
  
    return (
      <div className="flex flex-col gap-[12px]">
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between py-[12px] text-left transition-colors border-b border-line-03"
        >
          <p className="font-s2">{title}</p>
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
          <div>
            {menuItems.map((item, index) => {
              const isActive = selectedChatId === item.id;
              const isMenuOpen = selectedMenuItemId === item.id; // 현재 아이템의 메뉴가 열렸는지 확인
              
              return (
                <button
                  key={index}
                  className={`group w-full flex items-center justify-between gap-[6px] block py-[9px] px-[8px] rounded-[4px] transition-colors ${
                    isActive
                      ? 'bg-primary-010 text-primary'
                      : 'text-text-02'
                  }`}
                  onClick={() => setSelectedChatId(item.id)}
                >
                  <p className={`font-s2 ${isActive ? "text-primary" : "text-text-02"} truncate`}>
                    {item.label}
                  </p>
                  <button 
                    className={`transition-opacity ${
                      isMenuOpen || 'group-hover:opacity-100'
                    } ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} // 메뉴가 열렸거나 hover시 표시
                    onClick={(event) => handleMenuOpen(event, item.id)}
                  >
                    <MenuIcon/>
                  </button>
                </button>
              );
            })}
          </div>
        </div>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose} // 수정된 핸들러 사용
          disableScrollLock
          container={panelRef.current}
        >
          <MenuItem onClick={() => {
            // 여기서 selectedMenuItemId를 사용해서 특정 아이템에 대한 삭제 작업 수행
            console.log('삭제할 아이템 ID:', selectedMenuItemId);
            handleMenuClose();
          }}>
            삭제
          </MenuItem>
          <MenuItem onClick={() => {
            // 다른 메뉴 액션
            console.log('다른 액션 아이템 ID:', selectedMenuItemId);
            handleMenuClose();
          }}>
            수정
          </MenuItem>
        </Menu>
      </div>
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className="fixed inset-y-0 top-[64px] right-0 z-[40] flex justify-end">
      <div className={`
          flex flex-col h-full bg-white rounded-l-[12px]
          shadow-[-16px_0_32px_0_rgba(0,0,0,0.08)]
          transform transition-transform duration-200 ease-out
          ${mounted && open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-[24px] h-[64px] border-b border-line-02 flex-shrink-0">
          <div className="flex items-center h-full gap-[12px]">
            <AILogo/>
            <p className="font-s2-p text-text-01">빌딩샵 AI</p>
            <VDivider className="!h-[12px]" colorClassName="bg-line-04"/>
            <p className="font-s2 text-text-03">부동산 매매 및 설계전문 빌딩샵에서 제공하는 부동산 전문 AI 입니다.</p>
          </div>
          <div className="flex items-center gap-[12px]">
            <Button variant="outlinegray" className="!text-text-02" onClick={() => {setCurrentChat([])}}>NEW CHAT</Button>
            <button onClick={onClose}><CloseIcon/></button>
          </div>
        </div>    
        <div className="flex h-[calc(100%-64px)]">
          <div className="w-[252px] p-[20px] border-r border-line-02">
            <CustomAccordion title="HISTORY" menuItems={HistorySample} defaultExpanded={true}/>
          </div>
          <div className="w-[768px] flex flex-col">
            <div ref={chatContainerRef} className="flex-1 px-[48px] overflow-y-auto scrollbar-hover">
              {currentChat.length === 0 ? (
                <div className="flex flex-col gap-[40px] py-[64px]">
                  <div className="flex flex-col gap-[8px] items-center">
                    <h2 className="font-h2">안녕하세요! 빌딩샵 AI 입니다.</h2>
                    <p className="font-b2 text-center">부동산 건물 매매 및 건축설계 전문 빌딩샵입니다.<br/>관련해서 궁금하신것이 있으시면 무엇이든 물어보세요!</p>
                  </div>
                  <div className="flex flex-col gap-[16px]">
                    <button className="flex items-center gap-[12px] p-[12px] rounded-[4px] border border-line-02">
                      <h2 className="w-[40px] h-[40px] flex items-center justify-center rounded-[4px] bg-surface-second border border-line-02 font-h2">💸</h2>
                      <p className="font-s2">부동산 매매 시 사용가능한 금융상품 추천해 주세요.</p>
                    </button>
                    <button className="flex items-center gap-[12px] p-[12px] rounded-[4px] border border-line-02">
                      <h2 className="w-[40px] h-[40px] flex items-center justify-center rounded-[4px] bg-surface-second border border-line-02 font-h2">🏠</h2>
                      <p className="font-s2">매매 후 재건축 프로세스가 궁금합니다.</p>
                    </button>
                    <button className="flex items-center gap-[12px] p-[12px] rounded-[4px] border border-line-02">
                      <h2 className="w-[40px] h-[40px] flex items-center justify-center rounded-[4px] bg-surface-second border border-line-02 font-h2">🏢</h2>
                      <p className="font-s2">토지를 매입하고 신축을 할 경우 프로세스가 궁금해요.</p>
                    </button>
                  </div>
                </div>
              ) : (
                currentChat.map((msg, index) => (
                  <div key={index} className="flex items-center gap-[8px]">
                    {msg.role === 'user' && 
                      <div className="flex justify-end w-full py-[24px]">
                        <p className="rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] bg-surface-second px-[16px] py-[12px] font-b1-p">{msg.content}</p>
                      </div>}
                    {msg.role === 'ai' && <p className="font-b1-p py-[40px] border-t border-line-02">{msg.content}</p>}
                  </div>
                ))
              )}      
            </div>
            <div className="w-full flex flex-col items-center px-[32px]">
              <div className="w-full flex items-center gap-[10px] p-[16px] rounded-[4px] border border-line-03">
                <textarea
                  rows={1}
                  className="w-full font-b1 focus:outline-none resize-none overflow-y-auto max-h-[120px] scrollbar-hover"
                  placeholder="궁금하신 점을 물어보세요."
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && questionInput.trim() !== "") {
                      e.preventDefault();
                      setCurrentChat((prev) => [...prev, { role: "user", content: questionInput }]);
                      setQuestionInput("");
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      setTimeout(() => {
                        const aiMessage: ChatMessage = {
                          role: "ai",
                          content: "아래는 서울특별시 강남구 청담동 95-16(도로명: 압구정로72길 26) 건물의 재건축 가능성, 매매 동향, 임대 전략 등을 정리한 리포트입니다."
                        };
                        setCurrentChat((prev) => [...prev, aiMessage]);
                      }, 500);
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = target.scrollHeight + "px";
                  }}
                />
                <SendIcon/>
              </div>
              <div className="flex h-[56px] items-center font-c2 text-text-04">
                <p>빌딩샵은 AI 모델입니다. 제공된 정보를 항상 검증하시기 바랍니다.</p>
              </div>
            </div> 
          </div>
        </div>
      </div>
      
    </div>
  )
}