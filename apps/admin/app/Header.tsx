"use client";

import { BuildingShopBITitle, Button, VDivider } from "@repo/common"
import { IconButton, Avatar } from "@mui/material";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useState } from "react";
import { Dialog } from "@mui/material";

export const Header = () => {
  const router = useRouter();
  const session = useSession();
  const [openLogoutConfirm, setOpenLogoutConfirm] = useState<boolean>(false);

  return (
    <div className={`fixed top-0 left-0 z-50 w-full px-[20px] flex items-center justify-between h-[64px] border-b border-line-03 bg-white`}>
      <div className="flex items-center gap-[16px] h-[64px]">
        <button onClick={() => router.push("/")}>
          <BuildingShopBITitle />
        </button>
        <p className="font-s1-p">ADMIN</p>
      </div>
      <div className="flex items-center gap-[16px]">
        <div className="flex items-center gap-[8px] cursor-default">
          <IconButton className="!p-0 ">
            <Avatar alt="" src="" sx={{ width: 24, height: 24, cursor: 'default' }} />
          </IconButton>
          <p className="flex items-center gap-[4px]">
            <span className="font-s2-p">{session.data?.user?.name}</span>
            <span className="font-s2 text-primary">마스터</span>
          </p>
        </div>
        <VDivider colorClassName="bg-line-04" />
        <button className="font-s2-p" onClick={() => { setOpenLogoutConfirm(true) }}>
          LOGOUT
        </button>
      </div>
      <Dialog
        open={openLogoutConfirm}
        onClose={() => setOpenLogoutConfirm(false)}
        // aria-labelledby="alert-dialog-title"
        // aria-describedby="alert-dialog-description"
        className="z-[50]"
        disableScrollLock={true}
      >
        <div className="flex flex-col gap-[20px] min-w-[300px]">
          <h3 className="font-h3 px-[20px] py-[12px] border-b border-line-03">로그아웃</h3>
          <p className="font-s1 px-[20px]">로그아웃 하시겠습니까?</p>

          <div className="flex justify-end gap-[12px] px-[20px] py-[12px]">
            <Button variant="bggray" className="w-[60px]" onClick={() => { setOpenLogoutConfirm(false) }}>취소</Button>
            <Button className="w-[100px]" onClick={() => { signOut(); }}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}