'use client';

import { Button, DeleteIcon, DownloadIcon, EditIcon, HDivider, Pagination, Refresh, SearchBar, Spinner, DotProgress } from "@repo/common";
import { type Admin } from "@repo/common";
import { useState } from "react";
import { Dialog } from "@mui/material";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { AccountDialog } from "./AccountDialog";

const COUNT_BUTTON = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 50, label: '50' },
];

export default function Admin() {
  const axiosInstance = useAxiosWithAuth();
  const { data: session, status } = useSession();
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const [openAddAccount, setOpenAddAccount] = useState<boolean>(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setLoading(true);
    await axiosInstance.put("/admin", { action: "delete", id: selectedAdmin.id });
    setOpenDeleteConfirm(false);
    getUsers();
    setLoading(false);
  }

  const getUsers = async () => {
    try {
      setInitialLoading(true);
      const response = await axiosInstance.get("/admin", { params: { action: "list", keyword: searchKeyword, page: currentPage, size: pageSize } });
      const data = await response.data;
      setAdmins(data.users);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      getUsers();
    }
  }, [status, session?.accessToken])

  useEffect(() => {
    getUsers()
  }, [currentPage, pageSize]);

  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex items-center justify-between gap-[16px]">
        <h2 className="font-h2">관리자 계정</h2>
        <Button variant="outline" size="small" fontSize="font-s4" onClick={() => setOpenAddAccount(true)}>관리자 추가</Button>
      </div>
      <HDivider className="!bg-line-02"/>
      <div className="flex items-center justify-between gap-[16px]">
        <div className="flex items-center gap-[12px]">
          <SearchBar
            placeholder="검색어를 입력해 주세요."
            value={searchKeyword}
            onChange={setSearchKeyword}
            variant="filled"
            prefixSize={14}
            className="font-b3 px-[8px] py-[6px]"
            onSearch={getUsers}
          />
          <Button
            // disabled={searchKeyword === ''}
            onClick={() => getUsers()} 
            className="font-b3 py-[5px]" size="small">
            검색
          </Button>
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
            <th className="pl-[16px] py-[14px] font-s3">이름</th>
            <th className="pl-[12px] py-[14px] font-s3">이메일</th>
            <th className="pl-[12px] py-[14px] font-s3">연락처</th>
            <th className="pl-[12px] py-[14px] font-s3">권한</th>
            <th className="pl-[12px] py-[14px] font-s3">등록일</th>
            <th className="pl-[12px] pr-[16px] py-[14px] w-[52px]">{" "}</th>
          </tr>
        </thead>
        <tbody>
          {initialLoading ? (
            <tr>
              <td colSpan={7} className="h-[100px] font-s2 border-b border-line-02">
                <div className="flex flex-col items-center justify-center h-[120px]">
                  <DotProgress size="sm"/>
                </div>
              </td>
            </tr>
          ) : (
            admins.map((account, index) => (
              <tr key={index} className="h-[56px] font-s2 border-b border-line-02">
                <td className="pl-[16px]">{account.name}</td>
                <td className="pl-[12px]">{account.email}</td>
                <td className="pl-[12px]">{account.phone}</td>
                <td className="pl-[12px]">{account.adminType === 'M' ? '마스터' : '일반'}</td>
                <td className="pl-[12px]">{format(new Date(account.createdAt), "yyyy.MM.dd")}</td>
                <td className="pl-[12px] pr-[16px] w-[52px]">
                  <div className="flex items-center gap-[12px]">
                    <button
                      onClick={() => {
                        setSelectedAdmin(account);
                        setOpenAddAccount(true);
                      }}
                    ><EditIcon/></button>
                    <button
                      onClick={() => {setOpenDeleteConfirm(true); setSelectedAdmin(account)}}
                    ><DeleteIcon color="#585C64"/></button>
                  </div>
                </td>
              </tr>
          )))}
        </tbody>
      </table>
      <div className="flex items-center justify-center py-[12px]">
        <Pagination totalItems={totalCount} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
      </div>
      <AccountDialog
        open={openAddAccount}
        setOpen={setOpenAddAccount}
        selectedAdmin={selectedAdmin}
        setSelectedAdmin={setSelectedAdmin}
        getUsers={getUsers}
      />
      <Dialog open={openDeleteConfirm} onClose={() => setOpenDeleteConfirm(false)}>
        <div className="flex flex-col gap-[20px] min-w-[340px]">
          <h3 className="font-h3 px-[20px] py-[12px] border-b border-line-03">관리자 계정 삭제</h3>
          <p className="font-s1 px-[20px]">관리자 계정을 정말 삭제하시겠습니까?</p>

          <div className="flex justify-end gap-[12px] px-[20px] py-[12px]">
            <Button variant="bggray" className="w-[60px]" onClick={() => {setOpenDeleteConfirm(false)}}>취소</Button>
            <Button className="w-[100px]" onClick={() => {handleDelete();}}>{loading ? <Spinner /> : '삭제'}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}