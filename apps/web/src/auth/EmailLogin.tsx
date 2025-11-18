import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {setToken} from "../authutil";
import { API_HOST } from "../constants";
import { BuildingShopBI, Button, Checkbox, HDivider, Spinner, VDivider } from "@repo/common";
import axios from 'axios';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';
import posthog from 'posthog-js';
import * as Sentry from "@sentry/react";

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
}

export const EmailLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    keepLoggedIn: true,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string>('');
  const [openPWFind, setOpenPWFind] = useState<boolean>(false);
  const [openPWFindSuccess, setOpenPWFindSuccess] = useState<boolean>(false);
  const [findPWEmail, setFindPWEmail] = useState<string>('');
  const [sendEmailLoading, setSendEmailLoading] = useState<boolean>(false);

  const expiresInStr = import.meta.env.VITE_RESET_TOKEN_EXPIRES_IN;

  let readableExpires = "";
  if (expiresInStr.endsWith("m")) {
    readableExpires = `${parseInt(expiresInStr)}분`;
  } else if (expiresInStr.endsWith("h")) {
    readableExpires = `${parseInt(expiresInStr)}시간`;
  } else if (expiresInStr.endsWith("d")) {
    readableExpires = `${parseInt(expiresInStr)}일`;
  } else {
    readableExpires = "일정시간";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_HOST}/api/auth/login`, credentials, {
        withCredentials: true,
      });

      if (!response.data) {
        throw new Error('로그인에 실패했습니다.');
      }
      if (response.status === 210) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.")
        return;
      }

      const data: LoginResponse = response.data;

      localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false");
      setToken(data.accessToken)
      posthog.identify(data.id)
      localStorage.setItem("lastLogin", 'em');
      navigate('/');
    } catch (err) {
      console.log(`로그인 중 오류: ${err}`)
      Sentry.captureException(err);
      setError("오류가 발생하였습니다. 잠시 후 다시 시도해주세요.")
    }
  };

  const handlePWFind = async () => {
    try{
      setSendEmailLoading(true);
      const response = await axios.post(`${API_HOST}/api/auth/pwfind`, { email: findPWEmail });
      console.log(response)
      setOpenPWFind(false);
      setOpenPWFindSuccess(true);
    } catch(err){
      console.log("비밀번호 찾기 중 오류: ", err)
      Sentry.captureException(err);
      toast.error("비밀번호 찾기 중 오류가 발생했습니다.");
    } finally {
      setSendEmailLoading(false);
    }
  };

  useEffect(() => {
    if (openPWFind) {
      setFindPWEmail('');
    }
  }, [openPWFind]);

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      // 상태 초기화
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] h-[720px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] pb-[20px] gap-[40px]">
          {/* <div className="flex flex-col gap-[24px] items-center">
            <button onClick={() => navigate('/main')}> 
              <BuildingShopBI/>
            </button>
            <div className='flex flex-col gap-[6px]'>
              <p className="text-center font-h3">
                NO.1 빌딩 매매 전문
              </p>
              <p className="text-center font-h2">
                빌딩의 가치를 알려주는 빌딩샵
              </p>
            </div>
          </div> */}
          <div className="font-h2 text-center">이메일로 로그인</div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
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
                    className="appearance-none rounded-[2px] relative block w-full px-[14px] py-[12px] border border-line-03 placeholder:text-text-04 text-text-04 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                    className="appearance-none rounded-[2px] relative block w-full px-[14px] py-[12px] border border-line-03 placeholder:text-text-04 text-text-04 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="비밀번호를 입력하세요."
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                  />
                </div>
                <Checkbox
                  checked={credentials.keepLoggedIn}
                  onChange={() => setCredentials({ ...credentials, keepLoggedIn: !credentials.keepLoggedIn })}
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
              <button onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}>아이디 찾기</button>
              <VDivider colorClassName="bg-line-04"/>
              {/* <button onClick={() => {setFindPWEmail(''); setOpenPWFind(true);}}>비밀번호 찾기</button> */}
              <button onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}>비밀번호 재설정</button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-[12px]">
            <HDivider />
            <p className="font-s2 text-text-03">or</p>
            <HDivider />
          </div>
          {/* <button onClick={() => navigate('/signup')}>회원가입</button> */}
          <Button 
            onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
            variant='outline'
            size="medium"
            fontSize="font-h4"
            className=""
          >이메일로 회원가입</Button>
        </div>
      </div>
      <Dialog open={openPWFind} onClose={() => setOpenPWFind(false)}>
        <div className="flex flex-col gap-[20px] w-[400px]">
          <h3 className="font-h3 px-[20px] py-[12px] border-b border-line-03">비밀번호 찾기</h3>
          <div className="flex flex-col items-center gap-[4px] px-[20px]">
            <p className='font-h3 pb-[4px]'>등록된 이메일 주소를 입력해주세요.</p>
            <p className='font-s1'>비밀번호 재설정 메일을 보내드립니다.</p>
          </div>
          <input 
            type="email" 
            placeholder="이메일" 
            className='mx-[30px] px-[14px] py-[8px] font-b1 rounded-[4px] border border-line-03 focus:outline-none' 
            value={findPWEmail} 
            onChange={(e) => setFindPWEmail(e.target.value)}
            onKeyDown={(e) => {if (e.key === 'Enter') handlePWFind()}}/>
          <Button 
            size='semiMedium' 
            fontSize='font-h5' 
            className="w-[200px] mx-auto" 
            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(findPWEmail) || sendEmailLoading}
            onClick={() => handlePWFind()}>{sendEmailLoading ? <Spinner /> : "재설정 메일 발송"}</Button>
          <p className="text-center text-text-03 font-s4 mb-[20px]">
            메일이 오지 않았다면 입력한 이메일 주소를 다시 확인하거나,<br />
            스팸함을 확인해주세요.
          </p>
        </div>
      </Dialog>
      <Dialog
        open={openPWFindSuccess}
        onClose={() => {setOpenPWFindSuccess(false)}}
        onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault(); setOpenPWFindSuccess(false);}}}
      >
        <div className="flex flex-col gap-[24px] min-w-[300px] p-[20px]">
          <div className="flex flex-col items-center justify-center gap-[8px]">
            <p className="font-h3 pt-[12px]">입력하신 이메일로 비밀번호 재설정 안내 메일이 발송되었습니다.</p>
            <p className="font-s1">메일에 포함된 링크는 {readableExpires} 동안 유효합니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {setOpenPWFindSuccess(false);}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
