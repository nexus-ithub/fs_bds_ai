"use client";

import { BuildingShopBIText, VDivider } from "@repo/common"
import { IconButton, Avatar } from "@mui/material";
import { useRouter } from "next/navigation";

export const Header = () => {
  // const { data : config } = useQuery<User>({
  //   queryKey: [QUERY_KEY_USER, getAccessToken()]
  // })
  const router = useRouter();

  return (
    <div className={`fixed top-0 left-0 z-50 w-full px-[20px] flex items-center justify-between h-[64px] bg-white border-b border-line-03`}>
      <div className="flex items-center gap-[16px] h-[64px]">
        <button onClick={() => router.push("/")}>
          <BuildingShopBIText />
        </button>
        <p className="font-s1-p">ADMIN</p>
      </div>
      <div className="flex items-center gap-[16px]">
        <div className="flex items-center gap-[8px]">
          <IconButton className="!p-0">
            <Avatar alt="내 프로필" src="" sx={{ width: 24, height: 24 }}/>
          </IconButton>
          <p className="flex items-center gap-[4px] cursor-pointer">
            <span className="font-s2-p">{"김이름"}</span>
            <span className="font-s2 text-text-02">고객님</span>
          </p>
        </div>
        <VDivider colorClassName="bg-line-04"/>
        <button className="font-s2-p">
          LOGOUT
        </button>
      </div>
    </div>
  )
}