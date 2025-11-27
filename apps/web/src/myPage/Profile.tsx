import { Avatar, Dialog } from "@mui/material";
import { Button, ChevronRightCustomIcon, CloseIcon, FormField, HDivider, Spinner } from "@repo/common";
import { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import type { User } from "@repo/common";
import { getAccessToken } from "../authutil";
import useAxiosWithAuth from "../axiosWithAuth";
import { EditPasswordDialog } from "./EditPasswordDialog";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export const Profile = () => {
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const navigate = useNavigate();
  const axiosInstance = useAxiosWithAuth();

  const [email, setEmail] = useState<string>(config?.email ?? "");
  const [name, setName] = useState<string>(config?.name ?? "");
  const [phone, setPhone] = useState<string | null>(config?.phone ?? null);

  // const [password, setPassword] = useState<string>("");
  // const [showPassword, setShowPassword] = useState<boolean>(false);
  // const [error, setError] = useState<string>("");
  const [openEditPasswordDialog, setOpenEditPasswordDialog] = useState<boolean>(false);
  // const [openPasswordConfirm, setOpenPasswordConfirm] = useState<boolean>(false);
  // const [loading, setLoading] = useState<boolean>(false);

  console.log(">>>config ", config)

  // const handleConfirmPassword = async() => {
  //   try {
  //     setLoading(true);
  //     await axiosInstance.post('/api/user/check-password', {password});
  //     navigate('/delete-account', {state: {pwConfirm: true}});
  //   } catch (error) {
  //     setError("비밀번호가 일치하지 않습니다.");
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // useEffect(() => {
  //   if (!openPasswordConfirm) {
  //     setPassword('');
  //     setError('');
  //   }
  // }, [openPasswordConfirm]);
  
  return (
    <div className="w-full flex justify-center">
      <div className="w-[480px] flex flex-col gap-[24px] px-[32px] py-[48px]">
        <div className="flex flex-col gap-[24px] p-[32px] rounded-[8px] border border-line-02">
          <div className="flex flex-col items-center gap-[12px]">
            <Avatar alt="" src={config?.profile} sx={{ width: 64, height: 64 }}/>
            <div className="flex flex-col items-center gap-[4px]">
              <p><span className="font-s1-p mr-[4px]">{name}</span><span className="font-s1 text-text-02">고객님</span></p>
              <p className="font-s1-p">{email}</p>
            </div>
          </div>
          <HDivider/>
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2">이메일</p>
              <div className="py-[12px] font-b1 text-text-05 border-b border-line-03">{email}</div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">고객명</p>
              <div className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] ${name ? "border-line-04" : "border-line-03"}`}>
                <p className="font-b1 text-text-05">{name}</p>
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">휴대폰 번호</p>
              <div 
                className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] cursor-pointer ${phone ? "border-line-04" : "border-line-03"}`}
                onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
                >
                <p className={`font-b1 ${phone ? "" : "text-text-04"}`}>{phone ?? "휴대폰 번호를 입력하세요."}</p>
                <ChevronRightCustomIcon size={16}/>
              </div>
            </div>
          </div>
        </div>
        {config?.provider 
        ? null
        : <div 
            className={`flex items-center justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02 ${config?.provider ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => {if (!config?.provider) setOpenEditPasswordDialog(true)}}
            // onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
            >
            <p className="font-s2 text-text-02" >비밀번호 변경</p>
            <ChevronRightCustomIcon size={16}/>
          </div>
        }
        <div 
          className="flex items-center justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02 cursor-pointer"
          // onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
          // onClick={() => setOpenPasswordConfirm(true)}
          onClick={() => navigate('/delete-account')}
          >
          <p className="font-s2 text-text-02">회원 탈퇴</p>
          <ChevronRightCustomIcon size={16}/>
        </div>
      </div>
      <EditPasswordDialog open={openEditPasswordDialog} onClose={() => setOpenEditPasswordDialog(false)}/>
      {/* <Dialog
        open={openPasswordConfirm}
        onClose={() => setOpenPasswordConfirm(false)}
      >
        <div className="w-[420px] flex flex-col gap-[24px]">
          <div className="flex flex-col rounded-[8px] border border-line-02">
            <div className="flex items-center justify-between px-[16px] py-[12px]">
              <h2 className="font-h3">비밀번호 확인</h2>
              <button onClick={() => setOpenPasswordConfirm(false)}><CloseIcon/></button>
            </div>
            <HDivider/>
            <div className="p-[16px]">
              <form 
              className="flex flex-col" 
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirmPassword();
              }}
            >
              <FormField 
                label="현재 비밀번호" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="비밀번호를 입력하세요." 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <span onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                    {showPassword ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/> }
                  </span>
                }
              />
              {error && (
                <p className="font-s3 text-secondary-050 pt-[2px]">{error}</p>
              )}
              <Button className="w-full mt-[12px]" size="semiMedium" onClick={() => handleConfirmPassword()}>{loading ? <Spinner />: "확인"}</Button>
            </form>
            </div>
          </div>
        </div>
      </Dialog> */}
    </div>
  )
}