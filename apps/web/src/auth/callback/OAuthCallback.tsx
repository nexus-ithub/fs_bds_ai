import { DotProgress } from "@repo/common";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_HOST } from "../../constants";
import { setToken } from "../../authutil";
import posthog from 'posthog-js';
import { trackError, trackEvent } from "../../utils/analytics";

export const OAuthCallback = () => {
  const location = useLocation();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    
    const pathParts = location.pathname.split("/");
    const provider = pathParts[3];
    const code = new URLSearchParams(location.search).get("code");
    const state = new URLSearchParams(location.search).get("state");

    if (!code || !provider) {
      // 부모 창에 에러 메시지 전송
      if (window.opener) {
        window.opener.postMessage(
          { 
            type: 'OAUTH_ERROR',
            message: 'OAuth 인증 정보가 없습니다.'
          },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    (async () => {
      try {
        const res = await axios.post(
          `${API_HOST}/api/auth/oauth`,
          { 
            provider, 
            code, 
            state, 
            keepLoggedIn: localStorage.getItem("autoLogin") === "true" 
          },
          { withCredentials: true },
        );
        
        console.log("res : ", res);
        
        if (res.status === 206) {  // 완전 신규회원
          posthog.identify(res.data.id);
          trackEvent('signup')
          
          if (window.opener) {
            window.opener.postMessage(
              { 
                type: 'OAUTH_REDIRECT',
                path: '/signup',
                state: {
                  email: res.data.email,
                  name: res.data.name,
                  socialId: res.data.social_id,
                  phone: res.data.phone,
                  profile: res.data.profile,
                  provider: res.data.provider
                }
              },
              window.location.origin
            );
          }
          window.close();
          return;
        } else if (res.status === 208) {  // 이미 가입된 회원 || 탈퇴한 회원
          if (window.opener) {
            window.opener.postMessage(
              { 
                type: 'OAUTH_REDIRECT',
                path: '/login',
                state: { message: res.data.message }
              },
              window.location.origin
            );
          }
          window.close();
          return;
        }
        
        // 로그인 성공
        setToken(res.data.accessToken);
        posthog.identify(res.data.id);
        localStorage.setItem("lastLogin", `${res.data.provider}`);
        
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: 'OAUTH_SUCCESS',
              data: res.data
            },
            window.location.origin
          );
        }
        window.close();
        
      } catch (err) {
        console.error("OAuth 로그인 실패:", err.response);
        trackError(err.response, {
          message: 'OAuth 로그인 실패',
          endpoint: '/callback/oauth',
          file: 'OAuthCallback.tsx',
          page: window.location.pathname,
          severity: 'error'
        })
        
        if (window.opener) {
          window.opener.postMessage(
            { 
              type: 'OAUTH_REDIRECT',
              path: '/login',
              state: { message: err.response?.data?.message || '로그인에 실패했습니다.' }
            },
            window.location.origin
          );
        }
        window.close();
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <DotProgress />
    </div>
  );
}