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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="glass-card">
            <h3 className="mb-3" style={{fontWeight:700}}>Sign in</h3>
            {err && <div className="alert alert-danger">{String(err)}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <button className="btn btn-primary w-100" type="submit">Login</button>
            </form>
            <div className="mt-3 text-center">
              <Link to="/signup" className="link-primary">Create an account</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
