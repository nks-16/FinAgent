import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function Signup(){
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  const submit = async (e)=>{
    e.preventDefault(); setErr(''); setOk('')
    if(password !== confirm){ setErr('Passwords do not match'); return }
    try {
      await api.signup({ email, password })
      setOk('Account created. You can sign in now.')
      setTimeout(()=>nav('/login'), 1000)
    } catch(ex){ setErr(ex?.response?.data?.detail || 'Signup failed') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h3 className="text-2xl font-bold mb-6 text-black dark:text-white">Create account</h3>
          {err && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
              {String(err)}
            </div>
          )}
          {ok && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-300 rounded">
              {String(ok)}
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
            <div>
              <label className="block text-sm font-semibold mb-2 text-black dark:text-white">Confirm Password</label>
              <input 
                className="input-field" 
                type="password" 
                value={confirm} 
                onChange={e=>setConfirm(e.target.value)} 
                required 
                placeholder="Confirm your password"
              />
            </div>
            <button className="btn-primary w-full" type="submit">Sign up</button>
          </form>
          <div className="mt-6 text-center">
            <Link to="/login" className="text-black dark:text-white underline hover:opacity-70 transition-opacity">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
