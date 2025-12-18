import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_HOST } from "../constants";
import { BuildingShopBIMain, GoogleLogo, HDivider, KakaoLogo, NaverLogo, VDivider, Button, type User } from "@repo/common";
import axios from 'axios';
import { toast } from 'react-toastify';
import { trackError } from "../utils/analytics";
import { useQueryClient } from 'react-query';
import { QUERY_KEY_USER } from '../constants';
import { getAccessToken } from '../authutil';
import { Dialog } from '@mui/material';
import { Mail } from 'lucide-react';
import { maskEmail } from '../utils';

const LOGIN_TYPES = [
  { provider: 'k', callback: 'kakao', color: '#FEE502', textColor: 'text-[rgba(0,0,0,0.85)]', logo: <KakaoLogo size='20' />, label: '카카오 계정으로 계속하기' },
  { provider: 'n', callback: 'naver', color: '#03C75A', textColor: 'text-white', logo: <NaverLogo size='20' />, label: '네이버 계정으로 계속하기' },
  { provider: 'g', callback: 'google', color: '#FFFFFF', textColor: 'text-default', logo: <GoogleLogo size='20' />, label: '구글 계정으로 계속하기', border: 'border border-line-03' },
  { provider: 'em', callback: 'email', color: '#FFFFFF', textColor: 'text-default', label: '이메일로 계속하기', border: 'border border-line-03' },
]

