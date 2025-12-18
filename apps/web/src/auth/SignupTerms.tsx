import { Dialog } from "@mui/material";
import { Button, Checkbox, ChevronDownCustomIcon, ChevronRightCustomIcon, CloseIcon, HDivider } from "@repo/common"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { TermsContent } from "../support/Terms";
import axios from "axios";
import { API_HOST } from "../constants";
import { SignupConfirmDialog } from "./SignupConfirmDialog";
import { setToken } from "../authutil";
import { toast } from "react-toastify";
import { trackError } from "../utils/analytics";

export const SignupTerms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [serviceAgree, setServiceAgree] = useState<boolean>(false);
  const [privacyAgree, setPrivacyAgree] = useState<boolean>(false);
  const [marketingEmailAgree, setMarketingEmailAgree] = useState<boolean>(false);
  const [marketingSmsAgree, setMarketingSmsAgree] = useState<boolean>(false);
  const [openMarketingAgree, setOpenMarketingAgree] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const { email = "", name = "", password = "", phone = "", profile = "", provider = "", socialId = ""} = location.state ?? {};

  const [openServiceTerms, setOpenServiceTerms] = useState<boolean>(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState<boolean>(false);

  const handleIdentityVerification = async () => {
    const width = 400;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(`${API_HOST}/api/auth/init-verification`, '본인인증', `width=${width},height=${height},left=${left},top=${top}`);


    if (!popup) {
      toast.error('팝업이 차단되었습니다.');
      return;
    }

    // 메시지 리스너 등록
    const messageHandler = (event: MessageEvent) => {
      // origin 체크 - API 서버도 허용
      const allowedOrigins = [
        window.location.origin,
        'https://api.buildingshopai.com',
        'http://localhost:3002'
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.log('❌ origin 불일치로 메시지 무시됨');
        return;
      }

      if (event.data.type === 'IDENTITY_VERIFICATION_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        const verificationData = event.data.data;
        toast.success('본인인증이 완료되었습니다.');
        console.log("location.state", location.state);
        console.log("email", email);
        if (email) {
          completeSignup(verificationData.userName, verificationData.userPhone);
          return;
        }
        navigate('/signup/info', {
          state: {serviceAgree, privacyAgree, marketingEmailAgree, marketingSmsAgree, email, name: verificationData.userName, password, phone: verificationData.userPhone, profile, provider, socialId}})
      } else if (event.data.type === 'IDENTITY_VERIFICATION_ERROR') {
        window.removeEventListener('message', messageHandler);
        console.error('본인인증 실패:', event.data.message);
        toast.error(event.data.message || '본인인증에 실패했습니다.');
      }
    };

    window.addEventListener('message', messageHandler);

    // 팝업이 닫혔는지 주기적으로 확인
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
      }
    }, 500);
  };

  const handleSignup = async() => {
    if (!serviceAgree || !privacyAgree) {
      return;
    }
    if (email && name && phone) {
      completeSignup(name, phone);
    } else {
      handleIdentityVerification();
    }
  }

  const completeSignup = async(verifiedName, verifiedPhone) => {
    const response = await axios.post(`${API_HOST}/api/auth/signup`, {
      user: {
        email,
        password,
        name: verifiedName ?? name,
        phone: verifiedPhone ?? phone,
        profile,
        provider,
        marketingEmail: marketingEmailAgree ? "Y" : "N",
        marketingSms: marketingSmsAgree ? "Y" : "N",
        socialId
      }
    })
    if (response.data) {
      setUserId(response.data.id);
      setToken(response.data.accessToken);
      setOpenCompleteDialog(true);
      localStorage.setItem("lastLogin", provider);
    } else {
      trackError("회원 약관 동의 중 오류 발생", {
        message: '회원 약관 동의 중 요류 발생',
        endpoint: '/signup/terms',
        file: 'SignupTerms.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
      toast.error('회원가입 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-[360px] flex flex-col gap-[24px] p-[32px] rounded-[8px] border border-line-02 shadow-[0_20px_40px_0_rgba(0,0,0,0.06)]">
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
          <HDivider dashed={true} colorClassName="bg-line-02"/>
          <div className="flex justify-between items-center">
            <Checkbox
              label="서비스 이용약관 동의(필수)"
              labelOrderLast={true}
              checked={serviceAgree}
              onChange={(checked) => {
                setServiceAgree(checked);
              }}/>
            <a
            href="https://chip-flare-463.notion.site/29b1c63ec1af80f99a43dc87641afb7c?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            >
              <ChevronRightCustomIcon/>
            </a>
          </div>
          <div className="flex justify-between items-center">
            <Checkbox
              label="개인정보수집 동의(필수)"
              labelOrderLast={true}
              checked={privacyAgree}
              onChange={(checked) => {
              setPrivacyAgree(checked);
            }}/>
            <a
            href="https://chip-flare-463.notion.site/29b1c63ec1af80cdbfcfe2ca191d8e15?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            >
              <ChevronRightCustomIcon/>
            </a>
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
            onClick={() => navigate('/login')}
            variant="bggray"
            size="medium"
            fontSize="font-h4"
            className="w-[80px]"
          >취소</Button>
          <Button
            onClick={() => {handleSignup();}}
            variant="default"
            size="medium"
            fontSize="font-h4"
            className="flex-1"
            disabled={!serviceAgree || !privacyAgree}
          >{phone ? "동의하고 가입하기" : "동의하고 인증하기"}</Button>
        </div>
        <HDivider colorClassName="bg-line-02"/>
        <div className="flex items-center gap-[12px] mt-[8px] mx-auto">
          <p className="font-s2 text-text-03">이미 회원이세요?</p>
          <button className="font-s2 text-primary" onClick={() => navigate('/login')}>로그인</button>
        </div>
      </div>
      <SignupConfirmDialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} userId={userId}/>
      {openServiceTerms && (
        <Dialog
          maxWidth="md"
          open={openServiceTerms}
          onClose={() => setOpenServiceTerms(false)}
        >
          <div className="w-[768px] p-[20px] flex flex-col gap-[16px] items-center scrollbar-hover">
            <div className="w-full h-[16px] flex items-center justify-end">
              <button onClick={() => setOpenServiceTerms(false)}><CloseIcon/></button>
            </div>
            <TermsContent menuSelectable={false} contentClassName="p-[24px] bg-surface-second"/>
            <div className="w-full flex items-center gap-[12px]">
            <Button
              onClick={() => setOpenServiceTerms(false)}
              variant="bggray"
              size="medium"
              fontSize="font-h4"
              className="w-[120px]"
            >취소</Button>
            <Button
              onClick={() => {setOpenServiceTerms(false); setServiceAgree(true);}}
              size="medium"
              fontSize="font-h4"
              className="flex-1"
            >동의</Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}