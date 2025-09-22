import { Avatar } from "@mui/material";
import { ChevronRightCustomIcon, HDivider, Switch } from "@repo/common";
import { useState } from "react";

export const Profile = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [login, setLogin] = useState(null);
  const [alarm, setAlarm] = useState<boolean>(false);
  
  return (
    <div className="w-full flex justify-center">
      <div className="w-[480px] flex flex-col gap-[24px] px-[32px] py-[48px]">
        <div className="flex flex-col gap-[24px] p-[32px] rounded-[8px] border border-line-02">
          <div className="flex flex-col items-center gap-[12px]">
            <Avatar alt="내 프로필" src="/support_header.jpg" sx={{ width: 64, height: 64 }}/>
            <div className="flex flex-col items-center gap-[4px]">
              <p><span className="font-s1-p mr-[4px]">김이름</span><span className="font-s1 text-text-02">고객님</span></p>
              <p className="font-s1-p">admin@jungin.com</p>
            </div>
          </div>
          <HDivider/>
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2">이메일</p>
              <div className="py-[12px] font-b1 text-text-05 border-b border-line-03">{email ?? "이메일 넣어줘야됨(수정불가)"}</div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">고객명</p>
              <div className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] ${name ? "border-line-04" : "border-line-03"}`}>
                <p>{name ?? "이름(수정가능)"}</p>
                <ChevronRightCustomIcon size={16} />
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">휴대폰 번호</p>
              <div className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] ${phone ? "border-line-04" : "border-line-03"}`}>
                <p className={`font-b1 ${phone ? "" : "text-text-04"}`}>{phone ?? "휴대폰 번호를 입력하세요."}</p>
                <ChevronRightCustomIcon size={16} />
              </div>
            </div>
            <div className="flex flex-col gap-[12px]">
              <p className="font-s2 text-text-02">간편 로그인</p>
              <div className={`py-[12px] font-b1 border-b flex items-center justify-between gap-[8px] ${login ? "border-line-04" : "border-line-03"}`}>
                <p className={`font-b1 ${login ? "" : "text-text-04"}`}>{login ?? "간편 로그인 수단을 등록해 주세요."}</p>
                <ChevronRightCustomIcon size={16} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02">
          <p className="font-s2 text-text-02">알림설정</p>
          <Switch checked={alarm} onChange={(checked) => setAlarm(checked)}/>
        </div>
        <div className="flex justify-between gap-[12px] px-[32px] py-[28px] rounded-[8px] border border-line-02">
          <p className="font-s2 text-text-02">회원 탈퇴</p>
          <ChevronRightCustomIcon size={16} />
        </div>
      </div>
    </div>
  )
}