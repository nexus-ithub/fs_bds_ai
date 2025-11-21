import { BuildingShopBI, Button, FormField } from "@repo/common";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Check } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_HOST } from "../constants";
import { Dialog } from "@mui/material";
import * as Sentry from "@sentry/react";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [providerMsg, setProviderMsg] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string>("");
  const [openTokenExpired, setOpenTokenExpired] = useState<boolean>(false);
  const [openSuccess, setOpenSuccess] = useState<boolean>(false);

  const validatePassword = (password: string): string => {
    if (!password) return "";

    if (/(.)\1{2,}/.test(password)) {
      return '같은 문자를 3번 이상 연속 사용할 수 없습니다';
    }
    
    if (password.length < 8) {
      return '8자 이상 입력해주세요';
    }
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return '영문, 숫자, 특수문자를 모두 포함해주세요';
    }
    
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
  };

  const handleSubmit = async () => {
    if (!password || !passwordConfirm || password !== passwordConfirm) {
      return;
    }
    try {
      const res = await axios.put(`${API_HOST}/api/user/pwfind`, {
        token,
        password,
      });
      setOpenSuccess(true);
    } catch (error) {
      console.error(error);
      Sentry.captureException(error);
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  const goToLogin = () => {
    setOpenSuccess(false);
    navigate('/login');
  };

  useEffect(() => {
    if (!openSuccess && !openTokenExpired) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        goToLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSuccess, openTokenExpired]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${API_HOST}/api/auth/verify-reset-token`, {
          params: { token },
        });
        if (res.data.message) {
          setProviderMsg(res.data.message);
        }
      } catch (error) {
        setOpenTokenExpired(true);
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] h-[820px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] pb-[40px] gap-[40px]">
          <div className="flex flex-col gap-[24px] items-center">
            <BuildingShopBI/>
            <div className='flex flex-col gap-[6px]'>
              <p className="text-center font-h3">
                비밀번호 재설정
              </p>
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          )}
          {providerMsg ? (
            <div className="flex flex-col gap-[24px]">
              <div className="flex items-start gap-3 rounded-md bg-blue-50 p-4 border border-blue-200">
                <span className="font-s2">ℹ️</span>
                <div className="flex flex-col gap-[4px] font-s2 text-primary">
                  <p>{providerMsg}</p>
                  <p>해당 소셜 계정으로 로그인해주세요.</p>
                </div>
              </div>
              <Button onClick={() => navigate('/login')} className="h-[36px]">확인</Button>
            </div>
          ) : 
            <div className="flex flex-col gap-[24px]">
              <FormField 
                label="새 비밀번호" 
                type={showPassword ? 'text' : 'password'} 
                placeholder="새 비밀번호를 입력하세요." 
                value={password} 
                error={passwordError}
                onChange={(e) => handlePasswordChange(e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                rightElement={
                  <span className="cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
                  </span>
                }
                />
              <FormField 
                label="새 비밀번호 확인" 
                type={showPasswordConfirm ? 'text' : 'password'} 
                placeholder="새 비밀번호를 다시 입력하세요." 
                value={passwordConfirm} 
                onChange={(e) => setPasswordConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
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
                    <span className="cursor-pointer" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}>
                      {showPasswordConfirm ? <Eye color="#9ea2a8" strokeWidth={1}/> : <EyeOff color="#9ea2a8" strokeWidth={1}/>}
                    </span>
                  </>
                }
                />
              <Button
                onClick={() => handleSubmit()}
                className="w-full mt-[10px]"
                size="medium"
                fontSize="font-h5"
                disabled={!password || !passwordConfirm || password !== passwordConfirm}
              >비밀번호 재설정</Button>
            </div>
          }
        </div>
        <div className="flex items-center">
          {/* <span className="font-s3 text-grayscale-60">COPYRIGHT© 2021 NEXUS Co., Ltd. ALL RIGHTS RESERVED.</span> */}
        </div>
      </div>
      <Dialog open={openSuccess} onClose={() => {goToLogin()}}>
        <div className="flex flex-col gap-[24px] min-w-[300px] p-[20px]">
          <div className="flex flex-col items-center justify-center gap-[8px]">
            <p className="font-h3 pt-[12px]">비밀번호가 성공적으로 변경되었습니다.</p>
            <p className="font-s1">로그인 화면으로 이동합니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {goToLogin()}}>확인</Button>
          </div>
        </div>
      </Dialog>
      <Dialog open={openTokenExpired} onClose={() => {navigate('/login')}}>
        <div className="flex flex-col gap-[24px] min-w-[300px] p-[20px]">
          <div className="flex flex-col items-center justify-center gap-[8px]">
            <p className="font-h3 pt-[12px]">링크가 만료되었거나 유효하지 않습니다.</p>
            <p className="font-s1">로그인 화면으로 이동합니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {navigate('/login')}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};