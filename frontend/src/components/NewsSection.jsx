import { useState, useEffect } from 'react'

export default function NewsSection({ userCategories = [] }) {
  const [news, setNews] = useState([])
  const [marketData, setMarketData] = useState({ indices: [], crypto: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('news') // 'news', 'market', 'crypto'
  const [error, setError] = useState(null)

  const JAVA_BACKEND_URL = 'http://localhost:8080'

  useEffect(() => {
    fetchFinancialData()
  }, [userCategories])

  const fetchFinancialData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch personalized news based on user's spending categories
      const newsResponse = await fetch(`${JAVA_BACKEND_URL}/api/financial-insights/news/personalized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categories: userCategories.length > 0 ? userCategories : ['general', 'investing', 'personal-finance']
        })
      })
      
      if (newsResponse.ok) {
        const newsData = await newsResponse.json()
        setNews(Array.isArray(newsData) ? newsData : (newsData.news || []))
      }

      // Fetch market indices
      const indicesResponse = await fetch(`${JAVA_BACKEND_URL}/api/financial-insights/markets/indices`)
      if (indicesResponse.ok) {
        const indicesData = await indicesResponse.json()
        setMarketData(prev => ({ ...prev, indices: Array.isArray(indicesData) ? indicesData : (indicesData.indices || []) }))
      }

      // Fetch cryptocurrency prices
      const cryptoResponse = await fetch(`${JAVA_BACKEND_URL}/api/financial-insights/markets/crypto`)
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json()
        setMarketData(prev => ({ ...prev, crypto: Array.isArray(cryptoData) ? cryptoData : (cryptoData.crypto || []) }))
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err)
      setError('Unable to load financial insights. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const formatChangePercent = (value) => {
    if (!value) return 'N/A'
    const num = parseFloat(value)
    const sign = num >= 0 ? '+' : ''
    return `${sign}${num.toFixed(2)}%`
  }

  const getChangeColor = (value) => {
    if (!value) return 'text-gray-400'
    const num = parseFloat(value)
    return num >= 0 ? 'text-green-500' : 'text-red-500'
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading financial insights...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">!</div>
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">Error Loading Data</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
            <button 
              onClick={fetchFinancialData}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'news'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          News ({news.length})
        </button>
        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'market'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Market Indices ({marketData.indices.length})
        </button>
        <button
          onClick={() => setActiveTab('crypto')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            activeTab === 'crypto'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Crypto ({marketData.crypto.length})
        </button>
      </div>

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No news articles available
            </div>
          ) : (
            news.map((article, idx) => (
              <div key={idx} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                      {article.source}
                    </span>
                    {article.category && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {article.category}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  
                  {article.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 flex-1">
                      {article.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200 dark:border-gray-700">
                    {article.publishedAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Read more →
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Market Indices Tab */}
      {activeTab === 'market' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {marketData.indices.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No market data available
            </div>
          ) : (
            marketData.indices.map((item, idx) => (
              <div key={idx} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {item.symbol}
                  </span>
                  <span className="text-xs text-gray-400">{item.market}</span>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                  {item.name}
                </h3>
                
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${parseFloat(item.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm font-semibold mt-1 ${getChangeColor(item.changePercent)}`}>
                    {formatChangePercent(item.changePercent)}
                  </div>
                </div>
                
                {item.lastUpdated && (
                  <div className="text-xs text-gray-400 mt-3">
                    Updated: {new Date(item.lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Cryptocurrency Tab */}
      {activeTab === 'crypto' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {marketData.crypto.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No cryptocurrency data available
            </div>
          ) : (
            marketData.crypto.map((coin, idx) => (
              <div key={idx} className="card p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">
                    {coin.symbol}
                  </span>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                    Crypto
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                  {coin.name}
                </h3>
                
                <div className="mt-3">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${parseFloat(coin.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm font-semibold mt-1 ${getChangeColor(coin.changePercent)}`}>
                    {formatChangePercent(coin.changePercent)}
                  </div>
                </div>
                
                {coin.volume && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Vol: ${parseFloat(coin.volume).toLocaleString()}
                  </div>
                )}
                
                {coin.lastUpdated && (
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(coin.lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={fetchFinancialData}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium flex items-center gap-2"
        >
          Refresh Data
        </button>
      </div>
    </div>
  )
}