export const LoginMain = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient()
  const config = queryClient.getQueryData<User>([QUERY_KEY_USER, getAccessToken()]);
  const [openFindAccountDialog, setOpenFindAccountDialog] = useState<boolean>(false);
  const [findAccountResult, setFindAccountResult] = useState<User[]>([]);

  useEffect(() => {
    
    if (config) {
      navigate('/main')
    }
  }, [config])

  const handleOAuth = async (provider: string) => {
    try {
      const response = await axios.post(
        `${API_HOST}/api/auth/oauth/callback/${provider}`,
        {},
        { withCredentials: true }
      );
      console.log(response.data)
      
      if (response.data.url) {
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          response.data.url,
          'OAuth Login',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        if (!popup) {
          toast.error('팝업이 차단되었습니다.');
          return;
        }
        
        // 메시지 리스너 등록
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            window.removeEventListener('message', messageHandler);
            navigate('/');
          } else if (event.data.type === 'OAUTH_REDIRECT') {
            window.removeEventListener('message', messageHandler);
            navigate(event.data.path, { state: event.data.state });
          } else if (event.data.type === 'OAUTH_ERROR') {
            window.removeEventListener('message', messageHandler);
            toast.error(event.data.message);
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // 팝업이 닫혔는지 주기적으로 확인
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
          }
        }, 500);
      }
      if (response.data.message) {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('로그인 중 오류가 발생했습니다.');
      trackError(error, {
        message: '소셜 로그인 중 오류 발생',
        endpoint: '/login',
        file: 'LoginMain.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
    }
  };

  const handleIdentityVerification = async () => {
    const width = 400;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(`${API_HOST}/api/auth/init-verification`, '본인인증', `width=${width},height=${height},left=${left},top=${top}`);
    let verificationData = null;
    let popupClosed = false;


    if (!popup) {
      toast.error('팝업이 차단되었습니다.');
      return;
    }

    // 메시지 리스너 등록
    const messageHandler = (event: MessageEvent) => {
      const allowedOrigins = [
        window.location.origin,
        'https://api.buildingshopai.com',
        'http://localhost:3002'
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.log('❌ origin 불일치로 메시지 무시됨');
        return;
      }

      if (event.data.type === 'IDENTITY_VERIFICATION_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        verificationData = event.data.data;
      } else if (event.data.type === 'IDENTITY_VERIFICATION_ERROR') {
        window.removeEventListener('message', messageHandler);
        console.error('본인인증 실패:', event.data.message);
        toast.error(event.data.message || '본인인증에 실패했습니다.');
      }
    };

    window.addEventListener('message', messageHandler);

    // 팝업이 닫혔는지 주기적으로 확인
    const checkPopup = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
        popupClosed = true;
        if (verificationData) {
          findAccount(verificationData.userName, verificationData.userPhone);
        }
      }
    }, 500);
  };

  const findAccount = async(verifiedName, verifiedPhone) => {
    try{
      const response = await axios.post(`${API_HOST}/api/auth/find-account`, {
        name: verifiedName,
        phone: verifiedPhone
      })
      console.log(response.data);
      setFindAccountResult(response.data.users);
      setOpenFindAccountDialog(true);
    } catch (error) {
      trackError("계정 조회 중 오류 발생", {
        message: '계정 조회 중 오류 발생',
        endpoint: '/login',
        file: 'LoginMain.tsx',
        page: window.location.pathname,
        severity: 'error'
      })
      toast.error('계정 조회 중 오류가 발생했습니다.')
    }
  }

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
          <div className="flex flex-col gap-[20px]">
            {LOGIN_TYPES.map(({provider, callback, color, textColor, logo, label, border}) => (
              <button
                key={provider}
                className={`relative flex items-center justify-center gap-[8px] rounded-[2px] h-[48px] text-[16px] font-h4 ${border}`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  localStorage.setItem('autoLogin', 'true');
                  if (callback === 'email') return navigate('/login/email');
                  // if (callback === 'google') return alert('⚠️ 정식 오픈 후 이용 가능합니다.');
                  handleOAuth(callback);
                }}
              >
                {logo}
                <p className={textColor}>{label}</p>

                {localStorage.getItem('lastLogin') === provider && (
                  <div className="absolute left-[10px] top-[0px] -translate-y-1/2 bg-primary rounded-[100px] px-[10px] py-[2px]
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
              onClick={() => handleIdentityVerification()}
            >기존 계정 찾기</button>
            <HDivider/>
          </div>
          <div className="flex items-center justify-center gap-[24px] font-s2 text-text-03">
            <a
            href="https://chip-flare-463.notion.site/29b1c63ec1af80f99a43dc87641afb7c?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            >
              서비스 이용약관
            </a>
            <VDivider/>
            <a
            href="https://chip-flare-463.notion.site/29b1c63ec1af80cdbfcfe2ca191d8e15?source=copy_link"
            target="_blank"
            rel="noopener noreferrer"
            >
              개인정보 처리방침
            </a>
          </div>
        </div>
      </div>
      <Dialog open={openFindAccountDialog} onClose={() => setOpenFindAccountDialog(false)}>
        <div className='flex flex-col gap-[24px] p-[26px] w-[400px]'>
          <div>
            <h2 className='font-h2'>총 {findAccountResult.length}개의 계정을 찾았습니다.</h2>
          </div>
          <div className='flex flex-col gap-[12px]'>
            {findAccountResult.map((account, idx) => (
              <div key={idx} className='flex items-center gap-[12px] border border-line-03 rounded-[4px] px-[16px] py-[8px]'>
                {account.provider === 'k' && <p className='flex items-center justify-center w-[38px] h-[38px] bg-[#FEE502] rounded-full'><KakaoLogo size='20' /></p>}
                {account.provider === 'n' && <p className='flex items-center justify-center w-[38px] h-[38px] bg-[#03C75A] rounded-full'><NaverLogo size='20' /></p>}
                {account.provider === 'g' && <p className='flex items-center justify-center w-[38px] h-[38px] outline-[1px] outline-line-03 rounded-full'><GoogleLogo size='20' /></p>}
                {account.provider === '' && <p className='flex items-center justify-center w-[38px] h-[38px] outline-[1px] outline-line-03 rounded-full'><Mail size='20' className='text-text-02' /></p>}
                <p>{maskEmail(account.email)}</p>
              </div>
            ))}
          </div>
          <Button size='semiMedium' onClick={() => setOpenFindAccountDialog(false)}>확인</Button>
        </div>
      </Dialog>
    </div>
  );
}
