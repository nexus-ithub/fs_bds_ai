import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import axios from "axios";

export const KakaoCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get('code');
    console.log(">>>>code : ", code);
    if (!code) return;

    (async () => {
      try {
        // 서버에 code 전달 — 서버가 token 교환 및 사용자 info 요청 처리
        const res = await axios.post(`${import.meta.env.VITE_API_HOST}/api/auth/kakao`, { code }, { withCredentials: true });
        // res.data에 우리가 발급한 accessToken 등 담아서 반환하도록 서버 구현
        console.log('로그인 완료:', res.data);
        // 로그인 상태 저장 후 리다이렉트
        navigate('/');
      } catch (err) {
        console.error(err);
        alert('카카오 로그인 실패');
      }
    })();
  }, []);

  return (
    <div>
      <h1>카카오 로그인 처리중...</h1>
    </div>
  );
};