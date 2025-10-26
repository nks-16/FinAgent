import React, { useEffect, useState } from 'react'
import { api, setToken, apiJava } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'
import RecommendationCard from '../components/RecommendationCard'

export default function Dashboard({ token, onLogout }){
  const [health, setHealth] = useState(null)
  const [stats, setStats] = useState(null)
  const [query, setQuery] = useState('')
  const [answer, setAnswer] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sys, setSys] = useState(null)
  const [recs, setRecs] = useState(null)
  const [recsLoading, setRecsLoading] = useState(false)

  useEffect(()=>{ 
    setToken(token)
    api.health().then(setHealth).catch(()=>{}) 
    refreshStats()
    apiJava.systemHealth().then(setSys).catch(()=>{})
    loadRecommendations()
  },[])

  const refreshStats = ()=> api.stats().then(setStats).catch(()=>{})

  const loadRecommendations = async () => {
    setRecsLoading(true)
    try {
      // Sample user data for demo; in production fetch from user profile
      const userData = {
        monthly_income: 5000,
        current_needs: 2200,
        current_wants: 1800,
        current_savings: 800,
        debts: [
          { name: 'Credit Card', balance: 3000, rate: 18.5 },
          { name: 'Auto Loan', balance: 12000, rate: 5.2 },
        ],
        monthly_expenses: 2500,
        risk_profile: 'moderate',
        age: 32,
        income: 60000,
        savings: 15000,
        debt: 15000,
        investment_horizon_years: 15,
      }
      const res = await api.recommendations(userData)
      setRecs(res)
    } finally {
      setRecsLoading(false)
    }
  }

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
          <div className="d-flex gap-2 align-items-center">
            <a className="btn btn-outline-secondary btn-sm" href="/chat">Chat</a>
            <a className="btn btn-outline-secondary btn-sm" href="/anomaly">Anomaly</a>
            <ThemeToggle />
            <button className="btn btn-outline-primary btn-sm" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="row g-4">
        <div className="col-12">
          <div className="glass-card">
            <h5 className="mb-3" style={{fontWeight:700}}>Financial Recommendations</h5>
            {recsLoading && <p>Loading recommendations...</p>}
            {!recsLoading && recs && (
              <div className="row g-3">
                {recs.budget && (
                  <div className="col-12 col-md-6">
                    <RecommendationCard title="Budget (50/30/20)" data={recs.budget} onApply={()=>alert('Apply budget logic here')} />
                  </div>
                )}
                {recs.debt && (
                  <div className="col-12 col-md-6">
                    <RecommendationCard title="Debt Payoff Strategy" data={recs.debt} />
                  </div>
                )}
                {recs.emergency_fund && (
                  <div className="col-12 col-md-6">
                    <RecommendationCard title="Emergency Fund" data={recs.emergency_fund} />
                  </div>
                )}
                {recs.risk && (
                  <div className="col-12 col-md-6">
                    <RecommendationCard title="Risk Profile & Allocation" data={recs.risk} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="glass-card h-100">
            <h6 style={{fontWeight:700}}>Agent Health</h6>
            <pre className="small">{health ? JSON.stringify(health, null, 2) : '...'}</pre>
          </div>
        </div>
        <div className="col-12 col-lg-8">
          <div className="glass-card h-100">
            <h6 style={{fontWeight:700}}>System Status (Java)</h6>
            <pre className="small mb-0">{sys ? JSON.stringify(sys, null, 2) : '...'}</pre>
          </div>
        </div>
        <div className="col-12 col-lg-8">
          <div className="glass-card h-100">
            <h6 style={{fontWeight:700}}>Ingest Document</h6>
            <input type="file" className="form-control mb-3" onChange={doIngest} disabled={uploading} />
            <div className="d-flex gap-2 align-items-center">
              <button className="btn btn-outline-primary btn-sm" onClick={doReset}>Reset</button>
              <button className="btn btn-outline-primary btn-sm" onClick={refreshStats}>Refresh</button>
              <span className="ms-auto small">{stats ? `${stats.collection}: ${stats.count}` : '...'}</span>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="glass-card">
            <h6 style={{fontWeight:700}}>Ask a Question</h6>
            <form onSubmit={doQuery} className="d-flex gap-2 mb-3">
              <input className="form-control" placeholder="Your question" value={query} onChange={e=>setQuery(e.target.value)} />
              <button className="btn btn-primary" disabled={busy}>Ask</button>
            </form>
            {answer && (
              <div className="mt-3">
                <h6>Answer</h6>
                <pre className="small">{JSON.stringify(answer, null, 2)}</pre>
                <div className="mt-2">
                  <button className="btn btn-sm btn-outline-secondary" onClick={()=>{ apiJava.exportCsv(answer).then(res=>{ const url = window.URL.createObjectURL(res.data); const a=document.createElement('a'); a.href=url; a.download='report.csv'; a.click(); URL.revokeObjectURL(url); });}}>Export CSV (Java)</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
