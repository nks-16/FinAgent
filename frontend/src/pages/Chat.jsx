import React, { useState } from 'react'
import { api } from '../lib/api'

export default function Chat(){
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [res, setRes] = useState(null)

  const ask = async (e)=>{
    e.preventDefault(); if(!prompt.trim()) return; setBusy(true)
    try {
      const out = await api.chat(prompt)
      setRes(out)
    } finally { setBusy(false) }
  }

  return (
    <div className="container py-4">
      <div className="card p-3">
        <h5 className="mb-3">Chat</h5>
        <form onSubmit={ask} className="d-flex gap-2">
          <input className="form-control" placeholder="Ask about finance..." value={prompt} onChange={e=>setPrompt(e.target.value)} />
          <button className="btn btn-primary" disabled={busy}>Ask</button>
        </form>
        {res && (
          <div className="mt-3">
            <h6>Answer</h6>
            <div className="mono-box">{res.answer || ''}</div>
            <div className="mt-2 small">
              <strong>Sources:</strong>
              <div>Web: {(res.sources?.web||[]).map((u,i)=>(<div key={i}><a href={u} target="_blank" rel="noreferrer">{u}</a></div>))}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
