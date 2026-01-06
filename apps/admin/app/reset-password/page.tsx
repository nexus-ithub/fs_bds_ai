'use client';

import { BuildingShopBIMain } from "@repo/common";
import { Button, FormField } from "@repo/common";
import { Check, Eye, EyeOff } from "lucide-react";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { trackError } from "../utils/analytics";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string>("");
  const [openTokenExpired, setOpenTokenExpired] = useState<boolean>(false);
  const [openSuccess, setOpenSuccess] = useState<boolean>(false);

  const validatePassword = (passwordInput: string): string => {
    if (!passwordInput) return "";

    if (/(.)\1{2,}/.test(passwordInput)) {
      return '같은 문자를 3번 이상 연속 사용할 수 없습니다';
    }
    
    if (passwordInput.length < 8) {
      return '8자 이상 입력해주세요';
    }
    
    const hasLetter = /[a-zA-Z]/.test(passwordInput);
    const hasNumber = /[0-9]/.test(passwordInput);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(passwordInput);
    
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
      const res = await fetch(`/api/bff/public`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setOpenSuccess(true);
      } else {
        setError("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error(error);
      trackError(error, {
        message: "비밀번호 재설정 실패",
        file: "/reset-password/page.tsx",
        page: window.location.pathname,
        severity: "error"
      })
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  const goToLogin = useCallback(() => {
    setOpenSuccess(false);
    router.push('/login');
  }, [router]);

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
        const res = await fetch(`/api/bff/public?token=${token}&action=verify-reset-token`);
        const data = await res.json();
        if (data.valid) {
          setOpenTokenExpired(false);
        } else {
          setOpenTokenExpired(true);
        }
      } catch (error) {
        trackError(error, {
          message: "비밀번호 재설정 토큰 검증 실패",
          file: "/reset-password/page.tsx",
          page: window.location.pathname,
          severity: "error"
        })
        setOpenTokenExpired(true);
      }
    };
    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] pb-[40px] gap-[40px]">
          <div className="flex flex-col gap-[24px] items-center">
            <BuildingShopBIMain width="274" height="24"/>
            <div className='flex flex-col gap-[6px]'>
              <p className="text-center font-h2">
                비밀번호 재설정
              </p>
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          )}
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
              disabled={!password || !passwordConfirm || password !== passwordConfirm || !!passwordError}
            >비밀번호 재설정</Button>
          </div>
        </div>
        <div className="flex items-center">
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
      <Dialog open={openTokenExpired} onClose={() => {router.push('/login')}}>
        <div className="flex flex-col gap-[24px] min-w-[300px] p-[20px]">
          <div className="flex flex-col items-center justify-center gap-[8px]">
            <p className="font-h3 pt-[12px]">링크가 만료되었거나 유효하지 않습니다.</p>
            <p className="font-s1">로그인 화면으로 이동합니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {router.push('/login')}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}