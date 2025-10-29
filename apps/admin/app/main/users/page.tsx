'use client';

import { DownloadIcon, HDivider, Pagination, Refresh, SearchBar, VDivider, MenuDropdown, AGES, SortIcon, MenuIcon, DotProgress, Button } from "@repo/common";
import { useEffect, useState } from "react";
import { UserModel } from "../../models/user.model";
import { User } from "@repo/common";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { formatDate } from "date-fns";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];


const joinMethod = (provider : string) => {
  switch (provider) {
    case 'k':
      return '카카오';
    case 'n':
      return '네이버';
    case 'g':
      return '구글';
    default:
      return '이메일';
  }
}


export default function Users() {
  const [list, setList] = useState<User[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const axiosInstance = useAxiosWithAuth();

  const [loading, setLoading] = useState(false);

 
  const getUserList = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/users', {
        params: {
          page: currentPage,
          size: pageSize,
          name: searchKeyword || null,
        },
      });
      const data = await response.data;
      console.log(data);
      setList(data.data.response);
      setTotalItems(data.data.total);
      // setList([]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserList()
  }, [currentPage, pageSize]);

  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">회원 관리</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">빌딩샵 서비스에 가입한 회원의 정보확인이 가능합니다.</p>
          {/* <div className="flex items-center gap-[6px]">
            <p className="font-s3 text-primary">UPDATED</p>
            <VDivider colorClassName="bg-line-04" className="!h-[10px]"/>
            <p className="font-s3">2025.07.21 16:52:32</p>
          </div> */}
        </div>
      </div>
      <HDivider className="!bg-line-02"/>
      {
        loading ? 
          <div className="flex flex-col items-center justify-center h-[120px]">
            <DotProgress size="sm"/>
          </div>
            :
          list.length === 0 ? 
          <div className="flex flex-col items-center justify-center h-[120px]">
            <p className="font-s2 text-text-03">가입한 회원이 없습니다.</p>
          </div>
          :  
          <>
            <div className="flex items-center justify-between gap-[16px]">
              <div className="flex items-center gap-[12px]">
                <SearchBar
                  placeholder="검색할 사용자 이름을 입력해 주세요."
                  value={searchKeyword}
                  onChange={setSearchKeyword}
                  variant="filled"
                  prefixSize={14}
                  className="font-b3 px-[8px] py-[6px] w-[240px]"
                />
                <Button
                  disabled={searchKeyword === ''}
                  onClick={() => getUserList()} 
                  className="font-b3 py-[5px]" size="small">
                  검색
                </Button>
                {/* <div className="flex items-center gap-[8px]">
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
                </div> */}
              </div>
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
            <table className="w-full">
              <thead className="text-text-03 bg-surface-second text-left">
                <tr>
                  <th className="pl-[16px] py-[14px] font-s3">
                    이메일
                  </th>
                  <th className="pl-[12px] py-[14px] font-s3">
                    이름
                  </th>
                  <th className="pl-[12px] py-[14px] font-s3">연락처</th>
                  <th className="pl-[12px] py-[14px] font-s3">가입방법</th>
                  <th className="pl-[12px] py-[14px] font-s3">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((user : User, index) => (
                  <tr key={index} className="h-[56px] cursor-pointer hover:bg-primary-010 font-s2 border-b border-line-02">
                    <td className="pl-[16px]">{user.email}</td>
                    <td className="pl-[12px]">{user.name}</td>
                    <td className="pl-[12px]">{user.phone}</td>
                    <td className="pl-[12px]">{joinMethod(user.provider ?? '')}</td>
                    <td className="pl-[12px]">{user.createdAt ? formatDate(user.createdAt, 'yyyy-MM-dd HH:mm:ss') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-center py-[12px]">
              <Pagination totalItems={totalItems} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
            </div>       
          </>  

      }



    </div>
  );
}