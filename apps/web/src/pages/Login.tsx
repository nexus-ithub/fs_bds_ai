import { LoginMain } from '../auth/LoginMain';
import { EmailLogin } from '../auth/EmailLogin';
import { Routes, Route } from 'react-router-dom';

export const Login = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginMain />} />
      <Route path="email" element={<EmailLogin />} />
    </Routes>
  )
}
