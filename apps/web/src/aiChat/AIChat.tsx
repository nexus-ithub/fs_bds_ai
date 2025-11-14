import { useRef, useState, useEffect } from "react";
import { Button, VDivider, CloseIcon, SendIcon, ChevronDownCustomIcon, MenuIcon, AILogo, type User, DotProgress, EditIcon, DeleteIcon } from "@repo/common";
import { Dialog, Menu, MenuItem } from "@mui/material";
import axios from "axios";
import { API_HOST } from "../constants";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import { getAccessToken } from "../authutil";
import { v4 as uuidv4 } from 'uuid';
import setting from "../../../admin/app/main/agent/setting.json"
import { toast } from "react-toastify";
import posthog from "posthog-js";
import { logEvent } from "firebase/analytics";
import { analytics } from "../firebaseConfig";
import * as Sentry from "@sentry/react";

interface AIChatProps {
  open: boolean;
  onClose: () => void;
}

interface MenuItemType {
  title: string;
  sessionId: string;
  messages: ChatMessage[];
}

interface CustomAccordionProps {
  title: string;
  menuItems: MenuItemType[];
  defaultExpanded?: boolean;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface ChatHistory {
  sessionId: string;
  title: string | null;
  messages: ChatMessage[];
}

export const AIChat = ({open, onClose}: AIChatProps) => {
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
    
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const currentChat = chatHistory.find(c => c.sessionId === currentSessionId);

  const [openEditTitle, setOpenEditTitle] = useState<boolean>(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const CustomAccordion = ({ title, menuItems, defaultExpanded = false }: CustomAccordionProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null);
  
    const toggleExpanded = () => {
      setIsExpanded(!isExpanded);
    };
  
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, itemSessionId: string) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedMenuItemId(itemSessionId);
    };
  
