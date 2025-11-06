import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {setToken} from "../authutil";
import { API_HOST } from "../constants";
import { BuildingShopBI, Button, Checkbox, GoogleLogo, HDivider, KakaoLogo, NaverLogo, VDivider } from "@repo/common";
import axios from 'axios';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
}

export const LoginMain = () => {
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
    const url = await axios.post(`${API_HOST}/api/auth/oauth/callback/${provider}`, {}, { withCredentials: true });
    if (url) {
      window.location.href = url.data.url;
    } else {
      setError('다른 로그인 방법을 시도하거나 잠시 후 다시 시도해주세요.');
      console.log('지원하지 않는 OAuth 제공자입니다.')
    }
  };

  const handlePWFind = async () => {
    try{
      const response = await axios.post(`${API_HOST}/api/auth/pwfind`, { email: findPWEmail });
      console.log(response)
      setOpenPWFind(false);
      setOpenPWFindSuccess(true);
    }catch(err){
      console.log("비밀번호 찾기 중 오류: ", err)
      toast.error("비밀번호 찾기 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      toast.error(location.state.message, { toastId: 'locationError' });
      // 상태 초기화
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] h-[720px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] pb-[20px] gap-[40px]">
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
          <div className="flex flex-col gap-[10px]">
            <button 
              className="flex items-center justify-center gap-[12px] bg-[#FEE502] rounded-[8px] h-[56px] text-[16px] font-semibold"
              onClick={() => {localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false"); handleOAuth('kakao')}}
            >
              <KakaoLogo size='20'/>
              <p className="text-[rgba(0,0,0,0.85)]">
                카카오 계정으로 계속하기
              </p>
            </button>
            <button 
              className="flex items-center justify-center gap-[12px] bg-[#03C75A] rounded-[8px] h-[56px] text-[16px] font-semibold"
              onClick={() => {localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false"); handleOAuth('naver')}}
            >
              <NaverLogo size='20'/>
              <p className="text-white">
                네이버 계정으로 계속하기
              </p>
            </button>
            <button 
              className="flex items-center justify-center gap-[12px] bg-[#FFFFFF] rounded-[8px] h-[56px] text-[16px] font-semibold border border-[#DADCE0]"
              onClick={() => {localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false"); handleOAuth('google')}}
            >
              <GoogleLogo size='20'/>
              <p className="text-[#3C4043]">
                구글 계정으로 계속하기
              </p>
            </button>
            <button 
              className="flex items-center justify-center gap-[12px] bg-gray-100 rounded-[8px] h-[56px] text-[16px] font-semibold"
              onClick={() => navigate('/login/email')}
            >
              <p>
                이메일 계정으로 계속하기
              </p>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-[24px] font-s2 text-text-03">
          <p>서비스 이용약관</p>
          <VDivider/>
          <p>개인정보 처리방침</p>
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
