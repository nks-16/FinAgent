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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <nav className="navbar px-4 py-3">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-black dark:text-white">FinAgent</Link>
          <div className="flex gap-2 items-center">
            <Link className="btn-outline text-sm" to="/">Dashboard</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h5 className="text-xl font-bold mb-4 text-black dark:text-white">Detect Anomalies (CSV)</h5>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Model: {status ? (status.loaded ? `loaded from ${status.path || 'unknown'}` : 'not loaded (training on-the-fly)') : '...'}
          </div>
          <input 
            className="input-field mb-3" 
            type="file" 
            accept=".csv" 
            onChange={onFile} 
            disabled={busy} 
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Try <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">data/sample/financials.csv</code>
          </p>
          <button className="btn-outline" onClick={sampleJson} disabled={busy}>
            Run Sample JSON
          </button>
        </div>
        
        <div className="card">
          <h5 className="text-xl font-bold mb-4 text-black dark:text-white">Results</h5>
          {err && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
              {String(err)}
            </div>
          )}
          <pre className="text-xs bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded p-4 min-h-[200px] overflow-auto text-black dark:text-white">
            {result ? JSON.stringify(result, null, 2) : (busy ? 'Analyzing...' : 'No results yet')}
          </pre>
        </div>
      </div>
    </div>
  )
}
