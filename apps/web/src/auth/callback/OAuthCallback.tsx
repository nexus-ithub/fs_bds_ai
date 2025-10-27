import { Button, DotProgress } from "@repo/common";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_HOST } from "../../constants";
import { setToken } from "../../authutil";
import { Dialog } from "@mui/material";

export const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handledRef = useRef(false);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

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
        if (res.status === 201) {
          setToken(res.data.accessToken)
          setOpenDialog(true);
          return;
        } else if (res.status === 206) {
          // navigate('/signup/info', {state: {serviceAgree, privacyAgree, marketingEmailAgree, marketingSmsAgree}})
          console.log("res.data : ", res.data)
          navigate('/signup', {state: {email: res.data.email, name: res.data.name, password: res.data.password, phone: res.data.phone, profile: res.data.profile, provider: res.data.provider}})
          return;
        }
        setToken(res.data.accessToken)
        navigate('/');
      } catch (err) {
        console.log("err : ", err.response.status)
        console.log("err : ", err.response.data.message)

        console.error("OAuth 로그인 실패:", err);
        navigate("/login", { state: { message: err.response.data.message } });
      }
    })();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen">
      <DotProgress />
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <div className="flex flex-col items-center justify-center px-[40px] pt-[40px] pb-[32px] gap-[8px]">
          <p className="font-h2 text-center">회원가입이 완료되었습니다.</p>
          <div className="flex items-center justify-center gap-[12px] w-full mt-[16px]">
            <Button
              autoFocus
              className="w-[112px]"
              size="semiMedium"
              onClick={() => {
                setOpenDialog(false);
                navigate('/main');
              }}
            >
              확인
            </Button>
          </div>
              </div>
      </Dialog>
    </div>
  );
}