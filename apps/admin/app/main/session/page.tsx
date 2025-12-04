'use client';

import { DownloadIcon, HDivider, Pagination, Refresh, SearchBar, VDivider, MenuDropdown, AGES, SortIcon, MenuIcon, DotProgress, ChatInfo, Button, CloseIcon } from "@repo/common";
import { useState, useEffect, type JSX } from "react";
import { format } from "date-fns";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { SessionList } from "@repo/common";
import { Dialog } from "@mui/material";
import { toast } from "react-toastify";
import { trackError } from "../../utils/analytics";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

export default function Session() {
  const axiosInstance = useAxiosWithAuth();
  const [sessions, setSessions] = useState<SessionList[]>([]);
  // const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [updateDate, setUpdateDate] = useState<Date>(new Date());
  const [chatContent, setChatContent] = useState<ChatInfo[]>([]);

  const [sortedSessions, setSortedSessions] = useState(sessions);
  // const [selectedGender, setSelectedGender] = useState<'M' | 'F' | ''>('');
  // const [selectedAge, setSelectedAge] = useState<string>('');
  const [sortedType, setSortedType] = useState<'email' | 'name' | 'recentLogin' | 'registerDate' | null>(null);

  const [openChatContent, setOpenChatContent] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  const convertSpecificLinks = (text: string) => {
    const links = [
      {
        text: 'https://www.youtube.com/channel/UC8fLp2MqsnYqcNwpG-jzyFg',
        url: 'https://www.youtube.com/channel/UC8fLp2MqsnYqcNwpG-jzyFg',
        label: '빌딩의 신↗'
      },
      {
        text: 'instagram.com/god.of.building',
        url: 'https://instagram.com/god.of.building',
        label: '@god.of.building↗'
      },
      {
        text: 'tiktok.com/@godofbuilding',
        url: 'https://tiktok.com/@godofbuilding',
        label: '@godofbuilding↗'
      },
      {
        text: '@god.of.building',
        url: 'https://instagram.com/god.of.building',
        label: '@god.of.building↗'
      },
      {
        text: '@godofbuilding',
        url: 'https://www.tiktok.com/@godofbuilding',
        label: '@godofbuilding↗'
      }
    ];

    let parts: (string | JSX.Element)[] = [text];

    links.forEach(({ text: linkText, url, label }, linkIndex) => {
      parts = parts.flatMap((part, partIndex) => {
        if (typeof part !== 'string') return part;

        const splitParts = part.split(linkText);
        const result: (string | JSX.Element)[] = [];

        splitParts.forEach((str, i) => {
          result.push(str);
          if (i < splitParts.length - 1) {
            result.push(
              <a
                key={`link-${linkIndex}-${partIndex}-${i}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-b1 border-b border-dashed hover:text-primary"
              >
                {label}
              </a>
            );
          }
        });

        return result;
      });
    });

    return parts;
  };

  const getSession = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/session', {
        params: {
          page: currentPage,
          size: pageSize,
        },
      });
      const data = await response.data.data;

      setSessions(data.data);
      setTotalItems(data.total);
      setSortedSessions(data.data);
      setUpdateDate(new Date());
    } catch (error) {
      console.error("세션 조회 실패", error);
      trackError(error, {
        message: "세션 조회 실패",
        file: "/session/page.tsx",
        page: window.location.pathname,
        severity: "error"
      })
      toast.error("세션 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const getChatContent = async (sessionId: string) => {
    setChatLoading(true);
    try {
      const response = await axiosInstance.get(`/session/${sessionId}`);
      const data = await response.data.data;
      console.log(">>>", data);
      setChatContent(data);
    } catch (error) {
      console.error("채팅 내용 조회 실패", error);
      trackError(error, {
        message: "채팅 내용 조회 실패",
        file: "/session/page.tsx",
        page: window.location.pathname,
        severity: "error"
      })
      toast.error("채팅 내용 조회 실패");
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    getSession();
  }, [currentPage, pageSize]);


  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">세션 관리</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">AI를 사용한 유저의 각 세션 분석 및 대화 내용을 확인해 보세요.</p>
          {/* <div className="flex items-center gap-[6px]">
            <p className="font-s3 text-primary">UPDATED</p>
            <VDivider colorClassName="bg-line-04" className="!h-[10px]"/>
            <p className="font-s3">{format(updateDate, 'yyyy.MM.dd HH:mm:ss')}</p>
          </div> */}
        </div>
      </div>
      <HDivider className="!bg-line-02"/>
      <div className="flex items-center justify-end gap-[16px]">
        {/* <SearchBar
          placeholder="검색어를 입력해 주세요."
          value={searchKeyword}
          onChange={setSearchKeyword}
          variant="filled"
          prefixSize={14}
          className="font-b3 px-[8px] py-[6px]"
        /> */}
        <div className="flex items-center gap-[12px]">
          {/* <button className="w-[32px] h-[32px] flex items-center justify-center p-[4px] rounded-[4px] border border-line-02"><Refresh/></button> */}
          {/* <button className="w-[32px] h-[32px] flex items-center justify-center p-[4px] rounded-[4px] border border-line-02"><DownloadIcon color="#585C64"/></button> */}
          <div className="flex items-center rounded-[4px] border border-line-02 divide-x divide-line-02">
            {COUNT_BUTTON.map((item) => (
              <button
                key={item.value}
                className={`w-[32px] h-[32px] flex items-center justify-center p-[4px] font-s2 ${item.value === pageSize ? 'text-primary' : 'text-text-04'}`}
                onClick={() => {setPageSize(item.value); setCurrentPage(1)}}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {loading ? 
        <div className="flex flex-col items-center justify-center h-[120px]">
          <DotProgress size="sm"/>
        </div>
      : sessions.length === 0 
      ? 
        <div className="flex flex-col items-center justify-center h-[120px]">
          <p className="font-s2 text-text-03">세션이 없습니다.</p>
        </div>
      : 
        <table className="w-full">
          <thead className="text-text-03 bg-surface-second text-left">
            <tr>
              <th className="pl-[16px] py-[14px] font-s3">
                <button 
                  onClick={() => {setSortedType('email')}}
                  className="flex items-center gap-[4px]">
                    세션 ID<SortIcon/>
                </button>
              </th>
              <th className="pl-[12px] py-[14px] font-s3">
                <button 
                  onClick={() => {setSortedType('name')}}
                  className="flex items-center gap-[4px]">
                    유저 ID<SortIcon/>
                </button>
              </th>
              <th className="pl-[12px] py-[14px] font-s3">
                <button 
                  onClick={() => {setSortedType('name')}}
                  className="w-full flex items-center justify-center gap-[4px]">
                    세션 시작<SortIcon/>
                </button>
              </th>
              <th className="pl-[12px] py-[14px] font-s3">
                <button 
                  onClick={() => {setSortedType('name')}}
                  className="w-full flex items-center justify-center gap-[4px]">
                    세션 종료<SortIcon/>
                </button>
              </th>
              <th className="pl-[12px] py-[14px] font-s3">질의 수</th>
              <th className="pl-[12px] py-[14px] font-s3 text-center">삭제여부</th>
              {/* <th className="pl-[12px] pr-[16px] py-[14px] w-[52px]">{" "}</th> */}
            </tr>
          </thead>
          <tbody>
            {sortedSessions?.map((session, index) => (
              <tr key={index} 
                className="h-[56px] font-s2 border-b border-line-02 hover:bg-primary-010 cursor-pointer"
                onClick={() => {getChatContent(session.sessionId); setOpenChatContent(true)}}
              >
                <td className="pl-[16px]">{session.sessionId}</td>
                <td className="pl-[12px]">{session.email}</td>
                <td className="pl-[12px] text-center">
                  {format(session.sessionStart, 'yyyy.MM.dd')}<br />
                  {format(session.sessionStart, 'HH:mm:ss')}</td>
                <td className="pl-[12px] text-center">
                  {format(session.sessionEnd, 'yyyy.MM.dd')}<br />
                  {format(session.sessionEnd, 'HH:mm:ss')}</td>
                <td className="pl-[12px]">{session.questionCount}</td>
                <td className="pl-[12px] text-center">{session.deleteYn === 'Y' ? '삭제됨' : '정상'}</td>
                {/* <td className="pl-[12px] pr-[16px] w-[52px]">
                  <div className="flex items-center gap-[12px]">
                    <button><MenuIcon/></button>
                  </div>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      }
      <div className="flex items-center justify-center py-[12px]">
        <Pagination totalItems={totalItems} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
      </div>
      <Dialog open={openChatContent} onClose={() => {setOpenChatContent(false); setChatContent([])}}>
        <div className="flex flex-col max-h-[80vh] w-[500px]">
          <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-line-02">
            <h2 className="font-h2">대화 내용</h2>
            <button 
              onClick={() => {setOpenChatContent(false); setChatContent([])}}
              className="rounded-[4px]"
            >
              <CloseIcon/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-[34px] py-[24px] scrollbar-hover">
            {chatLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <DotProgress size="sm" />
              </div>
            ) : (
              chatContent.map((chat, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex justify-end w-full py-[12px]">
                    <div className="flex flex-col gap-[4px] max-w-[80%]">
                      <p className="font-c2 text-text-03 text-right">
                        {chat.created_at
                        ? format(new Date(chat.created_at), 'yyyy.MM.dd HH:mm:ss')
                        : '-'}
                      </p>
                      <p className="rounded-tl-[8px] rounded-tr-[8px] rounded-bl-[8px] bg-surface-second px-[16px] py-[12px] font-b1-p whitespace-pre-line">
                        {chat.question}
                      </p>
                    </div>
                  </div>
                  <div className="w-full py-[20px] border-t border-line-02">
                    <p className="font-b1-p whitespace-pre-line">{convertSpecificLinks(chat.answer)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-center gap-[12px] px-[24px] py-[20px] border-t border-line-02">
            <Button 
              className="w-[160px]" 
              onClick={() => {setOpenChatContent(false); setChatContent([])}}
            >
              확인
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}