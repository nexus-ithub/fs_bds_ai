'use client';

import { Button, DeleteIcon, DownloadIcon, EditIcon, HDivider, Pagination, Refresh, SearchBar } from "@repo/common";
import { useState } from "react";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

const ACCOUNT_SAMPLES = [
  {name: "김이름", email: "test@gmail.com", phone: "010 1234 5678", department: "부서명", position: "직급", permission: "마스터", registerDate: "2025.05.01"},
  {name: "김이름", email: "test@gmail.com", phone: "010 1234 5678", department: "부서명", position: "직급", permission: "일발", registerDate: "2025.05.01"},
  {name: "김이름", email: "test@gmail.com", phone: "010 1234 5678", department: "부서명", position: "직급", permission: "일발", registerDate: "2025.05.01"},
  {name: "김이름", email: "test@gmail.com", phone: "010 1234 5678", department: "부서명", position: "직급", permission: "일반", registerDate: "2025.05.01"},
  {name: "김이름", email: "test@gmail.com", phone: "010 1234 5678", department: "부서명", position: "직급", permission: "일반", registerDate: "2025.05.01"},
]

export default function Admin() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex items-center justify-between gap-[16px]">
        <h2 className="font-h2">관리자 계정</h2>
        <Button variant="outline" size="small" fontSize="font-s4">관리자 추가</Button>
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
        <thead className="font-s3 text-text-03 bg-surface-second text-left">
          <tr>
            <th className="pl-[16px] py-[14px]">이름</th>
            <th className="pl-[12px] py-[14px]">이메일</th>
            <th className="pl-[12px] py-[14px]">연락처</th>
            <th className="pl-[12px] py-[14px]">부서</th>
            <th className="pl-[12px] py-[14px]">직급</th>
            <th className="pl-[12px] py-[14px]">권한</th>
            <th className="pl-[12px] py-[14px]">등록일</th>
            <th className="pl-[12px] pr-[16px] py-[14px] w-[52px]">{" "}</th>
          </tr>
        </thead>
        <tbody>
          {ACCOUNT_SAMPLES.map((account, index) => (
            <tr key={index} className="h-[56px] font-s2 border-b border-line-02">
              <td className="pl-[16px]">{account.name}</td>
              <td className="pl-[12px]">{account.email}</td>
              <td className="pl-[12px]">{account.phone}</td>
              <td className="pl-[12px]">{account.department}</td>
              <td className="pl-[12px]">{account.position}</td>
              <td className="pl-[12px]">{account.permission}</td>
              <td className="pl-[12px]">{account.registerDate}</td>
              <td className="pl-[12px] pr-[16px] w-[52px]">
                <div className="flex items-center gap-[12px]">
                  <button><EditIcon/></button>
                  <button><DeleteIcon color="#585C64"/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center py-[12px]">
        <Pagination totalItems={ACCOUNT_SAMPLES.length} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
      </div>
    </div>
  );
}