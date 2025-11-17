import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_HOST } from "../constants";
import { BuildingShopBIMain, GoogleLogo, HDivider, KakaoLogo, NaverLogo } from "@repo/common";
import axios from 'axios';
import { toast } from 'react-toastify';
import * as Sentry from "@sentry/react";

const LOGIN_TYPES = [
  { provider: 'k', callback: 'kakao', color: '#FEE502', textColor: 'text-[rgba(0,0,0,0.85)]', logo: <KakaoLogo size='20' />, label: '카카오 계정으로 계속하기' },
  { provider: 'n', callback: 'naver', color: '#03C75A', textColor: 'text-white', logo: <NaverLogo size='20' />, label: '네이버 계정으로 계속하기' },
  { provider: 'g', callback: 'google', color: '#FFFFFF', textColor: 'text-default', logo: <GoogleLogo size='20' />, label: '구글 계정으로 계속하기', border: 'border border-line-03' },
  { provider: 'em', callback: 'email', color: '#FFFFFF', textColor: 'text-default', label: '이메일로 계속하기', border: 'border border-line-03' },
]

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
      Sentry.captureException('지원하지 않는 OAuth 제공자입니다.')
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
              <BuildingShopBIMain width="228" height="20"/>
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
            {LOGIN_TYPES.map(({provider, callback, color, textColor, logo, label, border}) => (
              <button
                key={provider}
                className={`relative flex items-center justify-center gap-[8px] rounded-[2px] h-[48px] text-[16px] font-h4 ${border}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  localStorage.setItem('autoLogin', 'true');
                  if (callback === 'email') return navigate('/login/email');
                  if (callback === 'google') return alert('⚠️ 정식 오픈 후 이용 가능합니다.');
                  handleOAuth(callback);
                }}
              >
                {logo}
                <p className={textColor}>{label}</p>

                {localStorage.getItem('lastLogin') === provider && (
                  <div className="absolute left-[10px] top-[4px] -translate-y-1/2 bg-primary rounded-[100px] px-[10px] py-[2px]
                    text-white font-c1-p shadow-sm
                    after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2
                    after:border-[5px] after:border-transparent after:border-t-primary">
                    최근 로그인
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className='flex items-center gap-[12px]'>
            <HDivider/>
            <button 
              className='flex-shrink-0 font-s2 text-text-03'
              onClick={() => alert("⚠️ 정식 오픈 후 이용 가능합니다.")}
            >기존 계정 찾기</button>
            <HDivider/>
          </div>
        </div>
        {/* <div className="flex items-center gap-[24px] font-s2 text-text-03">
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
        </div> */}
      </div>
    </div>
  );
}
