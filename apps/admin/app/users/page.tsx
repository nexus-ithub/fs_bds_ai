'use client';

import { DeleteIcon, DownloadIcon, EditIcon, HDivider, Pagination, Refresh, SearchBar, VDivider, MenuDropdown, AGES, SortIcon, MenuIcon } from "@repo/common";
import { useEffect, useState } from "react";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

const ACCOUNT_SAMPLES = [
  {name: "가이름", email: "abcde@gmail.com", phone: "010 1234 5678", gender: "M", age: "20대 이하", auth: '간편', permission: "마스터", recentLogin: "2025.05.01", registerDate: "2025.05.05"},
  {name: "나이름", email: "bcdef@gmail.com", phone: "010 1234 5678", gender: "F", age: "20대", auth: '가입', permission: "일발", recentLogin: "2025.05.02", registerDate: "2025.05.04"},
  {name: "다이름", email: "cdefg@gmail.com", phone: "010 1234 5678", gender: null, age: "80대 이상", auth: '등급', permission: "일발", recentLogin: "2025.05.03", registerDate: "2025.05.03"},
  {name: "라이름", email: "defgh@gmail.com", phone: "010 1234 5678", gender: "M", age: "20대", auth: '등급', permission: "일반", recentLogin: "2025.05.04", registerDate: "2025.05.02"},
  {name: "마이름", email: "efghi@gmail.com", phone: "010 1234 5678", gender: "F", age: "20대", auth: '등급', permission: "일반", recentLogin: "2025.05.05", registerDate: "2025.05.01"},
]

export default function Users() {
  const [accounts, setAccounts] = useState(ACCOUNT_SAMPLES);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [sortedAccounts, setSortedAccounts] = useState(accounts);
  const [selectedGender, setSelectedGender] = useState<'M' | 'F' | ''>('');
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [sortedType, setSortedType] = useState<'email' | 'name' | 'recentLogin' | 'registerDate' | null>(null);


  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">회원 관리</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">빌딩샵 서비스에 가입한 유저의 정보 및 관리가 가능합니다.</p>
          <div className="flex items-center gap-[6px]">
            <p className="font-s3 text-primary">UPDATED</p>
            <VDivider colorClassName="bg-line-04" className="!h-[10px]"/>
            <p className="font-s3">2025.07.21 16:52:32</p>
          </div>
        </div>
      </div>
      <HDivider className="!bg-line-02"/>
      <div className="flex items-center justify-between gap-[16px]">
        <div className="flex items-center gap-[20px]">
          <SearchBar
            placeholder="검색어를 입력해 주세요."
            value={searchKeyword}
            onChange={setSearchKeyword}
            variant="filled"
            prefixSize={14}
            className="font-b3 px-[8px] py-[6px]"
          />
          <div className="flex items-center gap-[8px]">
            <p className="font-s3 text-text-03">성별</p>
            <MenuDropdown<'M' | 'F' | ''> 
              options={[
                { value: '', label: "전체" },
                { value: "M", label: "남성" },
                { value: "F", label: "여성" },
              ]}
              value={selectedGender} 
              onChange={(value, option) => {
                setSelectedGender(value);
              }}
              placeholder="전체"
              width="w-[80px]"
            />
          </div>
          <div className="flex items-center gap-[8px]">
            <p className="font-s3 text-text-03">연령</p>
            <MenuDropdown
              options={[{ value: "", label: "전체" }, ...AGES]}
              value={selectedAge} 
              onChange={(value, option) => {
                setSelectedAge(value);
              }}
              placeholder="전체"
              width="w-[86px]"
            />
          </div>
        </div>
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
                  이메일<SortIcon/>
              </button>
            </th>
            <th className="pl-[12px] py-[14px] font-s3">
              <button 
                onClick={() => {setSortedType('name')}}
                className="flex items-center gap-[4px]">
                  이름<SortIcon/>
              </button>
            </th>
            <th className="pl-[12px] py-[14px] font-s3">연락처</th>
            <th className="pl-[12px] py-[14px] font-s3">성별</th>
            <th className="pl-[12px] py-[14px] font-s3">연령</th>
            <th className="pl-[12px] py-[14px] font-s3">등급</th>
            <th className="pl-[12px] py-[14px] font-s3">
              <button 
                onClick={() => {setSortedType('recentLogin')}}
                className="flex items-center gap-[4px]">
                  최근접속일<SortIcon/>
              </button>
            </th>
            <th className="pl-[12px] py-[14px] font-s3">
              <button 
                onClick={() => {setSortedType('registerDate')}}
                className="flex items-center gap-[4px]">
                  가입일<SortIcon/>
              </button>
            </th>
            <th className="pl-[12px] pr-[16px] py-[14px] w-[52px]">{" "}</th>
          </tr>
        </thead>
        <tbody>
          {sortedAccounts.map((account, index) => (
            <tr key={index} className="h-[56px] font-s2 border-b border-line-02">
              <td className="pl-[16px]">{account.email}</td>
              <td className="pl-[12px]">{account.name}</td>
              <td className="pl-[12px]">{account.phone}</td>
              <td className="pl-[12px]">{account.gender === 'M' ? '남성' : account.gender === 'F' ? '여성' : ''}</td>
              <td className="pl-[12px]">{account.age}</td>
              <td className="pl-[12px]">{account.auth}</td>
              <td className="pl-[12px]">{account.recentLogin}</td>
              <td className="pl-[12px]">{account.registerDate}</td>
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
        <Pagination totalItems={ACCOUNT_SAMPLES.length} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
      </div>
    </div>
  );
}