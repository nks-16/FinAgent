import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken } from '../lib/api'

export default function Login({ onLogin }){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = async (e)=>{
    e.preventDefault(); setErr('')
    try {
      const res = await api.login({ email, password })
      const t = res?.access_token
      setToken(t); onLogin(t); nav('/')
    } catch(ex){ setErr(ex?.response?.data?.detail || 'Login failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h3 className="text-2xl font-bold mb-6 text-black dark:text-white">Sign in</h3>
          {err && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
              {String(err)}
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">Email</label>
              <input 
                className="input-field" 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                required 
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">Password</label>
              <input 
                className="input-field" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                placeholder="Enter your password"
              />
            </div>
            <button className="btn-primary w-full" type="submit">Login</button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/signup" className="text-black dark:text-white underline hover:opacity-70 transition-opacity">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
