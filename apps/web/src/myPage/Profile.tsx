import { Avatar } from "@mui/material";
import { ChevronRightCustomIcon, HDivider } from "@repo/common";

export const Profile = () => {
  return (
    <div className="w-full flex justify-center bg-yellow-50">
      <div className="flex flex-col gap-[24px] px-[32px] py-[48px] bg-blue-50">
        <div className="flex flex-col items-center gap-[12px]">
          <Avatar alt="내 프로필" src="/support_header.jpg" sx={{ width: 64, height: 64 }}/>
          <div className="flex flex-col items-center gap-[4px]">
            <p><span className="font-s1-p mr-[4px]">김이름</span><span className="font-s1 text-text-02">고객님</span></p>
            <p className="font-s1-p">admin@jungin.com</p>
          </div>
        </div>
        <HDivider/>
        <div className="flex flex-col gap-[12px]">
          <p className="font-s2">이메일</p>
          <div className="py-[12px] font-b1 text-text-05 border-b border-line-03">admin@jungin.com</div>
        </div>
        <div className="flex flex-col gap-[12px]">
          <p className="font-s2">고객명</p>
          <div className="py-[12px] font-b1 border-b border-line-04 flex items-center justify-between gap-[8px]">
            <p>김이름</p>
            <ChevronRightCustomIcon size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}