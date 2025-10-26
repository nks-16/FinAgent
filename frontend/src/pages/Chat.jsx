import React, { useState } from 'react'
import { api } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'

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
      <nav className="navbar navbar-expand mb-4">
        <div className="container-fluid">
          <span className="navbar-brand">FinAgent Chat</span>
          <div className="d-flex gap-2 align-items-center">
            <a className="btn btn-outline-secondary btn-sm" href="/">Dashboard</a>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <div className="glass-card">
        <h5 className="mb-3" style={{fontWeight:700}}>AI Financial Assistant</h5>
        <form onSubmit={ask} className="d-flex gap-2 mb-3">
          <input className="form-control" placeholder="Ask about finance, markets, strategies..." value={prompt} onChange={e=>setPrompt(e.target.value)} />
          <button className="btn btn-primary" disabled={busy}>Ask</button>
        </form>
        {res && (
          <div className="mt-3">
            <h6 style={{fontWeight:700}}>Answer</h6>
            <div className="mono-box mb-3">{res.answer || ''}</div>
            <div className="small">
              <strong>Sources:</strong>
              {res.sources?.web && res.sources.web.length > 0 && (
                <div className="mt-2">
                  <em>Web:</em>
                  {res.sources.web.map((u,i)=>(<div key={i}><a href={u} target="_blank" rel="noreferrer">{u}</a></div>))}
                </div>
              )}
              {res.sources?.rag && res.sources.rag.length > 0 && (
                <div className="mt-2">
                  <em>RAG Docs:</em> {res.sources.rag.length} retrieved
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
