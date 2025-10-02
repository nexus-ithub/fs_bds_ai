'use client';

import { DownloadIcon, HDivider, Pagination, Refresh, SearchBar, VDivider, MenuDropdown, AGES, SortIcon, MenuIcon } from "@repo/common";
import { useState } from "react";
import { format } from "date-fns";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

const SESSION_SAMPLES = [
  {sessionId: "aaaaaaaa-152a-4d79-9469-003dcfb4673c", email: "abcde@gmail.com", sessionStart: "2025.07.15 13:54:58", sessionEnd: "2025.07.15 16:25:08", questionCount: 11},
  {sessionId: "bbbbbbbb-152a-4d79-9469-003dcfb4673c", email: "bcdef@gmail.com", sessionStart: "2025.07.15 15:54:58", sessionEnd: "2025.07.15 16:24:08", questionCount: 12},
  {sessionId: "cccccccc-152a-4d79-9469-003dcfb4673c", email: "cdefg@gmail.com", sessionStart: "2025.07.15 17:54:58", sessionEnd: "2025.07.15 18:24:08", questionCount: 13},
  {sessionId: "dddddddd-152a-4d79-9469-003dcfb4673c", email: "defgh@gmail.com", sessionStart: "2025.07.16 13:54:58", sessionEnd: "2025.07.16 14:24:08", questionCount: 14},
  {sessionId: "ffffffff-152a-4d79-9469-003dcfb4673c", email: "efghi@gmail.com", sessionStart: "2025.07.17 13:54:58", sessionEnd: "2025.07.17 14:24:08", questionCount: 15},
]

export default function Session() {
  const [sessions, setSessions] = useState(SESSION_SAMPLES);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [sortedSessions, setSortedSessions] = useState(sessions);
  const [selectedGender, setSelectedGender] = useState<'M' | 'F' | ''>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [sortedType, setSortedType] = useState<'email' | 'name' | 'recentLogin' | 'registerDate' | null>(null);


  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">세션 관리</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">AI를 사용한 유저의 각 세션 분석 및 대화 내용을 확인해 보세요.</p>
          <div className="flex items-center gap-[6px]">
            <p className="font-s3 text-primary">UPDATED</p>
            <VDivider colorClassName="bg-line-04" className="!h-[10px]"/>
            <p className="font-s3">2025.07.21 16:52:32</p>
          </div>
        </div>
      </div>
      <HDivider className="!bg-line-02"/>
      <div className="flex items-center justify-between gap-[16px]">
        <SearchBar
          placeholder="검색어를 입력해 주세요."
          value={searchKeyword}
          onChange={setSearchKeyword}
          variant="filled"
          prefixSize={14}
          className="font-b3 px-[8px] py-[6px]"
        />
        <div className="flex items-center gap-[12px]">
          <button className="w-[32px] h-[32px] flex items-center justify-center p-[4px] rounded-[4px] border border-line-02"><Refresh/></button>
          <button className="w-[32px] h-[32px] flex items-center justify-center p-[4px] rounded-[4px] border border-line-02"><DownloadIcon color="#585C64"/></button>
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
            <th className="pl-[12px] pr-[16px] py-[14px] w-[52px]">{" "}</th>
          </tr>
        </thead>
        <tbody>
          {sortedSessions.map((session, index) => (
            <tr key={index} className="h-[56px] font-s2 border-b border-line-02">
              <td className="pl-[16px]">{session.sessionId}</td>
              <td className="pl-[12px]">{session.email}</td>
              <td className="pl-[12px] text-center">
                {format(session.sessionStart, 'yyyy.MM.dd')}<br />
                {format(session.sessionStart, 'HH:mm:ss')}</td>
              <td className="pl-[12px] text-center">
                {format(session.sessionEnd, 'yyyy.MM.dd')}<br />
                {format(session.sessionEnd, 'HH:mm:ss')}</td>
              <td className="pl-[12px]">{session.questionCount}</td>
              <td className="pl-[12px] pr-[16px] w-[52px]">
                <div className="flex items-center gap-[12px]">
                  <button><MenuIcon/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center py-[12px]">
        <Pagination totalItems={SESSION_SAMPLES.length} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
      </div>
    </div>
  );
}