    const handleMenuClose = () => {
      setAnchorEl(null);
      setSelectedMenuItemId(null);
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
              const isActive = selectedChatId === item.sessionId;
              const isMenuOpen = selectedMenuItemId === item.sessionId;
              
              return (
                <button
                  key={index}
                  className={`group w-full flex items-center justify-between gap-[6px] block py-[9px] px-[8px] rounded-[4px] transition-colors ${
                    isActive ? 'bg-primary-010 text-primary' : 'text-text-02'
                  }`}
                  onClick={() => {setSelectedChatId(item.sessionId); setCurrentSessionId(item.sessionId);}}
                >
                  <p className={`font-s2 ${isActive ? "text-primary" : "text-text-02"} truncate`}>
                    {item.title}
                  </p>
                  <div
                    className={`transition-opacity cursor-pointer ${
                      isMenuOpen || 'group-hover:opacity-100'
                    } ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleMenuOpen(event, item.sessionId);
                    }}
                  >
                    <MenuIcon />
                  </div>
                </button>
              );              
            })}
          </div>
        </div>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          disableScrollLock
          container={panelRef.current}
        >
          <MenuItem onClick={() => {
            setEditingSessionId(selectedMenuItemId);
            setEditingTitle(menuItems.find(item => item.sessionId === selectedMenuItemId)?.title || '');
            setOpenEditTitle(true);
            handleMenuClose();
          }}>
            <div className="flex items-center gap-[9px] font-s2 text-text-02">
              <EditIcon /> 이름 바꾸기
            </div>
          </MenuItem>
          <MenuItem onClick={() => {
            setEditingSessionId(selectedMenuItemId);
            setEditingTitle(menuItems.find(item => item.sessionId === selectedMenuItemId)?.title || '');
            setOpenDeleteConfirm(true);
            handleMenuClose();
          }}>
            <div className="flex items-center gap-[9px] font-s2 text-secondary-050">
              <DeleteIcon /> 삭제
            </div>
          </MenuItem>
        </Menu>
      </div>
    );
  };

  const handleAskChat = async(question?: string) => {
    const inputToUse = question?.trim() || questionInput.trim();
    if (!inputToUse) return;

    const newSessionId = currentSessionId || uuidv4();
    const userMessage: ChatMessage = { role: "user", content: inputToUse };

    setChatHistory(prev => {
      const existing = prev.find(c => c.sessionId === newSessionId);
      if (existing) {
        const updatedSession = {
          ...existing,
          messages: [...existing.messages, userMessage]
        };
        const otherSessions = prev.filter(c => c.sessionId !== newSessionId);
        return [updatedSession, ...otherSessions];
      }
      return [
        {
          sessionId: newSessionId,
          title: null,
          messages: [userMessage],
        },
        ...prev,
      ];
    });

    setCurrentSessionId(newSessionId);
    setQuestionInput("");
    setLoading(true);
    try {
      const response = await axios.post(`${API_HOST}/api/chat/ask`, 
        { question: question || questionInput, userId: config?.id, titleExists: !!currentSessionId, sessionId: newSessionId });

      const aiMessage: ChatMessage = { role: "ai", content: response.data.answer };

      setChatHistory(prev =>
        prev.map((c, index) => 
          index === 0 && c.sessionId === newSessionId
            ? {
                ...c,
                messages: [...c.messages, aiMessage],
                title: c.title || response.data.title,
              }
            : c
        )
      );
      if (config?.id) {
        posthog.identify(String(config?.id));
      }
      posthog.capture('ask_chat')
      logEvent(analytics, 'ask_chat')
    } catch (error) {
      console.error("AI 응답 중 오류가 발생했습니다.", error);
      Sentry.captureException(error);
      toast.error('AI 응답 중 오류가 발생했습니다.\n다시 시도하거나 관리자에게 문의하세요.')
    } finally {
      setLoading(false);
    }
  }

  const handleGetChatHistory = async() => {
    try {
      if (!config?.id) return;
      const response = await axios.get(`${API_HOST}/api/chat/getChatHistory`, { params: { userId: config?.id } });
      const raw = response.data;

      const grouped: Record<string, ChatHistory & { latestCreatedAt: string }> = {};

      raw.forEach((row: any) => {
        if (!grouped[row.session_id]) {
          grouped[row.session_id] = {
            sessionId: row.session_id,
            title: row.title,
            messages: [],
            latestCreatedAt: row.created_at,
          };
        }

        if (row.created_at > grouped[row.session_id].latestCreatedAt) {
          grouped[row.session_id].latestCreatedAt = row.created_at;
        }

        grouped[row.session_id].messages.push({
          role: "user",
          content: row.question,
        });
        grouped[row.session_id].messages.push({
          role: "ai",
          content: row.answer,
        });
      });

      const chatHistories: ChatHistory[] = Object.values(grouped)
        .sort((a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime())
        .map(({ latestCreatedAt, ...rest }) => rest);

      setChatHistory(chatHistories);
    } catch (error) {
      console.error("채팅 이력 조회 중 오류가 발생했습니다.", error);
      Sentry.captureException(error);
      toast.error('채팅 이력 조회 중 오류가 발생했습니다.\n다시 시도하거나 관리자에게 문의하세요.')
    } finally {
      setChatHistoryLoading(false);
    }
  }

  const handleUpdateTitle = async () => {
    if (!editingSessionId || !editingTitle.trim() || !config?.id) return;

    try {
      await axios.put(`${API_HOST}/api/chat/updateTitle`, {
        sessionId: editingSessionId,
        title: editingTitle.trim(),
        userId: config?.id
      });

      setChatHistory(prev =>
        prev.map(chat =>
          chat.sessionId === editingSessionId
            ? { ...chat, title: editingTitle.trim() }
            : chat
        )
      );

      setOpenEditTitle(false);
      setEditingTitle('');
      setEditingSessionId(null);
    } catch (error) {
      console.error('제목 수정 실패:', error);
      Sentry.captureException(error);
      toast.error('제목 수정 실패\n다시 시도하거나 관리자에게 문의하세요.')
    }
  };

  const handleDeleteChat = async () => {
    if (!editingSessionId || !config?.id) return;
    try {
      await axios.put(`${API_HOST}/api/chat/deleteChat`, {
        sessionId: editingSessionId,
        userId: config?.id
      });

      setChatHistory(prev =>
        prev.filter(chat => chat.sessionId !== editingSessionId)
      );
    } catch (error) {
      console.error('채팅 삭제 실패:', error);
      Sentry.captureException(error);
      toast.error('채팅 삭제 실패\n다시 시도하거나 관리자에게 문의하세요.')
    }
    setOpenDeleteConfirm(false);
    setEditingSessionId(null);
    setEditingTitle('');
  };

  useEffect(() => {
    setMounted(true);
    if (!config?.id) return;
    handleGetChatHistory();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openEditTitle || openDeleteConfirm) { 
        return; 
      }
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, openEditTitle, openDeleteConfirm]);

  return (
    <>
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
              <p className="font-s2-p text-text-01">{setting?.agentName || "빌딩샵AI"}</p>
              <VDivider className="!h-[12px]" colorClassName="bg-line-04"/>
              <p className="font-s2 text-text-03">{setting?.nameDesc || "부동산 매매 및 설계전문 빌딩샵에서 제공하는 부동산 전문 AI 입니다."}</p>
            </div>
            <div className="flex items-center gap-[12px]">
              <Button variant="outlinegray" className="!text-text-02" onClick={() => {setCurrentSessionId(null); setSelectedChatId(null);}}>{setting?.newchatLabel || "NEW CHAT"}</Button>
              <button onClick={onClose}><CloseIcon/></button>
            </div>
          </div>    
          <div className="flex h-[calc(100%-64px)]">
            {config?.id && (
              <div className="w-[252px] p-[20px] border-r border-line-02 overflow-y-auto scrollbar-hover">
                {chatHistoryLoading ? (
                  <div className="flex items-center justify-center py-[50px]">
                    <DotProgress size="sm"/>
                  </div>
                ) : (
                  <CustomAccordion title="HISTORY" menuItems={chatHistory} defaultExpanded={true}/>
                )}
              </div>
            )}
            <div className="w-[768px] flex flex-col">
              <div ref={chatContainerRef} className="flex-1 px-[48px] overflow-y-auto scrollbar-hover">
                {currentChat?.messages.length === 0 || !currentChat ? (
                  <div className="flex flex-col gap-[40px] py-[64px]">
                    <div className="flex flex-col gap-[8px] items-center">
                      <h2 className="font-h2">{setting?.chatTitle || "안녕하세요! 빌딩샵AI 입니다."}</h2>
                      <p className="font-b2 text-center whitespace-pre-line">{setting?.chatSubtitle || "부동산 건물 매매 및 건축설계 전문 빌딩샵입니다.\n관련해서 궁금하신것이 있으시면 무엇이든 물어보세요!"}</p>
                    </div>
                    <div className="flex flex-col items-center gap-[16px]">
                      {setting?.questions
                        ?.filter(q => q.selectedYn === "Y")
                        ?.sort((a, b) => (a.seq ?? 9999) - (b.seq ?? 9999))
                        ?.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => handleAskChat(q.question)}
                            className="w-[500px] flex items-center gap-[12px] p-[12px] rounded-[4px] border border-line-02"
                            style={{ boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)' }}
                          >
                            <h2 className="w-[40px] h-[40px] flex shrink-0 items-center justify-center rounded-[4px] bg-surface-second border border-line-02 font-h2">
                              {q.icon}
                            </h2>
                            <p className="font-s2">{q.question}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  currentChat?.messages?.map((msg, index) => (
                    <div key={index} className="flex items-center gap-[8px]">
                      {msg.role === 'user' && 
                        <div className="flex justify-end w-full py-[24px]">
                          <p className="rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] bg-surface-second px-[16px] py-[12px] font-b1-p whitespace-pre-line">{msg.content}</p>
                        </div>}
                      {msg.role === 'ai' && <p className="w-full font-b1-p py-[40px] border-t border-line-02 whitespace-pre-line">{msg.content}</p>}
                    </div>
                  ))
                )}
                {loading && (
                  <span className="w-full border-t border-line-02">
                    <DotProgress size="sm" />
                  </span>
                )}
              </div>
              <div className="w-full flex flex-col items-center px-[32px]">
                <div className="w-full flex items-center gap-[10px] p-[16px] rounded-[4px] border border-line-03">
                  <textarea
                    rows={1}
                    className="w-full font-b1 focus:outline-none resize-none overflow-y-auto max-h-[120px] scrollbar-hover"
                    placeholder={setting?.placeholder || "궁금하신 점을 물어보세요."}
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as unknown as { isComposing?: boolean }).isComposing && questionInput.trim() !== "" && !loading) {
                        e.preventDefault();
                        handleAskChat();
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = target.scrollHeight + "px";
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      handleAskChat();
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                    }}
                    disabled={loading || questionInput.trim() === ""}>
                    <SendIcon color={loading || questionInput.trim() === "" ? "#D2D4DA" : "#4E52FF"}/>
                  </button>
                </div>
                <div className="flex h-[56px] items-center font-c2 text-text-04">
                  <p>{setting?.warningMsg || "빌딩샵은 AI 모델입니다. 제공된 정보를 항상 검증하시기 바랍니다."}</p>
                </div>
              </div> 
            </div>
          </div>
        </div>
      </div>
      <Dialog
        open={openEditTitle}
        onClose={() => setOpenEditTitle(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="z-[50]"
        disableScrollLock={true}
      >
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col p-[24px] gap-[20px] min-w-[400px]">
          <h2 className="font-h2">이름 바꾸기</h2>
          <input 
            type="text" 
            value={editingTitle} 
            onChange={(e) => setEditingTitle(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUpdateTitle();
              }
            }}
            className="w-full font-b1 p-[12px] border border-line-03 rounded-[4px] focus:outline-none"
          />
          <div className="flex justify-end gap-[12px]">
            <Button variant="bggray" className="w-[60px]" onClick={(e) => {e.stopPropagation(); setOpenEditTitle(false); setEditingTitle(''); setEditingSessionId(null);}}>취소</Button>
            <Button className="w-[100px]" disabled={editingTitle.trim() === ''} onClick={(e) => {e.stopPropagation(); handleUpdateTitle()}}>확인</Button>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={openDeleteConfirm}
        onClose={() => setOpenDeleteConfirm(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="z-[50]"
        disableScrollLock={true}
      >
        <div onClick={(e) => e.stopPropagation()} className="flex flex-col p-[24px] gap-[20px] min-w-[400px]">
          <h3 className="font-h3">🚨 정말 삭제하시겠습니까?</h3>
          <p className="font-s1 px-[8px]">"{editingTitle}" 항목을 삭제합니다.</p>

          <div className="flex justify-end gap-[12px] mt-[8px]">
            <Button variant="bggray" className="w-[60px]" onClick={(e) => {e.stopPropagation(); setOpenDeleteConfirm(false); setEditingTitle(''); setEditingSessionId(null);}}>취소</Button>
            <Button className="w-[100px]" onClick={(e) => {e.stopPropagation(); handleDeleteChat()}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}