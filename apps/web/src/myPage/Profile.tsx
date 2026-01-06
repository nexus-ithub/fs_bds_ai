import { Avatar } from "@mui/material";
import { ChevronRightCustomIcon, HDivider } from "@repo/common";
import { useState } from "react";
import { useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import type { User } from "@repo/common";
import { getAccessToken } from "../authutil";
import useAxiosWithAuth from "../axiosWithAuth";
import { EditPasswordDialog } from "./EditPasswordDialog";
import { useNavigate } from "react-router-dom";
import { openIdentityVerification } from "../utils";
import { API_HOST } from "../constants";
import { toast } from "react-toastify";

export const Profile = () => {
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const navigate = useNavigate();
  const axiosInstance = useAxiosWithAuth();

  const [openEditPasswordDialog, setOpenEditPasswordDialog] = useState<boolean>(false);

  const handleIdentityVerification = () => {
    openIdentityVerification({
      apiHost: API_HOST,
      onSuccess: (data) => {
        phoneChange(data.userName, data.userPhone);
      },
      onError: (message) => {
        toast.error(message);
      },
      onPopupBlocked: () => {
        toast.error('팝업이 차단되었습니다.');
      }
    });
  };

  const phoneChange = async (userName: string, userPhone: string) => {
    try{
      const response = await axiosInstance.put(`/api/user/phone`, {
        userName,
        userPhone,
      });
      queryClient.setQueryData<User>(
        [QUERY_KEY_USER, getAccessToken()],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            name: userName,
            phone: userPhone,
          };
        }
      );
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-[480px] flex flex-col gap-[24px] px-[32px] py-[48px] max-md:p-[20px]">
        <div className="flex flex-col gap-[24px] p-[32px] rounded-[8px] border border-line-02">
          <div className="flex flex-col items-center gap-[12px]">
            <Avatar alt="" src={config?.profile} sx={{ width: 64, height: 64 }}/>
            <div className="flex flex-col items-center gap-[4px]">
              <p><span className="font-s1-p mr-[4px]">{config?.name ?? ""}</span><span className="font-s1 text-text-02">고객님</span></p>
              <p className="font-s1-p">{config?.email ?? ""}</p>
            </div>
          </div>
          <HDivider/>
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2">이메일</p>
              <div className="py-[12px] font-b1 text-text-05 border-b border-line-03">{config?.email ?? ""}</div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">고객명</p>
              <div className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] ${config?.name ? "border-line-04" : "border-line-03"}`}>
                <p className="font-b1 text-text-05">{config?.name ?? ""}</p>
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">휴대폰 번호</p>
              <div 
                className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] cursor-pointer ${config?.phone ? "border-line-04" : "border-line-03"}`}
                onClick={() => handleIdentityVerification()}
                >
                <p className={`font-b1 ${config?.phone ? "" : "text-text-04"}`}>{config?.phone ?? "휴대폰 번호를 입력하세요."}</p>
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
            >
            <p className="font-s2 text-text-02" >비밀번호 변경</p>
            <ChevronRightCustomIcon size={16}/>
          </div>
        }
        <div 
          className="flex items-center justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02 cursor-pointer"
          onClick={() => navigate('/delete-account')}
          >
          <p className="font-s2 text-text-02">회원 탈퇴</p>
          <ChevronRightCustomIcon size={16}/>
        </div>
      </div>
      <EditPasswordDialog open={openEditPasswordDialog} onClose={() => setOpenEditPasswordDialog(false)}/>
    </div>
  )
}