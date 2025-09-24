import { Dialog } from "@mui/material"
import { Button, Checkbox, ChevronDownCustomIcon, ChevronRightCustomIcon, HDivider } from "@repo/common"
import { useState, useEffect } from "react"

export const Signup = ({open, onClose}: {open: boolean, onClose: () => void}) => {
  const [serviceAgree, setServiceAgree] = useState<boolean>(false);
  const [privacyAgree, setPrivacyAgree] = useState<boolean>(false);
  const [marketingEmailAgree, setMarketingEmailAgree] = useState<boolean>(false);
  const [marketingSmsAgree, setMarketingSmsAgree] = useState<boolean>(false);
  const [openMarketingAgree, setOpenMarketingAgree] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setServiceAgree(false);
      setPrivacyAgree(false);
      setMarketingEmailAgree(false);
      setMarketingSmsAgree(false);
      setOpenMarketingAgree(false);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return;
        if (reason === 'escapeKeyDown') return;
        onClose();
      }}
    >
      <div className="w-[360px] flex flex-col gap-[24px] p-[32px]">
        <div className="flex flex-col items-center gap-[6px]">
          <h2 className="font-h2">서비스 약관동의</h2>
          <p className="font-s2 text-text-02">빌딩샵 사용을 위한 약관 동의가 필요해요</p>
        </div>
        <div className="flex flex-col gap-[16px] p-[20px] rounded-[4px] border border-line-02">
          <Checkbox
            label="약관 전체 동의"
            labelOrderLast={true}
            checked={serviceAgree && privacyAgree && marketingEmailAgree && marketingSmsAgree}
            onChange={(checked) => {
              setServiceAgree(checked);
              setPrivacyAgree(checked);
              setMarketingEmailAgree(checked);
              setMarketingSmsAgree(checked);
            }}
          />
          <HDivider dashed={true} className="!border-b-line-02"/>
          <div className="flex justify-between items-center">
            <Checkbox
              label="서비스 이용약관 동의(필수)"
              labelOrderLast={true}
              checked={serviceAgree}
              onChange={(checked) => {
                setServiceAgree(checked);
              }}/>
            <button className="w-[14px] h-[14px] flex items-center justify-center">
              <ChevronRightCustomIcon/>
            </button>
          </div>
          <div className="flex justify-between items-center">
            <Checkbox
              label="개인정보수집 동의(필수)"
              labelOrderLast={true}
              checked={privacyAgree}
              onChange={(checked) => {
              setPrivacyAgree(checked);
            }}/>
            <button className="w-[14px] h-[14px] flex items-center justify-center">
              <ChevronRightCustomIcon/>
            </button>
          </div>
          <div className="flex justify-between items-center">
            <Checkbox
              label="마케팅 정보 수신 동의(선택)"
              labelOrderLast={true}
              checked={marketingEmailAgree || marketingSmsAgree}
              onChange={(checked) => {
              setMarketingEmailAgree(checked);
              setMarketingSmsAgree(checked);
            }}/>
            <button className={`w-[14px] h-[14px] flex items-center justify-center ${openMarketingAgree ? 'rotate-180' : ''}`} onClick={() => {setOpenMarketingAgree(!openMarketingAgree)}}>
              <ChevronDownCustomIcon/>
            </button>
          </div>
          {openMarketingAgree && (
            <div className="flex items-center gap-[24px] px-[20px] py-[12px] border border-line-02">
              <Checkbox
                label="이메일"
                labelOrderLast={true}
                checked={marketingEmailAgree}
                labelClassName="font-s2 text-text-04"
                className="flex-1"
                onChange={(checked) => {
                setMarketingEmailAgree(checked);
              }}/>
              <Checkbox
                label="SMS"
                labelOrderLast={true}
                checked={marketingSmsAgree}
                labelClassName="font-s2 text-text-04"
                className="flex-1"
                onChange={(checked) => {
                setMarketingSmsAgree(checked);
              }}/>
            </div>
          )}
        </div>
        <div className="flex items-center gap-[12px]">
          <Button
            onClick={onClose}
            variant="bggray"
            size="medium"
            fontSize="font-h4"
            className="w-[80px]"
          >취소</Button>
          <Button
            onClick={onClose}
            variant="default"
            size="medium"
            fontSize="font-h4"
            className="flex-1"
            disabled={!serviceAgree || !privacyAgree}
          >동의하고 본인인증하기</Button>
        </div>
        <HDivider className="!border-b-line-02"/>
        <div className="flex items-center gap-[12px] mt-[8px] mx-auto">
          <p className="font-s2 text-text-03">이미 회원이세요?</p>
          <button className="font-s2 text-primary" onClick={onClose}>로그인</button>
        </div>
      </div>
    </Dialog>
  )
}