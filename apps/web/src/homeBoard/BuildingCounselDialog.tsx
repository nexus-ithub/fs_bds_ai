import { Dialog } from "@mui/material";
import { Button, CloseIcon, HDivider, VDivider, Checkbox } from "@repo/common";
import { useState } from "react";

export const BuildingCounselDialog = ({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const [privacyChecked, setPrivacyChecked] = useState<boolean>(false);
  // 로그인 여부 확인 필요
  return (
    <Dialog
      maxWidth="xl"
      open={open} onClose={onClose}>
      <div className="w-[640px] flex flex-col">
        <div className="flex items-center justify-between h-[64px] px-[20px] py-[14px]">
          <div className="flex items-center gap-[8px]">
            <p className="font-h4">매입 상담 요청</p>
            <VDivider colorClassName="bg-line-04 !h-[12px]"/>
            <p className="font-s2 text-text-03">해당 매물의 매입에 관한 상담을 위해 아래 항목을 입력해 주세요.</p>
          </div>
          <button onClick={onClose} className="font-h3"><CloseIcon/></button>
        </div>
        <div className="w-full flex flex-col gap-[24px] px-[24px] pb-[24px]">
          <div className="w-full flex flex-col gap-[20px]">
            <p className="font-h4">고객 정보</p>
            <div className="w-full flex gap-[20px]">
              <div className="flex-1 flex flex-col gap-[12px]">
                <p className="font-s2 text-text-02">고객명</p>
                <input 
                  type="text" 
                  placeholder="이름을 입력하세요." 
                  className="px-[14px] py-[12px] border border-line-03 rounded-[2px]"/>
              </div>
              <div className="flex-1 flex flex-col gap-[12px]">
                <p className="font-s2 text-text-02">휴대폰 번호</p>
                <input 
                  type="text" 
                  placeholder="휴대폰 번호를 입력하세요." 
                  className="px-[14px] py-[12px] border border-line-03 rounded-[2px]"/>
              </div>
            </div>
            <HDivider colorClassName="bg-line-02"/>
            <div className="w-full flex flex-col gap-[16px]">
              <p className="font-h4">추가 요청 사항</p>
              <textarea
                placeholder="본 물건에 대해 문의하실 내용을 작성해 주세요." 
                className="h-[120px] px-[16px] py-[12px] font-b2 rounded-[4px] resize-none bg-surface-second"/>
            </div>
            {/* 비로그인일 때 TODO */}
            <HDivider colorClassName="bg-line-02"/>
            <div className="w-full flex flex-col gap-[12px]">
              <div className="flex items-center gap-[8px]">
                <Checkbox
                  checked={privacyChecked}
                  onChange={() => {setPrivacyChecked(!privacyChecked)}}
                  label="개인정보 취급방침에 동의합니다."
                  labelOrderLast={true}/>
              </div>
              <div className="overflow-hidden rounded-[4px] border border-line-02">
                <table className="w-full table-fixed">
                  <tbody className="">
                    <tr className="border-b border-line-02">
                      <th className="w-[228px] px-[12px] py-[8px] font-c3 text-text-02 text-left bg-surface-second">개인정보 수집항목</th>
                      <td className="px-[12px] py-[8px] font-c3 text-left border-l border-line-02">고객명, 고객연락처</td>
                    </tr>
                    <tr className="border-b border-line-02">
                      <th className="w-[228px] px-[12px] py-[8px] font-c3 text-text-02 text-left bg-surface-second">수집목적</th>
                      <td className="px-[12px] py-[8px] font-c3 text-left border-l border-line-02">당사가 제공하는 상담서비스를 위해 수집</td>
                    </tr>
                    <tr className="border-b border-line-02">
                      <th className="w-[228px] px-[12px] py-[8px] font-c3 text-text-02 text-left bg-surface-second">보유 및 이용기간</th>
                      <td className="px-[12px] py-[8px] font-c3 text-left border-l border-line-02">상담완료 후 고객의 삭제 요청시 또는 5년이내 정보 삭제</td>
                    </tr>
                    <tr>
                      <th className="w-[228px] px-[12px] py-[8px] font-c3 text-text-02 text-left bg-surface-second">동의의 거부에 따른 불이익의 내용안내</th>
                      <td className="px-[12px] py-[8px] font-c3 text-left border-l border-line-02">상담받을 수 없을뿐, 다른 불이익은 없습니다.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full flex gap-[10px] p-[24px] border-t border-line-02">
          <Button size="medium" variant="bggray" fontSize="font-h4" className="w-[200px]">취소</Button>
          <Button size="medium" fontSize="font-h4" className="flex-1">문의하기</Button>
        </div>
      </div>
    </Dialog>
  )
}