import { LoginMain } from '../auth/LoginMain';
import { EmailLogin } from '../auth/EmailLogin';
import { Routes, Route } from 'react-router-dom';
import { getAccessToken } from '../authutil';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const accessToken = getAccessToken();
    if (accessToken) {
      navigate('/main')
    }
  }, [])

  return (
    <Routes>
      <Route path="/" element={<LoginMain />} />
      <Route path="email" element={<EmailLogin />} />
    </Routes>
  )
}
