import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {setToken} from "../../authutil";
import { API_HOST } from "../../constants";
import { Link } from "react-router-dom";

import axios from 'axios';

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [keepLoggedIn, setKeepLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      console.log('credentials', credentials);
      const response = await axios.post(`${API_HOST}/api/auth/login`, credentials);

      if (!response.data) {
        throw new Error('로그인에 실패했습니다.');
      }

      const data: LoginResponse = response.data;

      setToken(data.refreshToken, data.accessToken)
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] h-[820px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] pb-[40px] gap-[48px]">
          <div className="flex flex-col gap-[20px]">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              BUILDING SHOP
            </h2>
            <p className="text-center font-h3">
              NO.1 빌딩 매매 전문
            </p>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-[20px]">
              <div className="flex flex-col gap-[12px]">
                <label htmlFor="email" className="font-s2 text-grayscale-60">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none rounded-[2px] relative block w-full px-[14px] py-[12px] border border-line-2 placeholder:text-text-4 text-text-4 bg-surface-second focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="아이디를 입력하세요."
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-col gap-[12px]">
                <label htmlFor="password" className="font-s2 text-grayscale-60">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-[2px] relative block w-full px-[14px] py-[12px] border border-line-2 placeholder:text-text-4 text-text-4 bg-surface-second focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="비밀번호를 입력하세요."
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="flex items-center gap-[8px]">
                <input
                  type="checkbox"
                  name="keepLoggedIn"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="sr-only"
                />
                {keepLoggedIn ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" fill="#D2D4DA" />
                    <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" stroke="#D2D4DA" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.4638 4.68695C11.7476 4.37273 12.2343 4.35327 12.5423 4.64383C12.8409 4.92558 12.8596 5.39434 12.5845 5.69905L7.57922 11.2411C7.26155 11.5928 6.70947 11.5928 6.3918 11.2411L3.41558 7.94566C3.14039 7.64096 3.15914 7.1722 3.45778 6.89045C3.76576 6.59988 4.25242 6.61935 4.53621 6.93357L6.98551 9.64554L11.4638 4.68695Z" fill="white"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16">
                    <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" fill="white" />
                    <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" stroke="#D2D4DA" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.4638 4.68695C11.7476 4.37273 12.2343 4.35327 12.5423 4.64383C12.8409 4.92558 12.8596 5.39434 12.5845 5.69905L7.57922 11.2411C7.26155 11.5928 6.70947 11.5928 6.3918 11.2411L3.41558 7.94566C3.14039 7.64096 3.15914 7.1722 3.45778 6.89045C3.76576 6.59988 4.25242 6.61935 4.53621 6.93357L6.98551 9.64554L11.4638 4.68695Z" fill="#D2D4DA"/>
                  </svg>
                )}
                  <span className="font-s2 text-grayscale-50 cursor-pointer">로그인 상태 유지</span>
                </label>  
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center mt-[48px] py-[14px] px-[12px] border border-transparent font-h4 rounded-[2px] text-white bg-grayscale-80 hover:bg-grayscale-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-grayscale-60"
            >
              로그인
            </button>
          </form>
          <Link to={'/'} className="text-center font-s2 text-grayscale-70 cursor-pointer">
            비밀번호 찾기
          </Link>
        </div>
        <div className="flex items-center">
          <span className="font-s3 text-grayscale-60">COPYRIGHT© 2021 NEXUS Co., Ltd. ALL RIGHTS RESERVED.</span>
        </div>
      </div>
    </div>
  );
}
