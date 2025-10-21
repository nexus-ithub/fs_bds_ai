import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './pages/Home'
import Login from './pages/Login'
import { Signup } from './pages/Signup'
import { OAuthCallback } from './auth/callback/OAuthCallback'

function App() {
  
  return (    
    <Router>
      <Routes>
        <Route
          path="/*"
          element={<Home />}
        />
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
          path="/signup/*"
          element={<Signup />}
        />
        <Route 
          path="/oauth/callback/*" 
          element={<OAuthCallback />} />
      </Routes>

    </Router>
  )
}

export default App
