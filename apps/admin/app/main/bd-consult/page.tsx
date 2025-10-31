'use client';

import { type ConsultRequest, HDivider, Pagination, getJibunAddress, Button, DotProgress, BdConsultRequest } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { format } from "date-fns";
import { Dialog, DialogTitle } from "@mui/material";
import Link from "next/link";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];


const Item = ({title, value} : {title : string, value : string | React.ReactNode}) => {
  return (
    <div className="flex-1 space-y-[10px]">
      <p className="font-s2 text-text-03">{title}</p>
      <p className="font-b1 border border-line-04 px-[14px] py-[12px] rounded-[2px]">{value}</p>         
    </div>
  );
}

export default function ConsultRequest() {
  const [list, setList] = useState<BdConsultRequest[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<BdConsultRequest | null>(null);
  // const [sortedType, setSortedType] = useState<'email' | 'name' | 'recentLogin' | 'registerDate' | null>(null);
  const axiosInstance = useAxiosWithAuth();

  const [loading, setLoading] = useState(false);

  const getConsultRequest = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/bd-consult', {
        params: {
          page: currentPage,
          size: pageSize,
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
    getConsultRequest();
  }, [currentPage, pageSize]);

  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">빌딩 매입 상담</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">사용자의 빌딩 매입 상담 요청 정보를 확인할 수 있습니다.</p>
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
            <p className="font-s2 text-text-03">설계 상담 요청이 없습니다.</p>
          </div>
          :  
          <>
            <div className="flex items-center justify-end gap-[16px]">
              {/* <div className="flex items-center gap-[20px]">
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
              </div> */}
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
                  <th className="pl-[12px] py-[14px] font-s3">
                    이름
                  </th>
                  <th className="pl-[12px] py-[14px] font-s3">
                    연락처
                  </th>
                  <th className="pl-[12px] py-[14px] font-s3">
                    문의글
                  </th>            
                  <th className="pl-[12px] py-[14px] font-s3">
                    등록일
                  </th>
                  <th className="pl-[12px] py-[14px] font-s3">
                    바로가기
                  </th>                              
                </tr>
              </thead>
              <tbody>
                {list?.map((item : BdConsultRequest, index : number) => (
                  <tr 
                    key={index} 
                    className="hover:bg-primary-010 cursor-pointer h-[56px] font-s2 border-b border-line-02"
                    onClick={() => {setSelectedItem(item)}}
                  >
                    <td className="pl-[12px]">{item.name}</td>
                    <td className="pl-[12px]">{item.phone}</td>
                    <td className="pl-[12px] truncate max-w-[20px]">{item.content}</td>
                    <td className="pl-[12px]">{format(item.createdAt, 'yyyy-MM-dd HH:mm:ss')}</td>

                    <td className="pl-[12px]">
                      <button className="w-[32px] h-[32px] flex items-center justify-center p-[4px] rounded-[4px] border border-line-02"><Link href={`/main/bd-consult/${item.id}`}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-center py-[12px]">
              <Pagination totalItems={totalItems} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
            </div>          
          </>  

      }
      <Dialog
        fullWidth
        open={selectedItem !== null}
        onClose={() => {setSelectedItem(null)}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          설계 상담 요청
        </DialogTitle>
        <div className="px-[24px] py-[16px] space-y-[24px]">
          <div className="space-y-[12px]">
            <p className="font-h4">고객정보</p>
            <div className="flex flex-col gap-[20px]">
              <div className="flex gap-[20px]">
                <Item title="이름" value={selectedItem? selectedItem?.name : ""}/>
                <Item title="연락처" value={selectedItem? selectedItem?.phone : ""}/>
              </div>
              <div className="flex gap-[20px]">
                <Item title="날짜" value={selectedItem? format(selectedItem?.createdAt, 'yyyy-MM-dd HH:mm:ss') : ""}/>
                <div className="flex-1 space-y-[10px]">
                  <p className="font-s2 text-text-03">빌딩샵ID</p>
                  <button
                    onClick={() => window.open(`http://admin.buildingshop.co.kr/#/building/${selectedItem?.bdId}`, '_blank')}
                    className="font-b1 px-[14px] py-[12px] rounded-[2px] bg-primary text-white">{selectedItem?.bdId}</button>         
                </div>                
              </div>
            </div>
          </div>          
          {/* <div className="space-y-[12px]">
            <p className="font-h4">주소</p>
            <div className="flex flex-col gap-[10px]">
              <div className="flex gap-[12px]">
                <p className="font-b1">{selectedItem? getJibunAddress(selectedItem?.land || null) : ""}</p>         
              </div>
            </div>
          </div> */}

          {/* <HDivider/> */}
          <div className="space-y-[18px]">
            <p className="font-h4">추가 요청사항</p>
            <p className="font-b2 placeholder:text-text-04 max-h-[320px] overflow-y-auto focus:outline-none bg-surface-second rounded-[4px] w-full px-[16px] py-[12px]">
              {selectedItem?.content?.split('\n').map((item, index) => (
                <span key={index}>{item}<br/></span>
              ))}
            </p>
          </div>
        </div>
        <HDivider/>
        <div className="px-[24px] py-[16px] flex justify-end">
          <Button className="w-[120px]" onClick={() => {setSelectedItem(null)}} autoFocus>
            닫기
          </Button>
        </div>
      </Dialog>
    </div>
  );
}