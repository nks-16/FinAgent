import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles.css'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Anomaly from './pages/Anomaly'
import Chat from './pages/Chat'

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token') || '')
  const onLogin = (t) => { localStorage.setItem('token', t); setToken(t) }
  const onLogout = () => { localStorage.removeItem('token'); setToken('') }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={onLogin} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={token ? <Dashboard token={token} onLogout={onLogout} /> : <Navigate to="/login" />} />
        <Route path="/anomaly" element={token ? <Anomaly /> : <Navigate to="/login" />} />
        <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)
