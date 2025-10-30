import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AGENT_URL = 'http://localhost:8000';

const AIInsights = () => {
  const [activeTab, setActiveTab] = useState('insights');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Insights state
  const [insights, setInsights] = useState(null);
  const [userProfile, setUserProfile] = useState({
    age: 30,
    risk_tolerance: 'moderate',
    investment_horizon_years: 10,
    allocation: { stocks: 60, bonds: 30, cash: 10 }
  });

  // Sentiment state
  const [sentimentResult, setSentimentResult] = useState(null);
  const [newsArticles, setNewsArticles] = useState([
    "Tech stocks rally as AI companies report record earnings",
    "Federal Reserve signals potential interest rate cuts",
    "Market volatility increases amid geopolitical tensions"
  ]);

  // Risk prediction state
  const [riskPrediction, setRiskPrediction] = useState(null);
  const [portfolio, setPortfolio] = useState({
    stocks: 60,
    bonds: 30,
    cash: 10
  });

  // Rebalancing state
  const [rebalancing, setRebalancing] = useState(null);
  const [targetAllocation, setTargetAllocation] = useState({
    stocks: 70,
    bonds: 20,
    cash: 10
  });

  // Forecast state
  const [forecast, setForecast] = useState(null);
  const [forecastHorizon, setForecastHorizon] = useState(10);
  const [marketRegime, setMarketRegime] = useState('normal');

  const fetchPersonalizedInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AGENT_URL}/api/ml/personalized-insights`, userProfile);
      setInsights(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AGENT_URL}/api/ml/sentiment-analysis`, {
        news_articles: newsArticles
      });
      setSentimentResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  const predictRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AGENT_URL}/api/ml/risk-prediction`, {
        portfolio,
        market_conditions: { sentiment: sentimentResult?.overall_sentiment || 'neutral' }
      });
      setRiskPrediction(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict risk');
    } finally {
      setLoading(false);
    }
  };

  const getRebalancingAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AGENT_URL}/api/ml/smart-rebalancing`, {
        current_portfolio: portfolio,
        target_allocation: targetAllocation,
        market_conditions: { sentiment: sentimentResult?.overall_sentiment || 'neutral' }
      });
      setRebalancing(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get rebalancing advice');
    } finally {
      setLoading(false);
    }
  };

  const forecastReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${AGENT_URL}/api/ml/portfolio-forecast`, {
        portfolio,
        time_horizon_years: forecastHorizon,
        market_regime: marketRegime
      });
      setForecast(response.data.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to forecast returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights') {
      fetchPersonalizedInsights();
    }
  }, [activeTab]);

  const getSentimentColor = (sentiment) => {
    return sentiment === 'positive' ? 'text-green-600 dark:text-green-400' :
           sentiment === 'negative' ? 'text-red-600 dark:text-red-400' :
           'text-gray-600 dark:text-gray-400';
  };

  const getRiskColor = (level) => {
    return level === 'low' ? 'text-green-600 dark:text-green-400' :
           level === 'high' ? 'text-red-600 dark:text-red-400' :
           'text-yellow-600 dark:text-yellow-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white mb-2">AI-Powered Financial Insights</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced ML analysis using FinBERT and pre-trained financial models from Hugging Face
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        {['insights', 'sentiment', 'risk', 'rebalancing', 'forecast'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Personalized Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Your Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Age</label>
                <input
                  type="number"
                  value={userProfile.age}
                  onChange={(e) => setUserProfile({...userProfile, age: parseInt(e.target.value)})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Risk Tolerance</label>
                <select
                  value={userProfile.risk_tolerance}
                  onChange={(e) => setUserProfile({...userProfile, risk_tolerance: e.target.value})}
                  className="input-field w-full"
                >
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Investment Horizon (years)</label>
                <input
                  type="number"
                  value={userProfile.investment_horizon_years}
                  onChange={(e) => setUserProfile({...userProfile, investment_horizon_years: parseInt(e.target.value)})}
                  className="input-field w-full"
                />
              </div>
            </div>
            <button onClick={fetchPersonalizedInsights} className="btn-primary mt-4">
              Get AI Insights
            </button>
          </div>

          {insights && (
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                AI Recommendations ({insights.total_insights} insights)
              </h3>
              <div className="space-y-3">
                {insights.insights.map((insight, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border-l-4 ${
                    insight.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase text-gray-600 dark:text-gray-400">
                        {insight.category.replace('_', ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        insight.priority === 'high' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                        insight.priority === 'medium' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                        'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                      }`}>
                        {insight.priority} priority
                      </span>
                    </div>
                    <p className="text-black dark:text-white font-medium mb-2">{insight.message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Action:</strong> {insight.action}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                AI Confidence: {(insights.ai_confidence * 100).toFixed(0)}% | Model: {insights.model_version}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Market Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Market Sentiment Analysis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Using FinBERT - a BERT model fine-tuned on financial data (ProsusAI)
            </p>
            <div className="space-y-2 mb-4">
              {newsArticles.map((article, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={article}
                  onChange={(e) => {
                    const updated = [...newsArticles];
                    updated[idx] = e.target.value;
                    setNewsArticles(updated);
                  }}
                  className="input-field w-full"
                  placeholder="News article text..."
                />
              ))}
            </div>
            <button onClick={analyzeSentiment} className="btn-primary">
              Analyze Sentiment
            </button>
          </div>

          {sentimentResult && (
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Analysis Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Sentiment</p>
                  <p className={`text-3xl font-bold capitalize ${getSentimentColor(sentimentResult.overall_sentiment)}`}>
                    {sentimentResult.overall_sentiment}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {(sentimentResult.confidence * 100).toFixed(1)}% confidence
                  </p>
                </div>
                <div className="card bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Distribution</p>
                  <div className="space-y-2">
                    {Object.entries(sentimentResult.sentiment_distribution).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm capitalize text-black dark:text-white">{key}</span>
                        <span className="text-sm font-semibold text-black dark:text-white">
                          {(value * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Articles Analyzed</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {sentimentResult.article_count}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Prediction Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Portfolio Risk Assessment</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Stocks %</label>
                <input
                  type="number"
                  value={portfolio.stocks}
                  onChange={(e) => setPortfolio({...portfolio, stocks: parseInt(e.target.value)})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Bonds %</label>
                <input
                  type="number"
                  value={portfolio.bonds}
                  onChange={(e) => setPortfolio({...portfolio, bonds: parseInt(e.target.value)})}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Cash %</label>
                <input
                  type="number"
                  value={portfolio.cash}
                  onChange={(e) => setPortfolio({...portfolio, cash: parseInt(e.target.value)})}
                  className="input-field w-full"
                />
              </div>
            </div>
            <button onClick={predictRisk} className="btn-primary">
              Analyze Risk
            </button>
          </div>

          {riskPrediction && !riskPrediction.error && (
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Risk Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Level</p>
                  <p className={`text-4xl font-bold uppercase mb-2 ${getRiskColor(riskPrediction.risk_level)}`}>
                    {riskPrediction.risk_level}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Risk Score: {riskPrediction.risk_score}
                  </p>
                </div>
                <div className="card bg-gray-50 dark:bg-gray-800">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Volatility Estimate</p>
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {riskPrediction.volatility_estimate}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Annual volatility
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-black dark:text-white">{riskPrediction.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-black border-t-transparent"></div>
          Processing...
        </div>
      )}
    </div>
  );
};

export default AIInsights;
