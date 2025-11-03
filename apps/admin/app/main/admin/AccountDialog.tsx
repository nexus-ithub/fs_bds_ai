import { Dialog } from "@mui/material";
import { useEffect, useState } from "react";
import { Admin, FormField, Radio, Spinner, VDivider, Button, CloseIcon } from "@repo/common";
import useAxiosWithAuth from "../../utils/axiosWithAuth";

interface AccountDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedAdmin: Admin | null;
  setSelectedAdmin: (selectedAdmin: Admin | null) => void;
  getUsers?: () => void;
  // email: string;
  // setEmail: (email: string) => void;
  // emailValid: boolean | null;
  // setEmailValid: (emailValid: boolean | null) => void;
  // name: string;
  // setName: (name: string) => void;
  // phone: string;
  // setPhone: (phone: string) => void;
  // adminType: "M" | "N";
  // setAdminType: (adminType: "M" | "N") => void;
  // isModified: boolean;
  // loading: boolean;
  // setLoading: (loading: boolean) => void;
  // emailLoading: boolean;
  // setEmailLoading: (emailLoading: boolean) => void;
  // handleEmailValidation: () => void;
  // handleSubmit: () => void;
  // handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AccountDialog = ({
  open,
  setOpen,
  selectedAdmin,
  setSelectedAdmin,
  getUsers,
  // email,
  // setEmail,
  // emailValid,
  // setEmailValid,
  // name,
  // setName,
  // phone,
  // setPhone,
  // adminType,
  // setAdminType,
  // isModified,
  // loading,
  // setLoading,
  // emailLoading,
  // setEmailLoading,
  // handleEmailValidation,
  // handleSubmit,
  // handlePhoneChange,
}: AccountDialogProps) => {
  const axiosInstance = useAxiosWithAuth();
  const [email, setEmail] = useState<string>('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [adminType, setAdminType] = useState<'M' | 'N'>('M');
  const [loading, setLoading] = useState<boolean>(false);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const isModified = selectedAdmin
  ? selectedAdmin.email !== email ||
    selectedAdmin.name !== name ||
    selectedAdmin.phone !== phone ||
    selectedAdmin.adminType !== adminType
  : true;

  const handleEmailValidation = async () => {
    if (emailValid !== null) return;
    setEmailLoading(true);

    const res = await fetch(`/api/bff/public?action=check-email&email=${email}`);
    const data = await res.json();

    setEmailValid(data.success)
    setEmailLoading(false);
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
    setPhone(onlyNumbers);
  };

  const handleSubmit = async () => {
    if (!email || !name || !adminType) return;
    setLoading(true);
    if (selectedAdmin) {
      await axiosInstance.put("/admin", {action: "update", id: selectedAdmin.id, email, name, phone, adminType});
    } else {
      await axiosInstance.post("/admin", {action: "register", email, name, phone, adminType});
    }
    setOpen(false);
    setLoading(false);
    getUsers?.();
  }

  useEffect(() => {
    if (selectedAdmin) {
      setEmail(selectedAdmin.email);
      setName(selectedAdmin.name);
      setPhone(selectedAdmin.phone ?? '');
      setAdminType(selectedAdmin.adminType);
    }
  }, [selectedAdmin])

  useEffect(() => {
    if (!open) {
      setEmail('');
      setEmailValid(null);
      setName('');
      setPhone('');
      setAdminType('M');
      setLoading(false);
      setEmailLoading(false);
      setSelectedAdmin(null);
    }
  }, [open])

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
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
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
          <button onClick={() => setOpen(false)}><CloseIcon color="#1A1C20"/></button>
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
            <Button variant="bggray" size="medium" fontSize="font-h4" className="w-[120px]" onClick={() => setOpen(false)}>취소</Button>
            <Button size="medium" fontSize="font-h4" className="flex-1" disabled={!emailValid || !name || !isModified} onClick={handleSubmit}>
              {loading ? <Spinner /> : selectedAdmin ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
