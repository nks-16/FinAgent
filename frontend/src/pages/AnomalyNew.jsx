import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'

export default function Anomaly(){
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(()=>{ api.anomalyStatus().then(setStatus).catch(()=>{}) },[])

  const onFile = async (e)=>{
    const f = e.target.files?.[0]; if(!f) return; setBusy(true); setErr(''); setResult(null)
    try{
      const res = await api.anomalyFile(f)
      setResult(res)
    }catch(ex){ setErr(ex?.response?.data?.detail || 'Failed to analyze')}
    finally{ setBusy(false) }
  }

  const sampleJson = async ()=>{
    setBusy(true); setErr(''); setResult(null)
    try{
      const records = [
        { revenue: 100, cogs: 40, opex: 30, net_income: 20 },
        { revenue: 110, cogs: 45, opex: 32, net_income: 22 },
        { revenue: 5000, cogs: 10, opex: 10, net_income: 10 },
      ]
      const res = await api.anomalyJson(records, { contamination: 0.25, top_k: 2 })
      setResult(res)
    }catch(ex){ setErr(ex?.response?.data?.detail || 'Failed to analyze') }
    finally{ setBusy(false) }
  }

  return (
    <div className="container py-4">
      <nav className="navbar navbar-expand mb-4">
        <div className="container-fluid">
          <Link to="/" className="navbar-brand">FinAgent</Link>
          <div className="d-flex gap-2 align-items-center">
            <Link className="btn btn-outline-secondary btn-sm" to="/">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="row g-4">
        <div className="col-12 col-lg-6">
          <div className="glass-card h-100">
            <h5 style={{fontWeight:700}}>Detect Anomalies (CSV)</h5>
            <div className="small text-muted mb-2">
              Model: {status ? (status.loaded ? `loaded from ${status.path || 'unknown'}` : 'not loaded (training on-the-fly)') : '...'}
            </div>
            <input className="form-control" type="file" accept=".csv" onChange={onFile} disabled={busy} />
            <p className="small text-muted mt-2">Try <code>data/sample/financials.csv</code></p>
            <button className="btn btn-outline-primary mt-2" onClick={sampleJson} disabled={busy}>Run Sample JSON</button>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="glass-card h-100">
            <h5 style={{fontWeight:700}}>Results</h5>
            {err && <div className="alert alert-danger">{String(err)}</div>}
            <pre className="small mb-0" style={{minHeight: '200px'}}>{result ? JSON.stringify(result, null, 2) : (busy ? 'Analyzing...' : 'No results yet')}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
