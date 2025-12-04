'use client';

import { type ConsultRequest, HDivider, Pagination, getJibunAddress, Button, DotProgress, BdConsultRequest, Spinner } from "@repo/common";
import { useEffect, useState } from "react";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { format } from "date-fns";
import { Dialog, DialogTitle } from "@mui/material";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { toast } from "react-toastify";
import { trackError } from "../../utils/analytics";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
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
      trackError(error, {
        message: "빌딩 매입 상담 요청 조회에 실패했습니다.",
        file: "/bd-consult/page.tsx",
        page: window.location.pathname,
        severity: "error"
      })
      toast.error('빌딩 매입 상담 요청 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getConsultRequest();
    setSelectedIds([]);
  }, [currentPage, pageSize]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(list.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleUpdate = async (action: string) => {
    setLoadingAction(action);
    try{
      const response = await axiosInstance.put("/bd-consult", { action, ids: selectedIds });
      const { success, message } = response.data;
      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      trackError(error, {
        message: "빌딩 매입 상담 상태 변경에 실패했습니다.",
        file: "/bd-consult/page.tsx",
        page: window.location.pathname,
        severity: "error"
      })
      toast.error("처리 중 오류가 발생했습니다.")
    } finally {
      setLoadingAction(null);
      setShowDeleteConfirm(false);
      setSelectedIds([]);
      getConsultRequest();
    }
  };

  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex flex-col gap-[4px]">
        <h2 className="font-h2">빌딩 매입 상담</h2>
        <div className="flex items-center justify-between gap-[12px]">
          <p className="font-s2 text-text-02">사용자의 빌딩 매입 상담 요청 정보를 확인할 수 있습니다.</p>
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
            <div className="flex items-center justify-between gap-[16px]">
              <div className="flex items-center gap-[12px]">
                {selectedIds.length > 0 && (
                  <>
                    <p className="font-s2 text-text-03">{selectedIds.length}개 선택됨</p>
                    <Button
                      variant="outline"
                      size="small"
                      className="!text-error !border-error hover:!bg-error-010 w-[70px]"
                      onClick={() => handleUpdate("complete")}
                      disabled={loadingAction !== null}
                    >
                      {loadingAction === "complete" ? <Spinner/> : "상담 완료"}
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      className="!text-error !border-error hover:!bg-error-010 w-[70px]"
                      onClick={() => handleUpdate("pending")}
                      disabled={loadingAction !== null}
                    >
                      {loadingAction === "pending" ? <Spinner/> : "상담 대기"}
                    </Button>
                    <Button
                      variant="outlinesecondary"
                      size="small"
                      className="!text-error !border-error hover:!bg-error-010 w-[70px]"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={loadingAction !== null}
                    >
                      선택 삭제
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-[16px]">
                <div className="flex items-center gap-[12px]">
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
            </div>
            <table className="w-full">
              <thead className="text-text-03 bg-surface-second text-left">
                <tr>
                  <th className="pl-[12px] py-[14px]">
                    <input
                      type="checkbox"
                      checked={list.length > 0 && selectedIds.length === list.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-[16px] h-[16px] cursor-pointer"
                    />
                  </th>
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
                    상태
                  </th>
                  <th className="pl-[12px] py-[14px] font-s3">
                    빌딩 ID
                  </th>                              
                </tr>
              </thead>
              <tbody>
                {list?.map((item : BdConsultRequest, index : number) => (
                  <tr
                    key={index}
                    className="hover:bg-primary-010 h-[56px] font-s2 border-b border-line-02"
                  >
                    <td className="pl-[12px]">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectItem(item.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-[16px] h-[16px] cursor-pointer"
                      />
                    </td>
                    <td className="pl-[12px] cursor-pointer" onClick={() => {setSelectedItem(item)}}>{item.name}</td>
                    <td className="pl-[12px] cursor-pointer" onClick={() => {setSelectedItem(item)}}>{item.phone}</td>
                    <td className="pl-[12px] truncate max-w-[240px] cursor-pointer" onClick={() => {setSelectedItem(item)}}>{item.content}</td>
                    <td className="pl-[12px] cursor-pointer" onClick={() => {setSelectedItem(item)}}>{format(item.createdAt, 'yyyy.MM.dd HH:mm:ss')}</td>
                    <td 
                      className={`pl-[12px] cursor-pointer ${item.consultedYn === "N" ? "text-primary" : ""}`} 
                      onClick={() => {setSelectedItem(item)}}>
                        {item.consultedYn === 'Y' ? "완료" : "대기"}
                    </td>
                    <td className="pl-[12px]">{item?.bdId}
                      {/* <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`http://admin.buildingshop.co.kr/#/building/${item?.bdId}`, '_blank')
                        }}
                        className="hover:none w-full font-b1 px-[4px] py-[4px] rounded-[2px] items-center justify-between">
                        <ExternalLinkIcon size={16} color="#585C64"/>
                      </button> */}
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
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        aria-labelledby="delete-dialog-title"
      >
        <div className="flex flex-col gap-[16px] px-[16px] py-[8px]">
          <div className="mt-[16px] mx-auto p-[8px] bg-secondary-020 font-h2 rounded-full">❗</div>
          <h2 className="font-h2 px-[26px] text-center">선택 항목 삭제</h2>
          <div className="px-[30px]">
            <p className="font-s2 text-text-02 text-center">선택한 {selectedIds.length}개의 항목을 삭제하시겠습니까?</p>
            <p className="font-s2 text-text-02 text-center">삭제된 항목은 복구할 수 없습니다.</p>
          </div>
          <div className="px-[24px] pt-[8px] pb-[20px] flex justify-end gap-[12px]">
            <Button
              variant="bggray"
              className="w-[120px]"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </Button>
            <Button
              variant="bgsecondary"
              className="w-[120px]"
              onClick={() => handleUpdate("delete")}
            >
              {loadingAction === "delete" ? <Spinner/> : "삭제"}
            </Button>
          </div>
        </div>
      </Dialog>

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
                <Item title="날짜" value={selectedItem? format(selectedItem?.createdAt, 'yyyy.MM.dd HH:mm:ss') : ""}/>
                <div className="flex-1 space-y-[10px]">
                  <p className="font-s2 text-text-03">빌딩샵 빌딩 ID</p>
                  <div className="w-full font-b1 px-[14px] py-[12px] rounded-[2px] border border-line-04">{selectedItem?.bdId}</div>
                  {/* <button
                    onClick={() => window.open(`http://admin.buildingshop.co.kr/#/building/${selectedItem?.bdId}`, '_blank')}
                    className="w-full font-b1 px-[14px] py-[12px] rounded-[2px] border border-line-04 flex items-center justify-between">{selectedItem?.bdId} <ExternalLinkIcon size={16} color="#585C64"/></button>          */}
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