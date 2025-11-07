import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_HOST } from "../constants";
import { BuildingShopBI, GoogleLogo, KakaoLogo, NaverLogo, VDivider } from "@repo/common";
import axios from 'axios';
import { toast } from 'react-toastify';

export const LoginMain = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleOAuth = async(provider: string) => {
    const url = await axios.post(`${API_HOST}/api/auth/oauth/callback/${provider}`, {}, { withCredentials: true });
    if (url) {
      window.location.href = url.data.url;
    } else {
      toast.error('다른 로그인 방법을 시도하거나 잠시 후 다시 시도해주세요.');
      console.log('지원하지 않는 OAuth 제공자입니다.')
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      toast.error(location.state.message, { toastId: 'locationError' });
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center sm:px-6 lg:px-8">
      <div className="flex flex-col items-center w-full max-w-[664px] h-[720px] flex-shrink-0 rounded">
        <div className="flex flex-col w-[320px] my-[75px] gap-[40px]">
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
              onClick={() => {localStorage.setItem("autoLogin", "true"); handleOAuth('kakao')}}
            >
              <KakaoLogo size='20'/>
              <p className="text-[rgba(0,0,0,0.85)]">
                카카오 계정으로 계속하기
              </p>
            </button>
            <button 
              className="flex items-center justify-center gap-[12px] bg-[#03C75A] rounded-[8px] h-[56px] text-[16px] font-semibold"
              onClick={() => {localStorage.setItem("autoLogin", "true"); handleOAuth('naver')}}
            >
              <NaverLogo size='20'/>
              <p className="text-white">
                네이버 계정으로 계속하기
              </p>
            </button>
            <button 
              className="flex items-center justify-center gap-[12px] bg-[#FFFFFF] rounded-[8px] h-[56px] text-[16px] font-semibold border border-[#DADCE0]"
              // onClick={() => {localStorage.setItem("autoLogin", "true"); handleOAuth('google')}}
              onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
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
          <a
          href="https://chip-flare-463.notion.site/29b1c63ec1af80f99a43dc87641afb7c?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          >
            서비스 이용약관
          </a>
          <VDivider/>
          <a
          href="https://chip-flare-463.notion.site/29b1c63ec1af80f99a43dc87641afb7c?source=copy_link"
          target="_blank"
          rel="noopener noreferrer"
          >
            개인정보 처리방침
          </a>
        </div>
      </div>
    </div>
  );
}
