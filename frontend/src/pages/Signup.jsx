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
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card p-4">
            <h3 className="mb-3">Create account</h3>
            {err && <div className="alert alert-danger">{String(err)}</div>}
            {ok && <div className="alert alert-success">{String(ok)}</div>}
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm Password</label>
                <input className="form-control" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required />
              </div>
              <button className="btn btn-primary w-100" type="submit">Sign up</button>
            </form>
            <div className="mt-3 text-center">
              <Link to="/login" className="link-primary">Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
