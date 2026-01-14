import { DotProgress } from "@repo/common";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_HOST } from "../../constants";
import { setToken } from "../../authutil";
import posthog from 'posthog-js';
import { trackError, trackEvent } from "../../utils/analytics";

export const OAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const handledRef = useRef(false);
  const isPopup = !!window.opener;

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    
    const pathParts = location.pathname.split("/");
    const provider = pathParts[3];
    const code = new URLSearchParams(location.search).get("code");
    const state = new URLSearchParams(location.search).get("state");

    if (!code || !provider) {
      if (isPopup) {
        window.opener.postMessage(
          {
            type: 'OAUTH_ERROR',
            message: 'OAuth 인증 정보가 없습니다.'
          },
          window.location.origin
        );
        window.close();
      } else {
        navigate('/login', { state: { message: 'OAuth 인증 정보가 없습니다.' }, replace: true });
      }
      return;
    }

    (async () => {
      try {
        // 개발환경에서는 sessionStorage에서 state 읽어서 전송
        const savedState = import.meta.env.DEV
          ? sessionStorage.getItem('oauth_state')
          : undefined;

        // 사용 후 삭제
        if (import.meta.env.DEV) {
          sessionStorage.removeItem('oauth_state');
        }

        const res = await axios.post(
          `${API_HOST}/api/auth/oauth`,
          {
            provider,
            code,
            state,
            keepLoggedIn: localStorage.getItem("autoLogin") === "true",
            savedState
          },
          { withCredentials: true },
        );
        
        console.log("res : ", res);
        
        if (res.status === 206) {  // 완전 신규회원
          posthog.identify(res.data.id);
          trackEvent('signup')

          const signupState = {
            email: res.data.email,
            name: res.data.name,
            socialId: res.data.social_id,
            phone: res.data.phone,
            profile: res.data.profile,
            provider: res.data.provider
          };

          if (isPopup) {
            window.opener.postMessage(
              { type: 'OAUTH_REDIRECT', path: '/signup', state: signupState },
              window.location.origin
            );
            window.close();
          } else {
            navigate('/signup', { state: signupState, replace: true });
          }
          return;
        } else if (res.status === 208) {  // 이미 가입된 회원 || 탈퇴한 회원
          console.log("이미 가입된 회원");
          if (isPopup) {
            console.log("팝업");
            window.opener.postMessage(
              { type: 'OAUTH_REDIRECT', path: '/login', state: { message: res.data.message } },
              window.location.origin
            );
            window.close();
          } else {
            console.log("리다이렉트");
            navigate('/login', { state: { message: res.data.message }, replace: true });
          }
          return;
        }

        // 로그인 성공
        setToken(res.data.accessToken);
        posthog.identify(res.data.id);
        localStorage.setItem("lastLogin", `${res.data.provider}`);

        if (isPopup) {
          window.opener.postMessage(
            { type: 'OAUTH_SUCCESS', data: res.data },
            window.location.origin
          );
          window.close();
        } else {
          navigate('/', { replace: true });
        }
        
      } catch (err) {
        console.error("OAuth 로그인 실패:", err.response);
        trackError(err.response, {
          message: 'OAuth 로그인 실패',
          endpoint: '/callback/oauth',
          file: 'OAuthCallback.tsx',
          page: window.location.pathname,
          severity: 'error'
        })

        const errorMessage = err.response?.data?.message || '로그인에 실패했습니다.';

        if (isPopup) {
          window.opener.postMessage(
            { type: 'OAUTH_REDIRECT', path: '/login', state: { message: errorMessage } },
            window.location.origin
          );
          window.close();
        } else {
          navigate('/login', { state: { message: errorMessage }, replace: true });
        }
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <DotProgress />
    </div>
  );
}