'use client';

import { Button, CloseIcon, DeleteIcon, DownloadIcon, EditIcon, HDivider, Pagination, Refresh, SearchBar, VDivider, FormField, Radio, Spinner, DotProgress } from "@repo/common";
import { type Admin } from "@repo/common";
import { useState } from "react";
import { Dialog } from "@mui/material";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import useAxiosWithAuth from "../../utils/axiosWithAuth";

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
  const [admins, setAdmins] = useState<Admin[]>([]);

  const [email, setEmail] = useState<string>('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [adminType, setAdminType] = useState<'M' | 'N'>('M');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const isModified = selectedAdmin
  ? selectedAdmin.email !== email ||
    selectedAdmin.name !== name ||
    selectedAdmin.phone !== phone ||
    selectedAdmin.adminType !== adminType
  : true;

  const [openAddAccount, setOpenAddAccount] = useState<boolean>(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
    setPhone(onlyNumbers);
  };

  const handleEmailValidation = async () => {
    if (emailValid !== null) return;
    setEmailLoading(true);

    const res = await fetch(`/api/bff/public?action=check-email&email=${email}`);
    const data = await res.json();

    setEmailValid(data.success)
    setEmailLoading(false);
  }

  const handleSubmit = async () => {
    if (!email || !name || !adminType) return;
    setLoading(true);
    if (selectedAdmin) {
      await axiosInstance.put("/", {action: "update", id: selectedAdmin.id, email, name, phone, adminType});
    } else {
      await axiosInstance.post("/", {action: "register", email, name, phone, adminType});
    }
    setOpenAddAccount(false);
    getUsers();
    setLoading(false);
  }

  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setLoading(true);
    await axiosInstance.put("/", { action: "delete", id: selectedAdmin.id });
    setOpenDeleteConfirm(false);
    getUsers();
    setLoading(false);
  }

  const getUsers = async () => {
    const response = await axiosInstance.get("/", { params: { action: "list" } });
    const data = await response.data;
    console.log("data", data);
    setAdmins(data);
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      getUsers();
    }
  }, [status, session?.accessToken])

  useEffect(() => {
    if (!openAddAccount) {
      setSelectedAdmin(null);
      setEmail('');
      setName('');
      setPhone('');
      setAdminType('M');
      setEmailValid(null);
      setEmailLoading(false);
    }
  }, [openAddAccount])

  useEffect(() => {
    if (selectedAdmin) {
      if (selectedAdmin.email === email) {
        setEmailValid(true);
      } else {
        setEmailValid(null);
      }
    } else {
      setEmailValid(null);
    }
  }, [selectedAdmin, email]);

  return (
    <div className="w-[960px] flex flex-col gap-[16px] p-[40px]">
      <div className="flex items-center justify-between gap-[16px]">
        <h2 className="font-h2">관리자 계정</h2>
        <Button variant="outline" size="small" fontSize="font-s4" onClick={() => setOpenAddAccount(true)}>관리자 추가</Button>
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
            <th className="pl-[16px] py-[14px] font-s3">이름</th>
            <th className="pl-[12px] py-[14px] font-s3">이메일</th>
            <th className="pl-[12px] py-[14px] font-s3">연락처</th>
            {/* <th className="pl-[12px] py-[14px] font-s3">부서</th>
            <th className="pl-[12px] py-[14px] font-s3">직급</th> */}
            <th className="pl-[12px] py-[14px] font-s3">권한</th>
            <th className="pl-[12px] py-[14px] font-s3">등록일</th>
            <th className="pl-[12px] pr-[16px] py-[14px] w-[52px]">{" "}</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((account, index) => (
            <tr key={index} className="h-[56px] font-s2 border-b border-line-02">
              <td className="pl-[16px]">{account.name}</td>
              <td className="pl-[12px]">{account.email}</td>
              <td className="pl-[12px]">{account.phone}</td>
              {/* <td className="pl-[12px]">{account.department}</td>
              <td className="pl-[12px]">{account.position}</td> */}
              <td className="pl-[12px]">{account.adminType === 'M' ? '마스터' : '일반'}</td>
              <td className="pl-[12px]">{format(new Date(account.createdAt), "yyyy.MM.dd")}</td>
              <td className="pl-[12px] pr-[16px] w-[52px]">
                <div className="flex items-center gap-[12px]">
                  <button
                    onClick={() => {
                      setSelectedAdmin(account);
                      setEmail(account.email);
                      setName(account.name);
                      setPhone(account.phone ?? '');
                      setAdminType(account.adminType as "M" | "N");
                      setOpenAddAccount(true);
                    }}
                  ><EditIcon/></button>
                  <button
                    onClick={() => {setOpenDeleteConfirm(true); setSelectedAdmin(account)}}
                  ><DeleteIcon color="#585C64"/></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-center py-[12px]">
        <Pagination totalItems={admins.length} itemsPerPage={pageSize} currentPage={currentPage} onPageChange={setCurrentPage}/>
      </div>
      <Dialog
        open={openAddAccount}
        onClose={() => setOpenAddAccount(false)}
        disableScrollLock={true}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            width: "640px",
          },
        }}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-[20px] py-[14px]">
            <div className="flex items-center gap-[12px] py-[8px]">
              <h4 className="font-h4">{selectedAdmin ? '관리자 수정' : '관리자 추가'}</h4>
              <VDivider colorClassName="bg-line-04" className="!h-[12px]"/>
              <p className="font-s2 text-text-03">관리자를 정보를 입력하고 관리 권한 설정을 선택해 주세요.</p>
            </div>
            <button onClick={() => setOpenAddAccount(false)}><CloseIcon color="#1A1C20"/></button>
          </div>
          <div className="flex flex-col gap-[20px] px-[24px]">
          <FormField 
            label="이메일" 
            type="email" 
            placeholder="이메일을 입력하세요." 
            value={email} 
            required
            onChange={(e) => {setEmail(e.target.value); setEmailValid(null)}}
            rightElement={
              <button
                type="button"
                onClick={() => handleEmailValidation()}
                className={`font-s2 transition-colors ${
                  emailValid === true
                    ? "text-primary cursor-default"
                    : emailValid === false
                    ? "text-secondary-050 cursor-default"
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                    ? "text-text-04 cursor-default"
                    : "text-primary"
                }`}
                disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || emailLoading}
              >
                {emailLoading ? <Spinner/> : emailValid === null ? "중복확인" : emailValid ? "사용가능" : "사용불가"}
              </button>
            }
            />
            <div className="flex items-center gap-[24px]">
            <FormField 
              label="이름" 
              type="text" 
              placeholder="이름을 입력하세요." 
              value={name} 
              required
              onChange={(e) => setName(e.target.value)}/>
              <FormField 
              label="연락처" 
              type="tel" 
              placeholder="연락처를 입력하세요." 
              value={phone} 
              onChange={handlePhoneChange}
              />
            </div>
            <form className="flex items-center justify-center gap-[120px] px-[14px] py-[15px] rounded-[2px] border border-line-03">
              <Radio
                label="마스터"
                value="M"
                checked={adminType === 'M'}
                onChange={() => setAdminType('M')}
              />
              <Radio
                label="일반"
                value="N"
                checked={adminType === 'N'}
                onChange={() => setAdminType('N')}
              />
            </form>
          </div>
          <div className="flex items-center justify-center p-[24px]">
            <div className="w-[400px] flex items-center gap-[10px]">
              <Button variant="bggray" size="medium" fontSize="font-h4" className="w-[120px]" onClick={() => setOpenAddAccount(false)}>취소</Button>
              <Button size="medium" fontSize="font-h4" className="flex-1" disabled={!emailValid || !name || !isModified} onClick={handleSubmit}>
                {loading ? <Spinner /> : selectedAdmin ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
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