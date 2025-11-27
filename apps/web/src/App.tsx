import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { OAuthCallback } from './auth/callback/OAuthCallback'
import { ResetPassword } from './auth/ResetPassword'
import { useVersionCheck } from './useVersionCheck';
import { Dialog } from '@mui/material'
import { Button } from '@repo/common'

function App() {
  const { updateAvailable, setUpdateAvailable, refresh } = useVersionCheck();
  
  return (    
    <>
      <Dialog open={updateAvailable}>
        <div className="flex flex-col items-center justify-center px-[30px] py-[24px] gap-[8px]">
          <p className="font-h2 text-center">새로운 버전이 있습니다.</p>
          <p className="font-h2 text-center">지금 업데이트하시겠습니까?</p>
          <div className='pt-[16px] flex gap-[8px]'>
            <Button variant='bggray' size='semiMedium' className='w-[72px]' onClick={() => setUpdateAvailable(false)}>닫기</Button>
            <Button size='semiMedium' className='w-[112px]' onClick={refresh}>업데이트</Button>
          </div>
        </div>
      </Dialog>
      <Router>
        <Routes>
          <Route
            path="/*"
            element={<Home />}
          />
          <Route
            path="/login/*"
            element={<Login />}
          />
          <Route
            path="/signup/*"
            element={<Signup />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />
          <Route 
            path="/oauth/callback/*" 
            element={<OAuthCallback />} />
        </Routes>

      </Router>
    </>
  )
}

export default App
