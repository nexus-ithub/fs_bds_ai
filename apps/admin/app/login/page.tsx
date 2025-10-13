'use client'
import { BuildingShopBI, Checkbox } from "@repo/common";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from 'next-auth/react';

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export default function Login() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      console.log('credentials', credentials);

      const response = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });
      console.log('response', response);
      if (response?.error) {
        setError(response.error);
      } else {
        router.push('/main/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] gap-[40px]">
          <div className="flex flex-col gap-[24px] items-center">
            <BuildingShopBI/>
            <h2 className="text-center font-h2">
              빌딩샵 관리자 로그인
            </h2>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="flex flex-col gap-[20px]">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-[20px]">
                <div className="flex items-start flex-col gap-[12px]">
                  <label htmlFor="email" className="font-s2 text-text-02">
                    이메일
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none rounded-[2px] relative block w-full px-[14px] py-[12px] border border-line-03 placeholder:text-text-04 text-text-04 bg-surface-second focus:outline-none"
                    placeholder="아이디를 입력하세요."
                    value={credentials.email}
                    onChange={(e) =>
                      setCredentials({ ...credentials, email: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-start flex-col gap-[12px]">
                  <label htmlFor="password" className="font-s2 text-text-02">
                    비밀번호
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none rounded-[2px] relative block w-full px-[14px] py-[12px] border border-line-03 placeholder:text-text-04 text-text-04 bg-surface-second focus:outline-none"
                    placeholder="비밀번호를 입력하세요."
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                  />
                </div>
                <Checkbox
                  checked={keepLoggedIn}
                  onChange={() => setKeepLoggedIn(!keepLoggedIn)}
                  label="로그인 상태 유지"
                  labelOrderLast={true}
                  labelClassName="font-s2 text-text-04"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center mt-[40px] py-[14px] px-[12px] border border-transparent font-h4 rounded-[2px] text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                로그인
              </button>
            </form>
            <div className="flex items-center justify-center gap-[24px] font-s2 text-text-03">
              <button>비밀번호 찾기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}