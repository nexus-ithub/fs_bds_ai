import { Button, FormField, HDivider } from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export const SignupInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasAlerted = useRef(false);

  const [email, setEmail] = useState<string>(location.state?.email ?? '');
  const [password, setPassword] = useState<string>(location.state?.password ?? '');
  const [name, setName] = useState<string>(location.state?.name ?? '');
  const [phone, setPhone] = useState<string>(location.state?.phone ?? '');

  const [emailValid, setEmailValid] = useState<boolean>(location.state?.email ? true : false);
  const [phoneValid, setPhoneValid] = useState<boolean>(location.state?.phone ? true : false);
  const [showPassword, setShowPassword] = useState<boolean>(location.state?.password ? true : false);

  useEffect(() => {
    if (!location.state || !location.state.serviceAgree || !location.state.privacyAgree) {
      if (!hasAlerted.current) {
        hasAlerted.current = true;
        alert('잘못된 접근입니다.');
        navigate('/signup');
      }
      return;
    }
    if (location.state?.email && location.state?.phone && location.state?.name ) {
      navigate('/signup/additional-info', {
        state: {
          serviceAgree: location.state.serviceAgree,
          privacyAgree: location.state.privacyAgree,
          marketingEmailAgree: location.state.marketingEmailAgree,
          marketingSmsAgree: location.state.marketingSmsAgree,
          email: location.state.email,
          password: location.state.password,
          name: location.state.name,
          phone: location.state.phone,
          profile: location.state.profile,
          provider: location.state.provider
        }
      });
    }
  }, [location.state, navigate]);

  if (!location.state) {
    return null;
  }
  console.log("SignupInfo state >>>>> ", location.state)

  const { serviceAgree, privacyAgree, marketingEmailAgree, marketingSmsAgree, profile="", provider="" } = location.state;


  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, ""); // 숫자 외 제거
    setPhone(onlyNumbers);
  };

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
            onChange={(e) => setEmail(e.target.value)}
            rightElement={
              <button
                type="button"
                onClick={() => {alert("중복확인 API 호출"); setEmailValid(true)}}
                className={`font-s2 ${!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'text-text-04' : 'text-primary'}`}
                disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || location.state?.email}
              >
                {emailValid ? "사용가능" : "중복확인"}
              </button>
            }
            disabled={!!location.state?.email}
          />
          {!location.state?.password && (
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
          )}
          <HDivider className="!border-b-line-02"/>
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
              onClick={() => {alert("본인인증 API 호출"); setPhoneValid(true)}}
              className={`font-s2 ${phone.length < 10 ? 'text-text-04' : 'text-primary'}`}
              disabled={phone.length < 10}
            >
              본인인증
            </button>
          }
          disabled={!!location.state?.phone}
          />
        </div>
        <HDivider className="!border-b-line-02"/>
        <div className="flex items-center gap-[12px]">
          <Button
            onClick={() => navigate('/login')}
            variant="bggray"
            size="medium"
            fontSize="font-h4"
            className="w-[80px]"
          >취소</Button>
          <Button
            onClick={() => 
              navigate('/signup/additional-info', {
                state: {
                  serviceAgree,
                  privacyAgree,
                  marketingEmailAgree,
                  marketingSmsAgree,
                  email,
                  password,
                  name,
                  phone,
                  profile,
                  provider
                }
              })}
            size="medium"
            fontSize="font-h4"
            className="flex-1"
            disabled={!email || !password || !name || !phone || !emailValid || !phoneValid}
          >다음</Button>
        </div>
      </div>
    </div>
  )
}