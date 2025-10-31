import { Button, Complete, FormField, HDivider } from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { API_HOST } from "../constants";
import { Dialog } from "@mui/material";
import { SignupConfirmDialog } from "./SignupConfirmDialog";
import { setToken } from "../authutil";
import type { LottieRefCurrentProps } from "lottie-react";
import { Check } from "lucide-react";

export const SignupInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasAlerted = useRef(false);
  const completeRef = useRef<LottieRefCurrentProps>(null);

  const [email, setEmail] = useState<string>(location.state?.email ?? '');
  const [password, setPassword] = useState<string>(location.state?.password ?? '');
  const [passwordConfirm, setPasswordConfirm] = useState<string>(location.state?.passwordConfirm ?? '');
  const [name, setName] = useState<string>(location.state?.name ?? '');
  const [phone, setPhone] = useState<string>(location.state?.phone ?? '');

  const [emailValid, setEmailValid] = useState<boolean>(location.state?.email ? true : false);
  const [phoneValid, setPhoneValid] = useState<boolean>(location.state?.phone ? true : false);
  const passwordValid = location.state?.password ? true : (password && passwordConfirm && password === passwordConfirm);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState<boolean>(false);

  const [userId, setUserId] = useState<string>("");
  const [openCompleteDialog, setOpenCompleteDialog] = useState<boolean>(false);

  const { serviceAgree, privacyAgree, marketingEmailAgree, marketingSmsAgree, profile="", provider="" } = location.state;

  useEffect(() => {
    console.log("location.state", location.state);
    if (!location.state) return; 
    if (!location.state.serviceAgree || !location.state.privacyAgree) {
      if (!hasAlerted.current) {
        hasAlerted.current = true;
        alert('잘못된 접근입니다.');
        navigate('/signup');
      }
      return;
    }
    if (location.state?.email && location.state?.phone && location.state?.name ) {
      handleSignup();
    }
  }, [location.state, navigate]);

  if (!location.state) {
    return null;
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, ""); // 숫자 외 제거
    setPhone(onlyNumbers);
  };

  const handleCheckEmail = async() => {
    try {
      const response = await axios.get(`${API_HOST}/api/user/check-email`, { params: { email } });
      setEmailValid(response.data.valid);
    } catch (error) {
      console.error('이메일 중복 확인 중 오류 발생:', error);
    }
  }

  const handleSignup = async() => {
    try {
      const response = await axios.post(`${API_HOST}/api/auth/signup`, {
        user: {
          email,
          password,
          name,
          phone,
          profile,
          provider,
          marketingEmail: marketingEmailAgree ? "Y" : "N",
          marketingSms: marketingSmsAgree ? "Y" : "N"
        }
      })
      console.log("response >>>>> ", response.data)
      if (response.data) {
        setUserId(response.data.id);
        setToken(response.data.accessToken);
        setOpenCompleteDialog(true);
      } else {
        alert("회원가입 중 오류 발생");
      }
    } catch (error) {
      console.error('회원가입 중 오류 발생:', error);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-[360px] flex flex-col gap-[24px] p-[32px] rounded-[8px] border border-line-02 shadow-[0_20px_40px_0_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center gap-[6px]">
          <h2 className="font-h2">회원가입</h2>
          <p className="font-s2 text-text-02">회원가입에 필요한 항목을 입력해 주세요.</p>
        </div>
        <div className="w-full flex flex-col gap-[20px]">
          <FormField 
            label="이메일" 
            type="email" 
            placeholder="이메일을 입력하세요." 
            value={email} 
            onChange={(e) => {setEmail(e.target.value); setEmailValid(false)}}
            rightElement={
              <button
                type="button"
                onClick={() => {handleCheckEmail()}}
                className={`font-s2 ${!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'text-text-04' : 'text-primary'}`}
                disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || location.state?.email}
              >
                {emailValid ? "사용가능" : "중복확인"}
              </button>
            }
            disabled={!!location.state?.email}
          />
          {!location.state?.password && (
            <>
              <FormField 
                label="비밀번호" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="비밀번호를 입력하세요." 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
                  </button>
                }
                />
              <FormField 
                label="비밀번호 확인" 
                type={showPasswordConfirm ? 'text' : 'password'} 
                placeholder="비밀번호를 다시 입력하세요." 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)}
                rightElement={
                  <>
                    <div
                      className={`transition-opacity duration-200 pr-[6px] ${
                        password && passwordConfirm ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      {password === passwordConfirm ? (
                        <Check className="text-green-500 w-5 h-5" />
                      ) : (
                        ""
                      )}
                    </div>
                    <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}>
                      {showPasswordConfirm ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
                    </button>
                  </>
                }
                />
            </>
          )}
          <HDivider colorClassName="bg-line-02"/>
          <FormField 
          label="고객명" 
          type="text" 
          placeholder="이름을 입력하세요." 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          disabled={!!location.state?.name}/>
          <FormField 
          label="휴대폰번호" 
          type="tel" 
          placeholder="휴대폰 번호를 입력하세요." 
          value={phone} 
          onChange={handlePhoneChange}
          rightElement={
            <button
              type="button"
              // onClick={() => {setPhoneValid(true); alert("본인인증 호출(개발중)");}}
              onClick={() => {alert("⚠️ 정식 오픈 후 이용 가능합니다.");}}
              className={`font-s2 ${phone.length < 10 ? 'text-text-04' : 'text-primary'}`}
              disabled={phone.length < 10}
            >
              본인인증
            </button>
          }
          disabled={!!location.state?.phone}
          />
        </div>
        <HDivider colorClassName="bg-line-02"/>
        <div className="flex items-center gap-[12px]">
          <Button
            onClick={() => navigate('/login')}
            variant="bggray"
            size="medium"
            fontSize="font-h4"
            className="w-[80px]"
          >취소</Button>
          <Button
            onClick={() => { handleSignup() }}
            size="medium"
            fontSize="font-h4"
            className="flex-1"
            disabled={!email || !password || !name || !phone || !emailValid || !phoneValid || !passwordValid}
          >가입</Button>
        </div>
      </div>
      <SignupConfirmDialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} userId={userId}/>
    </div>
  )
}