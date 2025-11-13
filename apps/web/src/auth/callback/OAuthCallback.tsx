import { DotProgress } from "@repo/common";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_HOST } from "../../constants";
import { setToken } from "../../authutil";
import posthog from 'posthog-js';
import { logEvent } from "firebase/analytics";
import { analytics } from "../../firebaseConfig";
import * as Sentry from "@sentry/react";

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const pathParts = location.pathname.split("/"); // ['/oauth','callback','kakao']
    const provider = pathParts[3]; // 'kakao', 'google', 'naver' 등
    const code = new URLSearchParams(location.search).get("code");
    const state = new URLSearchParams(location.search).get("state");

    if (!code || !provider) {
      alert("OAuth 인증 정보가 없습니다.");
      navigate("/login");
      return;
    }

    (async () => {
      try {
        const res = await axios.post(
          `${API_HOST}/api/auth/oauth`,
          { provider, code, state, keepLoggedIn: localStorage.getItem("autoLogin") === "true" },
          { withCredentials: true },
        );
        console.log("res : ", res)
        if (res.status === 206) {  // 완전 신규회원
          posthog.identify(res.data.id)
          posthog.capture('signup');
          logEvent(analytics, 'signup');
          navigate('/signup', {state: {email: res.data.email, name: res.data.name, password: res.data.password, phone: res.data.phone, profile: res.data.profile, provider: res.data.provider}})
          return;
        } else if (res.status === 208) {  // 이미 가입된 회원 || 탈퇴한 회원
          navigate("/login", { state: { message: res.data.message } });
          return;
        }
        setToken(res.data.accessToken)
        posthog.identify(res.data.id)
        localStorage.setItem("lastLogin", `${res.data.provider}`);
        navigate('/');
      } catch (err) {
        console.log("err : ", err.response.status)
        console.log("err : ", err.response.data.message)

        console.error("OAuth 로그인 실패:", err);
        Sentry.captureException(err);
        navigate("/login", { state: { message: err.response.data.message } });
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <DotProgress />
    </div>
  );
}