import { DotProgress } from "@repo/common";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
          `${import.meta.env.VITE_API_HOST}/api/auth/oauth`,
          { provider, code }
        );

        console.log("로그인 완료:", res.data);

        // 로그인 상태 저장 후 메인 페이지 이동
        navigate("/");
      } catch (err) {
        console.error("OAuth 로그인 실패:", err);
        alert("OAuth 로그인 실패");
        navigate("/login");
      }
    })();
  }, [location]);

  return (
    <div className="flex items-center justify-center h-screen">
      <DotProgress />
    </div>
  );
}