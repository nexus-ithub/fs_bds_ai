import { Avatar, Dialog } from "@mui/material";
import { ChevronRightCustomIcon, HDivider, Switch } from "@repo/common";
import { useState } from "react";
import { useQuery, useQueryClient } from "react-query";
import { QUERY_KEY_USER } from "../constants";
import type { User } from "@repo/common";
import { getAccessToken } from "../authutil";
import useAxiosWithAuth from "../axiosWithAuth";
import { EditPasswordDialog } from "./EditPasswordDialog";

export const Profile = () => {
  // const axiosInstance = useAxiosWithAuth();
  // const { data : config } = useQuery<User>({
  //     queryKey: [QUERY_KEY_USER, getAccessToken()],
  //     queryFn: async () => {
  //       const response = await axiosInstance.get("/api/user/info");
  //       return response.data;
  //     },
  //     enabled: !!getAccessToken(),
  //   })
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);

  const [email, setEmail] = useState<string>(config?.email ?? "");
  const [name, setName] = useState<string>(config?.name ?? "");
  const [phone, setPhone] = useState<string | null>(config?.phone ?? null);
  const [login, setLogin] = useState(null);
  const [alarm, setAlarm] = useState<boolean>(false);
  const [openEditPasswordDialog, setOpenEditPasswordDialog] = useState<boolean>(false);

  console.log(">>>config ", config)

  
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
                {/* <ChevronRightCustomIcon size={16} /> */}
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
                {/* <ChevronRightCustomIcon size={16}/> */}
              </div>
            </div>
            {/* <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">간편 로그인</p>
              <div className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] ${login ? "border-line-04" : "border-line-03"}`}>
                <p className={`font-b1 ${login ? "" : "text-text-04"}`}>{login ?? "간편 로그인 수단을 등록해 주세요."}</p>
                <ChevronRightCustomIcon size={16} />
              </div>
            </div> */}
          </div>
        </div>
        {/* <div className="flex justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02">
          <p className="font-s2 text-text-02">알림설정</p>
          <Switch checked={alarm} onChange={(checked) => setAlarm(checked)}/>
        </div> */}
        <div 
          className="flex items-center justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02 cursor-pointer"
          onClick={() => setOpenEditPasswordDialog(true)}
          // onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
          >
          <p className="font-s2 text-text-02" >비밀번호 변경</p>
          {config?.provider 
          ? <p className="font-s2 text-text-04">소셜 로그인 계정</p> 
          : <ChevronRightCustomIcon size={16}/>
          }
        </div>
        <div 
          className="flex items-center justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02 cursor-pointer"
          onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
          >
          <p className="font-s2 text-text-02" >회원 탈퇴</p>
          <ChevronRightCustomIcon size={16}/>
        </div>
      </div>
      <EditPasswordDialog open={openEditPasswordDialog} onClose={() => setOpenEditPasswordDialog(false)}/>
    </div>
  )
}