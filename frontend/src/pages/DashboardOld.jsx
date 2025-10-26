import React, { useEffect, useState } from 'react'
import { api, setToken, apiJava } from '../lib/api'

export default function Dashboard({ token, onLogout }){
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sys, setSys] = useState(null)

  useEffect(()=>{ setToken(token); api.health().then(setHealth).catch(()=>{}) ; refreshStats(); apiJava.systemHealth().then(setSys).catch(()=>{}) },[])
  const refreshStats = ()=> api.stats().then(setStats).catch(()=>{})

  const doQuery = async (e)=>{
    e.preventDefault(); setBusy(true); setAnswer(null)
    try{ const res = await api.query(query); setAnswer(res) } finally{ setBusy(false) }
  }
  const doIngest = async (e)=>{
    const f = e.target.files?.[0]; if(!f) return; setUploading(true)
    try{ await api.ingest(f); await refreshStats() } finally{ setUploading(false) }
  }
  const doReset = async ()=>{ await api.reset(); await refreshStats() }

  return (
    <div className="container py-4">
      <nav className="navbar navbar-expand mb-4">
        <div className="container-fluid">
          <span className="navbar-brand">FinAgent</span>
          <div className="d-flex gap-2">
            <a className="btn btn-outline-secondary" href="/chat">Chat</a>
            <a className="btn btn-outline-secondary" href="/anomaly">Anomaly</a>
            <button className="btn btn-outline-primary" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card p-3 h-100">
            <h5>Health</h5>
            <pre className="small">{health ? JSON.stringify(health, null, 2) : '...'}</pre>
          </div>
        </div>
        <div className="col-12 col-lg-8">
          <div className="card p-3 h-100">
            <h5>System status (Java)</h5>
            <pre className="small mb-0">{sys ? JSON.stringify(sys, null, 2) : '...'}</pre>
          </div>
        </div>
        <div className="col-12 col-lg-8">
          <div className="card p-3 h-100">
            <h5>Ingest document</h5>
            <input type="file" className="form-control mb-3" onChange={doIngest} disabled={uploading} />
            <div className="d-flex gap-2 align-items-center">
              <button className="btn btn-outline-primary" onClick={doReset}>Reset collection</button>
              <button className="btn btn-outline-primary" onClick={refreshStats}>Refresh stats</button>
              <span className="ms-auto small">{stats ? `${stats.collection}: ${stats.count}` : '...'}</span>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card p-3">
            <h5>Ask a question</h5>
            <form onSubmit={doQuery} className="d-flex gap-2">
              <input className="form-control" placeholder="Your question" value={query} onChange={e=>setQuery(e.target.value)} />
              <button className="btn btn-primary" disabled={busy}>Ask</button>
            </form>
            {answer && (
              <div className="mt-3">
                <h6>Answer</h6>
                <pre className="small">{JSON.stringify(answer, null, 2)}</pre>
                <div className="mt-2">
                  <a className="btn btn-sm btn-outline-secondary" href="#" onClick={(e)=>{e.preventDefault(); apiJava.exportCsv(answer).then(res=>{ const url = window.URL.createObjectURL(res.data); const a=document.createElement('a'); a.href=url; a.download='report.csv'; a.click(); URL.revokeObjectURL(url); });}}>Export CSV (Java)</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
