import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {setToken} from "../authutil";
import { API_HOST } from "../constants";
import { BuildingShopBI, Button, Checkbox, GoogleLogo, HDivider, KakaoLogo, NaverLogo, VDivider } from "@repo/common";
import axios from 'axios';
import { Dialog } from '@mui/material';

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
  // refreshToken: string;
}

export default function Login() {
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
  console.log("error : ", error)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      console.log('credentials', credentials);
      const response = await axios.post(`${API_HOST}/api/auth/login`, credentials, {
        withCredentials: true,
      });

      if (!response.data) {
        throw new Error('로그인에 실패했습니다.');
      }

      const data: LoginResponse = response.data;

      localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false");
      setToken(data.accessToken)
      navigate('/');
    } catch (err) {
      // alert('로그인 중 오류가 발생했습니다.');
      // setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
      console.log(`로그인 중 오류: ${err}`)
      setError("이메일 또는 비밀번호가 올바르지 않습니다.")
    }
  };

  const handleOAuth = async(provider: string) => {
    console.log(API_HOST)
    console.log(provider)
    const url = await axios.post(`${API_HOST}/api/auth/oauth/callback/${provider}`, {}, { withCredentials: true });
    console.log(url)
    if (url) {
      window.location.href = url.data.url;
    } else {
      setError('다른 로그인 방법을 시도하거나 잠시 후 다시 시도해주세요.');
      console.log('지원하지 않는 OAuth 제공자입니다.')
    }
  };

  const handlePWFind = async () => {
    try{
      await axios.post(`${API_HOST}/api/auth/pwfind`, { email: findPWEmail });
      setOpenPWFind(false);
      setOpenPWFindSuccess(true);
    }catch(err){
      console.log("비밀번호 찾기 중 오류: ", err)
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      // 상태 초기화
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  useEffect(() => {
    setFindPWEmail('');
  }, [openPWFind])

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] h-[820px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] pb-[40px] gap-[40px]">
          <div className="flex flex-col gap-[24px] items-center">
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
                {/* <div>
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
                      <rect x="0.5" y="0.5" width="15" height="15" rx="1.5" stroke="var(--primary-050)" />
                      <path fillRule="evenodd" clipRule="evenodd" d="M11.4638 4.68695C11.7476 4.37273 12.2343 4.35327 12.5423 4.64383C12.8409 4.92558 12.8596 5.39434 12.5845 5.69905L7.57922 11.2411C7.26155 11.5928 6.70947 11.5928 6.3918 11.2411L3.41558 7.94566C3.14039 7.64096 3.15914 7.1722 3.45778 6.89045C3.76576 6.59988 4.25242 6.61935 4.53621 6.93357L6.98551 9.64554L11.4638 4.68695Z" fill="var(--primary-050)"/>
                    </svg>
                  )}
                    <span className="font-s2 text-text-04 cursor-pointer">로그인 상태 유지</span>
                  </label>  
                </div> */}
              </div>
              <button
                type="submit"
                className="w-full flex justify-center mt-[40px] py-[14px] px-[12px] border border-transparent font-h4 rounded-[2px] text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                로그인
              </button>
            </form>
            <div className="flex items-center justify-center gap-[24px] font-s2 text-text-03">
              <button onClick={() => alert("본인인증 api 구현 예정")}>아이디 찾기</button>
              <VDivider colorClassName="bg-line-04"/>
              <button onClick={() => setOpenPWFind(true)}>비밀번호 찾기</button>
              <VDivider colorClassName="bg-line-04"/>
              <button onClick={() => navigate('/signup')}>회원가입</button>
            </div>
          </div>
          <div className="flex flex-col gap-[28px]">
            <div className='flex items-center gap-[12px] font-s2 text-text-03'>
              <HDivider/>
              <p className='flex-shrink-0'>간편 로그인</p>
              <HDivider/>
            </div>
            <div className="flex items-center justify-center gap-[36px]">
              <button 
                onClick={() => {localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false"); handleOAuth('kakao')}}
                className="flex items-center justify-center w-[48px] h-[48px] bg-[#FEE502] rounded-full"
              >
                <KakaoLogo/>
              </button>
              <button 
                onClick={() => {localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false"); handleOAuth('naver')}}
                className="flex items-center justify-center w-[48px] h-[48px] bg-[#04C73C] rounded-full"
              >
                <NaverLogo/>
              </button>
              <button 
                onClick={() => {localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false"); handleOAuth('google')}}
                className="flex items-center justify-center w-[48px] h-[48px] bg-[#FFF] rounded-full border border-line-03"
              >
                <GoogleLogo/>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          {/* <span className="font-s3 text-grayscale-60">COPYRIGHT© 2021 NEXUS Co., Ltd. ALL RIGHTS RESERVED.</span> */}
        </div>
      </div>
      <Dialog open={openPWFind} onClose={() => setOpenPWFind(false)}>
        <div className="flex flex-col gap-[20px] w-[400px]">
          <h3 className="font-h3 px-[20px] py-[12px] border-b border-line-03">비밀번호 찾기</h3>
          <div className="flex flex-col items-center gap-[4px] px-[20px]">
            <p className='font-h3'>등록된 이메일 주소를 입력해주세요.</p>
            <p className='font-s1'>비밀번호 재설정 메일을 보내드립니다.</p>
          </div>
          <input 
            type="text" 
            placeholder="이메일" 
            className='mx-[30px] px-[14px] py-[8px] font-b1 rounded-[4px] border border-line-03 focus:outline-none' 
            value={findPWEmail} 
            onChange={(e) => setFindPWEmail(e.target.value)}
            onKeyDown={(e) => {if (e.key === 'Enter') handlePWFind()}}/>
          <Button 
            size='semiMedium' 
            fontSize='font-h5' 
            className="w-[200px] mx-auto mb-[20px]" 
            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(findPWEmail)}
            onClick={() => handlePWFind()}>재설정 메일 발송</Button>
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
            <p className="font-s1">메일에 포함된 링크는 30분 동안 유효합니다.</p>
          </div>
          <div className="flex justify-center gap-[12px]">
            <Button className="w-[160px]" onClick={() => {setOpenPWFindSuccess(false);}}>확인</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
