import { DotProgress } from "@repo/common";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_HOST } from "../../constants";
import { setToken } from "../../authutil";

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handledRef = useRef(false);

  useEffect(() => {
    console.log("이거 실행됨")
    if (handledRef.current) return;
    handledRef.current = true;
    const pathParts = location.pathname.split("/"); // ['/oauth','callback','kakao']
    const provider = pathParts[3]; // 'kakao', 'google', 'naver' 등
    const code = new URLSearchParams(location.search).get("code");
    console.log("provider : ", provider);
    console.log("code : ", code);

    if (!code || !provider) {
      alert("OAuth 인증 정보가 없습니다.");
      navigate("/login");
      return;
    }

    (async () => {
      try {
        // 서버에 provider와 code 전달 → 서버가 token 발급 처리
        const res = await axios.post(
          `${API_HOST}/api/auth/oauth`,
          { provider, code, keepLoggedIn: localStorage.getItem("autoLogin") === "true" }
        );
        setToken(res.data.accessToken)
        navigate('/');
      } catch (err) {
        console.error("OAuth 로그인 실패:", err);
        alert("OAuth 로그인 실패");
        navigate("/login");
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <DotProgress />
    </div>
  );
}