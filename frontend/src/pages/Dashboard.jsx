import React, { useEffect, useState } from 'react'
import { api, setToken, apiJava } from '../lib/api'
import ThemeToggle from '../components/ThemeToggle'
import RecommendationCard from '../components/RecommendationCard'

export default function Dashboard({ token, onLogout }){
  const [health, setHealth] = useState(null)
  const [sys, setSys] = useState(null)
  const [recs, setRecs] = useState(null)
  const [recsLoading, setRecsLoading] = useState(false)

  useEffect(()=>{ 
    setToken(token)
    api.health().then(setHealth).catch(()=>{}) 
    apiJava.systemHealth().then(setSys).catch(()=>{})
    loadRecommendations()
  },[])

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <nav className="navbar px-4 py-3">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="text-2xl font-bold text-black dark:text-white">FinAgent</span>
          <div className="flex gap-2 items-center">
            <a className="btn-outline text-sm" href="/chat">Chat</a>
            <a className="btn-outline text-sm" href="/anomaly">Anomaly</a>
            <ThemeToggle />
            <button className="btn-outline text-sm" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="card">
          <h4 className="text-2xl font-bold text-black dark:text-white mb-2">
            Welcome to Your Financial Dashboard
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Get personalized financial recommendations powered by AI
          </p>
        </div>

        {/* Recommendations Section */}
        <div className="card">
          <h5 className="text-xl font-bold mb-4 text-black dark:text-white">Financial Recommendations</h5>
          {recsLoading && <p className="text-gray-600 dark:text-gray-400">Loading recommendations...</p>}
          {!recsLoading && recs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recs.budget && (
                <RecommendationCard title="Budget (50/30/20)" data={recs.budget} onApply={()=>alert('Apply budget logic here')} />
              )}
              {recs.debt && (
                <RecommendationCard title="Debt Payoff Strategy" data={recs.debt} />
              )}
              {recs.emergency_fund && (
                <RecommendationCard title="Emergency Fund" data={recs.emergency_fund} />
              )}
              {recs.risk && (
                <RecommendationCard title="Risk Profile & Allocation" data={recs.risk} />
              )}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h6 className="font-bold mb-3 text-black dark:text-white">System Status</h6>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto text-black dark:text-white">
              {health ? JSON.stringify(health, null, 2) : 'Loading...'}
            </pre>
          </div>
          <div className="card">
            <h6 className="font-bold mb-3 text-black dark:text-white">Backend Health</h6>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto text-black dark:text-white">
              {sys ? JSON.stringify(sys, null, 2) : 'Loading...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
