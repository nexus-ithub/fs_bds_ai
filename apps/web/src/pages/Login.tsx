import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Route, Routes } from 'react-router-dom';
import {setToken} from "../authutil";
import { API_HOST } from "../constants";
import { BuildingShopBI, Button, Checkbox, GoogleLogo, HDivider, KakaoLogo, NaverLogo, VDivider } from "@repo/common";
import axios from 'axios';
import { Dialog } from '@mui/material';
import { toast } from 'react-toastify';
import { LoginMain } from '../auth/LoginMain';
import { EmailLogin } from '../auth/EmailLogin';

interface LoginResponse {
  id: string;
  email: string;
  accessToken: string;
}

export const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    keepLoggedIn: true,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string>('');
  const [openPWFind, setOpenPWFind] = useState<boolean>(false);
  const [openPWFindSuccess, setOpenPWFindSuccess] = useState<boolean>(false);
  const [findPWEmail, setFindPWEmail] = useState<string>('');

  const expiresInStr = import.meta.env.VITE_RESET_TOKEN_EXPIRES_IN;

  let readableExpires = "";
  if (expiresInStr.endsWith("m")) {
    readableExpires = `${parseInt(expiresInStr)}분`;
  } else if (expiresInStr.endsWith("h")) {
    readableExpires = `${parseInt(expiresInStr)}시간`;
  } else if (expiresInStr.endsWith("d")) {
    readableExpires = `${parseInt(expiresInStr)}일`;
  } else {
    readableExpires = "일정시간";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_HOST}/api/auth/login`, credentials, {
        withCredentials: true,
      });

      if (!response.data) {
        throw new Error('로그인에 실패했습니다.');
      }

      const data: LoginResponse = response.data;

      localStorage.setItem("autoLogin", credentials.keepLoggedIn ? "true" : "false");
      setToken(data.accessToken)
      navigate('/');
    } catch (err) {
      // alert('로그인 중 오류가 발생했습니다.');
      // setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
      console.log(`로그인 중 오류: ${err}`)
      setError("이메일 또는 비밀번호가 올바르지 않습니다.")
    }
  };

  const handleOAuth = async(provider: string) => {
    const url = await axios.post(`${API_HOST}/api/auth/oauth/callback/${provider}`, {}, { withCredentials: true });
    if (url) {
      window.location.href = url.data.url;
    } else {
      setError('다른 로그인 방법을 시도하거나 잠시 후 다시 시도해주세요.');
      console.log('지원하지 않는 OAuth 제공자입니다.')
    }
  };

  const handlePWFind = async () => {
    try{
      const response = await axios.post(`${API_HOST}/api/auth/pwfind`, { email: findPWEmail });
      console.log(response)
      setOpenPWFind(false);
      setOpenPWFindSuccess(true);
    }catch(err){
      console.log("비밀번호 찾기 중 오류: ", err)
      toast.error("비밀번호 찾기 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      toast.error(location.state.message, { toastId: 'locationError' });
      // 상태 초기화
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  return (
    <Routes>
      <Route path="/" element={<LoginMain />} />
      <Route path="email" element={<EmailLogin />} />
    </Routes>
  )
}
