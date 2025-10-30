import { useState, useEffect } from 'react'
import axios from 'axios'

const BACKEND_URL = 'http://localhost:8080';

export default function InvestmentRecommendations({ userProfile }) {
  const [recommendations, setRecommendations] = useState([])
  const [riskProfile, setRiskProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('recommendations')

  useEffect(() => {
    if (userProfile) {
      fetchRecommendations()
      fetchRiskProfile()
    }
  }, [userProfile])

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const requestData = {
        age: calculateAge(userProfile?.date_of_birth) || 30,
        monthlyIncome: 5000.0,
        investmentExperience: 'intermediate',
        timeHorizon: 'medium'
      }
      
      const response = await axios.post(`${BACKEND_URL}/api/recommendations/personalized`, requestData)
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations)
      } else {
        setError('Failed to load recommendations')
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError('Unable to connect to recommendation service')
      setRecommendations(getFallbackRecommendations())
    } finally {
      setLoading(false)
    }
  }

  const fetchRiskProfile = async () => {
    try {
      const requestData = {
        age: calculateAge(userProfile?.date_of_birth) || 30,
        monthlyIncome: 5000.0,
        investmentExperience: 'intermediate',
        timeHorizon: 'medium'
      }
      
      const response = await axios.post(`${BACKEND_URL}/api/recommendations/risk-profile`, requestData)
      
      if (response.data.success) {
        setRiskProfile(response.data.riskProfile)
      }
    } catch (err) {
      console.error('Error fetching risk profile:', err)
      setRiskProfile({
        score: 55,
        category: 'Moderate',
        recommendations: [
          { title: 'Balanced Approach', description: 'Maintain a mix of stocks and bonds for steady growth.' },
          { title: 'Diversify', description: 'Spread investments across different asset classes.' }
        ]
      })
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getFallbackRecommendations = () => {
    return [
      {
        type: 'Stocks',
        name: 'S&P 500 Index Funds',
        description: 'Broad market exposure to 500 largest US companies',
        allocationPercentage: 35.0,
        riskLevel: 'Medium',
        timeframe: 'Long-term (7-10 years)',
        expectedReturn: '8-10% annually',
        reason: 'Provides diversified stock exposure with proven long-term growth.'
      },
      {
        type: 'Bonds',
        name: 'Investment-Grade Corporate Bonds',
        description: 'Quality corporate bonds balancing yield and safety',
        allocationPercentage: 25.0,
        riskLevel: 'Low-Medium',
        timeframe: 'Medium-term (3-7 years)',
        expectedReturn: '4-6% annually',
        reason: 'Bonds provide stability during market volatility while generating income.'
      }
    ]
  }

  const getRiskColor = (riskLevel) => {
    if (riskLevel && riskLevel.toLowerCase().includes('low')) return 'text-green-600 dark:text-green-400'
    if (riskLevel && riskLevel.toLowerCase().includes('medium')) return 'text-yellow-600 dark:text-yellow-400'
    if (riskLevel && riskLevel.toLowerCase().includes('high')) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading recommendations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Your Personalized Investment Strategy</h2>
        <p className="text-blue-100">
          Based on your financial profile and risk tolerance, here are tailored recommendations.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-300 text-sm">
            {error}. Showing fallback recommendations below.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'recommendations'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Recommended Investments
        </button>
        <button
          onClick={() => setActiveTab('risk')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'risk'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Risk Profile
        </button>
        <button
          onClick={() => setActiveTab('education')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'education'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Educational Resources
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'recommendations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{rec.type}</span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{rec.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {rec.allocationPercentage}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Allocation</div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{rec.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Risk Level</div>
                  <div className={`font-semibold ${getRiskColor(rec.riskLevel)}`}>{rec.riskLevel}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Return</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">{rec.expectedReturn}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Time Horizon</div>
                <div className="font-medium text-gray-700 dark:text-gray-300">{rec.timeframe}</div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Why this investment?</div>
                <div className="text-sm text-blue-700 dark:text-blue-400">{rec.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'risk' && riskProfile && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Risk Profile</h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {riskProfile.category} Investor
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Score: {riskProfile.score}/100
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  style={{ width: `${riskProfile.score}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">Recommendations for you:</h4>
              {riskProfile.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">{rec.title}</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'education' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Stocks',
              description: 'Ownership shares in companies. Higher risk, higher potential returns. Best for long-term growth.',
              tips: ['Diversify across sectors', 'Consider index funds', 'Think long-term (5-10+ years)']
            },
            {
              title: 'Bonds',
              description: 'Loans to governments or corporations. Lower risk, steady income. Good for stability.',
              tips: ['Balance your portfolio', 'Consider bond funds', 'Good for near-retirement']
            },
            {
              title: 'ETFs',
              description: 'Baskets of stocks/bonds traded like stocks. Instant diversification at low cost.',
              tips: ['Low fees matter', 'Easy to buy and sell', 'Great for beginners']
            },
            {
              title: 'Real Estate',
              description: 'Property investments or REITs. Provides income and inflation protection.',
              tips: ['REITs are accessible', 'Diversifies portfolio', 'Generates passive income']
            },
            {
              title: 'Cryptocurrency',
              description: 'Digital assets with high volatility. Only invest what you can afford to lose.',
              tips: ['Highly speculative', 'Small allocation only', 'Long-term perspective needed']
            },
            {
              title: 'Mutual Funds',
              description: 'Professionally managed portfolios. Good for hands-off investors.',
              tips: ['Check expense ratios', 'Active vs passive management', 'Tax implications']
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{item.description}</p>
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Key Tips:</div>
                <ul className="space-y-1">
                  {item.tips.map((tip, tipIdx) => (
                    <li key={tipIdx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
