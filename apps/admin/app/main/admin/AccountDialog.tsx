import { Dialog } from "@mui/material";
import { useEffect, useState } from "react";
import { Admin, FormField, Radio, Spinner, VDivider, Button, CloseIcon, DotProgress } from "@repo/common";
import useAxiosWithAuth from "../../utils/axiosWithAuth";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { EditPasswordDialog } from "./EditPasswordDialog";

interface AccountDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedAdmin: Admin | null;
  setSelectedAdmin: (selectedAdmin: Admin | null) => void;
  getUsers?: () => void;
  updateSession?: () => void;
  isLoading?: boolean;
}

export const AccountDialog = ({
  open,
  setOpen,
  selectedAdmin,
  setSelectedAdmin,
  getUsers,
  isLoading=false,
}: AccountDialogProps) => {
  const axiosInstance = useAxiosWithAuth();
  const { data: session, update } = useSession();
  const [email, setEmail] = useState<string>('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [adminType, setAdminType] = useState<'M' | 'N'>('M');
  const [openEditPasswordDialog, setOpenEditPasswordDialog] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const isModified = selectedAdmin
  ? selectedAdmin.email !== email ||
    selectedAdmin.name !== name ||
    selectedAdmin.phone !== phone ||
    selectedAdmin.adminType !== adminType
  : true;

  console.log("selectedAdmin", selectedAdmin);

  const handleEmailValidation = async () => {
    if (emailValid !== null) return;
    setEmailLoading(true);

    const res = await fetch(`/api/bff/public?action=check-email&email=${email}`);
    const data = await res.json();

    setEmailValid(!data.success)
    setEmailLoading(false);
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
    setPhone(onlyNumbers);
  };

  const updateSession = async () => {
    await update({
      user: {
        ...session?.user,
        name: name,
        email: email,
        adminType: adminType,
      }
    });
  }

  const handleSubmit = async () => {
    if (!email || !name || !adminType) return;
    try{
      setLoading(true);
      if (selectedAdmin) {
        await axiosInstance.put("/admin", {action: "update", id: selectedAdmin.id, email, name, phone, adminType});
      } else {
        await axiosInstance.post("/admin", {action: "register", email, name, phone, adminType});
      }
      setOpen(false);
      setLoading(false);
      if (getUsers) {
        getUsers();
        if (selectedAdmin?.email === session?.user?.email) {
          updateSession();
        }
      } else {
        updateSession();
      }
    } catch (error) {
      toast.error("관리자 계정 추가/수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
            <h4 className="font-h4">{isLoading ? <Spinner/> : selectedAdmin ? '관리자 수정' : '관리자 추가'}</h4>
            <VDivider colorClassName="bg-line-04" className="!h-[12px]"/>
            <p className="font-s2 text-text-03">관리자를 정보를 입력하고 관리 권한 설정을 선택해 주세요.</p>
          </div>
          <button onClick={() => setOpen(false)}><CloseIcon color="#1A1C20"/></button>
        </div>
        {isLoading 
          ? 
          <div className="flex items-center justify-center p-[24px] h-[248px]">
            <DotProgress size="sm"/>
          </div>
          : 
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
                      ? "text-green-500 cursor-default"
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
            {session?.user?.adminType === 'M' && (
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
            )}
          </div>
        }
        <div className="flex items-center justify-center p-[24px]">
          <div className={`w-full flex items-center ${session?.user?.email === selectedAdmin?.email ? 'justify-between' : 'justify-end'} gap-[10px]`}>
            {session?.user?.email === selectedAdmin?.email && (
              <Button size="medium" fontSize="font-h4" className="w-[120px]" onClick={() => setOpenEditPasswordDialog(true)}>비밀번호 변경</Button>
            )}
            <Button size="medium" fontSize="font-h4" className="w-[240px]" disabled={!emailValid || !name || !isModified} onClick={handleSubmit}>
              {loading ? <Spinner /> : selectedAdmin ? '수정' : '추가'}
            </Button>
          </div>
        </div>
      </div>
      <EditPasswordDialog open={openEditPasswordDialog} onClose={() => setOpenEditPasswordDialog(false)} selectedAdmin={selectedAdmin ?? undefined}/>
    </Dialog>
  )
}
