import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8080';

const InvestmentSimulator = () => {
  // Input states
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [timeHorizon, setTimeHorizon] = useState(10);
  const [simulationMode, setSimulationMode] = useState('simple');
  const [includeInflation, setIncludeInflation] = useState(true);
  const [inflationRate, setInflationRate] = useState(3.0);
  const [includeRebalancing, setIncludeRebalancing] = useState(true);

  // Asset allocation states
  const [allocations, setAllocations] = useState({
    stocks: 50,
    bonds: 30,
    reits: 10,
    cash: 10
  });

  // Results states
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('inputs'); // 'inputs', 'results', 'comparison', 'whatif', 'goals'

  // Comparison states
  const [scenarios, setScenarios] = useState([]);
  const [comparisonResults, setComparisonResults] = useState(null);

  // What-If Analysis states
  const [whatIfParameter, setWhatIfParameter] = useState('initialInvestment');
  const [whatIfResults, setWhatIfResults] = useState([]);
  const [whatIfLoading, setWhatIfLoading] = useState(false);

  // Goal Planning states
  const [goalAmount, setGoalAmount] = useState(1000000);
  const [goalTimeframe, setGoalTimeframe] = useState(20);
  const [goalResults, setGoalResults] = useState(null);

  // Auto-run simulation when parameters change (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.values(allocations).reduce((a, b) => a + b, 0) === 100) {
        runSimulation();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [initialInvestment, monthlyContribution, timeHorizon, allocations, simulationMode, includeInflation, inflationRate, includeRebalancing]);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/simulator/run`, {
        initialInvestment,
        monthlyContribution,
        timeHorizon,
        assetAllocations: allocations,
        includeInflation,
        inflationRate,
        includeRebalancing,
        rebalancingFrequency: 12,
        simulationMode
      });

      if (response.data.success) {
        setSimulationResult(response.data.result);
      } else {
        setError(response.data.error || 'Simulation failed');
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setError('Failed to run simulation. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocationChange = (asset, value) => {
    const newValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
    setAllocations({ ...allocations, [asset]: newValue });
  };

  const normalizeAllocations = () => {
    const total = Object.values(allocations).reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const normalized = {};
    Object.keys(allocations).forEach(key => {
      normalized[key] = Math.round((allocations[key] / total) * 100);
    });
    
    // Adjust for rounding errors
    const newTotal = Object.values(normalized).reduce((a, b) => a + b, 0);
    if (newTotal !== 100) {
      const diff = 100 - newTotal;
      const firstKey = Object.keys(normalized)[0];
      normalized[firstKey] += diff;
    }
    
    setAllocations(normalized);
  };

  const addToComparison = () => {
    if (!simulationResult) return;
    
    const scenario = {
      name: `Scenario ${scenarios.length + 1}`,
      params: {
        initialInvestment,
        monthlyContribution,
        timeHorizon,
        allocations: { ...allocations },
        mode: simulationMode
      },
      result: simulationResult
    };
    
    setScenarios([...scenarios, scenario]);
    
    // Show success message
    const tempDiv = document.createElement('div');
    tempDiv.className = 'fixed top-20 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg font-medium animate-slide-up';
    tempDiv.textContent = '✓ Scenario added to comparison';
    document.body.appendChild(tempDiv);
    setTimeout(() => tempDiv.remove(), 3000);
    
    // Auto-switch to comparison tab
    setTimeout(() => setActiveView('comparison'), 500);
  };

  // What-If Analysis function
  const runWhatIfAnalysis = async () => {
    setWhatIfLoading(true);
    setError(null);

    try {
      const baseValue = {
        initialInvestment,
        monthlyContribution,
        timeHorizon,
        allocations: { stocks: 60 } // Simplified for what-if
      }[whatIfParameter] || initialInvestment;

      const variations = whatIfParameter === 'allocations' 
        ? [30, 40, 50, 60, 70, 80]
        : whatIfParameter === 'timeHorizon'
        ? [5, 10, 15, 20, 25, 30]
        : whatIfParameter === 'monthlyContribution'
        ? [250, 500, 1000, 2000, 3000, 5000]
        : [5000, 10000, 25000, 50000, 100000, 250000];

      const results = await Promise.all(
        variations.map(async (value) => {
          let params = {
            initialInvestment,
            monthlyContribution,
            timeHorizon,
            assetAllocations: allocations,
            simulationMode,
            includeInflation,
            inflationRate,
            includeRebalancing
          };

          if (whatIfParameter === 'allocations') {
            params.assetAllocations = {
              stocks: value,
              bonds: 100 - value,
              reits: 0,
              cash: 0
            };
          } else if (whatIfParameter === 'timeHorizon') {
            params.timeHorizon = value;
          } else if (whatIfParameter === 'monthlyContribution') {
            params.monthlyContribution = value;
          } else {
            params.initialInvestment = value;
          }

          const response = await axios.post(`${BACKEND_URL}/api/simulator/run`, params);
          return { value, result: response.data };
        })
      );

      setWhatIfResults(results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to run What-If analysis');
    } finally {
      setWhatIfLoading(false);
    }
  };

  // Run what-if when parameter changes
  useEffect(() => {
    if (activeView === 'whatif' && Object.values(allocations).reduce((a, b) => a + b, 0) === 100) {
      runWhatIfAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatIfParameter, activeView]);

  // Calculate what's needed to reach goal
  const calculateGoalRequirements = () => {
    try {
      const monthlyRate = 0.08 / 12; // Assume 8% annual return
      const months = goalTimeframe * 12;
      
      // Future value with current initial investment
      const futureValueOfInitial = initialInvestment * Math.pow(1 + monthlyRate, months);
      
      // Remaining amount needed from contributions
      const remainingNeeded = goalAmount - futureValueOfInitial;
      
      // Calculate required monthly contribution using future value of annuity formula
      const requiredMonthly = remainingNeeded * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
      
      // Calculate shortfall/excess with current contribution
      const futureValueWithCurrent = futureValueOfInitial + 
        (monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      
      const shortfall = goalAmount - futureValueWithCurrent;
    
      return {
        requiredMonthly: Math.max(0, requiredMonthly),
        projectedValue: futureValueWithCurrent,
        shortfall: shortfall,
        onTrack: shortfall <= 0,
        percentToGoal: (futureValueWithCurrent / goalAmount) * 100
      };
    } catch (error) {
      console.error('Error calculating goal requirements:', error);
      return {
        requiredMonthly: 0,
        projectedValue: 0,
        shortfall: goalAmount,
        onTrack: false,
        percentToGoal: 0
      };
    }
  };

  useEffect(() => {
    if (activeView === 'goals') {
      setGoalResults(calculateGoalRequirements());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalAmount, goalTimeframe, initialInvestment, monthlyContribution, activeView]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const getTotalAllocation = () => {
    return Object.values(allocations).reduce((a, b) => a + b, 0);
  };

  const isAllocationValid = () => {
    return getTotalAllocation() === 100;
  };

  const getAssetColor = (asset) => {
    const colors = {
      stocks: '#3b82f6',
      bonds: '#10b981',
      reits: '#f59e0b',
      cash: '#6b7280',
      crypto: '#8b5cf6',
      international: '#ec4899',
      commodities: '#ef4444'
    };
    return colors[asset] || '#64748b';
  };

  return (
    <div className="space-y-6">
      {/* View Navigation */}
      <div className="flex gap-3 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveView('inputs')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === 'inputs'
              ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Configure Portfolio
        </button>
        <button
          onClick={() => setActiveView('results')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === 'results'
              ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          disabled={!simulationResult}
        >
          View Results
        </button>
        <button
          onClick={() => setActiveView('comparison')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === 'comparison'
              ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Compare Scenarios ({scenarios.length})
        </button>
        <button
          onClick={() => setActiveView('whatif')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === 'whatif'
              ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          What-If Analysis
        </button>
        <button
          onClick={() => setActiveView('goals')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeView === 'goals'
              ? 'text-black dark:text-white border-b-2 border-black dark:border-white'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Goal Planning
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}

      {/* Configure View */}
      {activeView === 'inputs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Inputs */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4">Investment Parameters</h2>
              
              {/* Initial Investment */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                  Initial Investment: {formatCurrency(initialInvestment)}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="1000"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                />
                <input
                  type="number"
                  value={initialInvestment}
                  onChange={(e) => setInitialInvestment(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mt-2"
                />
              </div>

              {/* Monthly Contribution */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                  Monthly Contribution: {formatCurrency(monthlyContribution)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                />
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, parseInt(e.target.value) || 0))}
                  className="input-field mt-2"
                />
              </div>

              {/* Time Horizon */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                  Time Horizon: {timeHorizon} years
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                />
              </div>

              {/* Simulation Mode */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                  Simulation Mode
                </label>
                <select
                  value={simulationMode}
                  onChange={(e) => setSimulationMode(e.target.value)}
                  className="input-field"
                >
                  <option value="simple">Simple (Expected Returns)</option>
                  <option value="monte-carlo">Monte Carlo (1000 Scenarios)</option>
                  <option value="optimistic">Optimistic</option>
                  <option value="pessimistic">Pessimistic</option>
                </select>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInflation}
                    onChange={(e) => setIncludeInflation(e.target.checked)}
                    className="mr-3 w-4 h-4 accent-black dark:accent-white"
                  />
                  <span className="text-sm font-medium text-black dark:text-white">Include Inflation Adjustment</span>
                </label>
                
                {includeInflation && (
                  <div className="ml-7 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                      Inflation Rate: {inflationRate.toFixed(1)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={inflationRate}
                      onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                    />
                  </div>
                )}

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRebalancing}
                    onChange={(e) => setIncludeRebalancing(e.target.checked)}
                    className="mr-3 w-4 h-4 accent-black dark:accent-white"
                  />
                  <span className="text-sm font-medium text-black dark:text-white">Annual Portfolio Rebalancing</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Asset Allocation */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">Asset Allocation</h2>
                <button
                  onClick={normalizeAllocations}
                  className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-black dark:text-white rounded-lg transition font-medium"
                >
                  Normalize to 100%
                </button>
              </div>

              <div className={`mb-4 p-4 rounded-lg ${
                isAllocationValid() 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <p className={`text-sm font-semibold ${
                  isAllocationValid() ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  Total: {getTotalAllocation().toFixed(1)}% {isAllocationValid() ? '✓' : '(must equal 100%)'}
                </p>
              </div>

              {/* Asset Sliders */}
              <div className="space-y-4">
                {Object.entries(allocations).map(([asset, value]) => (
                  <div key={asset}>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-semibold text-black dark:text-white capitalize flex items-center">
                        <span
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: getAssetColor(asset) }}
                        />
                        {asset}
                      </label>
                      <span className="text-sm text-black dark:text-white font-semibold">{value.toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={value}
                      onChange={(e) => handleAllocationChange(asset, e.target.value)}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white"
                      style={{
                        background: `linear-gradient(to right, ${getAssetColor(asset)} 0%, ${getAssetColor(asset)} ${value}%, ${document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} ${value}%, ${document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} 100%)`
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Visual Allocation Pie */}
              <div className="mt-6">
                <div className="h-8 flex rounded-lg overflow-hidden">
                  {Object.entries(allocations).map(([asset, value]) => (
                    value > 0 && (
                      <div
                        key={asset}
                        style={{
                          width: `${value}%`,
                          backgroundColor: getAssetColor(asset)
                        }}
                        className="relative group"
                        title={`${asset}: ${value}%`}
                      />
                    )
                  ))}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3">Quick Presets</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setAllocations({ stocks: 25, bonds: 50, reits: 15, cash: 10 })}
                    className="px-3 py-2 text-sm font-medium bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-lg transition"
                  >
                    Conservative
                  </button>
                  <button
                    onClick={() => setAllocations({ stocks: 50, bonds: 30, reits: 10, cash: 10 })}
                    className="px-3 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-lg transition"
                  >
                    Moderate
                  </button>
                  <button
                    onClick={() => setAllocations({ stocks: 70, bonds: 15, reits: 10, cash: 5 })}
                    className="px-3 py-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg transition"
                  >
                    Aggressive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {activeView === 'results' && simulationResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white">
              <p className="text-blue-100 text-sm font-medium mb-1">Final Value</p>
              <p className="text-3xl font-bold">
                {formatCurrency(simulationResult.finalValue)}
              </p>
            </div>
            
            <div className="card bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
              <p className="text-green-100 text-sm font-medium mb-1">Total Returns</p>
              <p className="text-3xl font-bold">
                {formatCurrency(simulationResult.totalReturns)}
              </p>
            </div>
            
            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white">
              <p className="text-purple-100 text-sm font-medium mb-1">Contributions</p>
              <p className="text-3xl font-bold">
                {formatCurrency(simulationResult.totalContributions)}
              </p>
            </div>
            
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 text-white">
              <p className="text-orange-100 text-sm font-medium mb-1">Avg Annual Return</p>
              <p className="text-3xl font-bold">
                {formatPercent(simulationResult.averageAnnualReturn)}
              </p>
            </div>
          </div>

          {/* Statistics (Monte Carlo) */}
          {simulationResult.statistics && simulationMode === 'monte-carlo' && (
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Monte Carlo Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Best Case (95th %)</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(simulationResult.statistics.bestCaseValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Median</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(simulationResult.statistics.medianValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Worst Case (5th %)</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(simulationResult.statistics.worstCaseValue)}
                  </p>
                </div>
              </div>
              {simulationResult.statistics.probabilityOfSuccess && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <span className="font-semibold">Success Probability:</span> {' '}
                    {simulationResult.statistics.probabilityOfSuccess.toFixed(1)}% chance of doubling your investment
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Yearly Projections Chart */}
          {simulationResult.yearlyProjections && simulationResult.yearlyProjections.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Growth Projection</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Year</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Portfolio Value</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Contributions</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Returns</th>
                      {includeInflation && (
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Real Value</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {simulationResult.yearlyProjections.map((projection) => (
                      <tr key={projection.year} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-4 py-3 text-sm font-medium text-black dark:text-white">{projection.year}</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-black dark:text-white">
                          {formatCurrency(projection.portfolioValue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                          {formatCurrency(projection.contributions)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(projection.returns)}
                        </td>
                        {includeInflation && (
                          <td className="px-4 py-3 text-sm text-right text-blue-600 dark:text-blue-400">
                            {formatCurrency(projection.realValue)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={addToComparison}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Comparison
            </button>
            <button
              onClick={() => setActiveView('inputs')}
              className="btn-outline"
            >
              Modify Parameters
            </button>
            <button
              onClick={() => setActiveView('comparison')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
            >
              View All Scenarios ({scenarios.length})
            </button>
          </div>
        </div>
      )}

      {/* Comparison View */}
      {activeView === 'comparison' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">Scenario Comparison</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Compare different investment strategies side by side
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('inputs')}
                className="px-4 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition"
              >
                + Add New Scenario
              </button>
              <button
                onClick={() => setScenarios([])}
                className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg font-medium transition"
                disabled={scenarios.length === 0}
              >
                Clear All
              </button>
            </div>
          </div>

          {scenarios.length === 0 ? (
            <div className="card bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium text-lg">No scenarios to compare yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">Start by configuring your first investment scenario</p>
              <button
                onClick={() => setActiveView('inputs')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create First Scenario
              </button>
            </div>
          ) : (
            <>
              {/* Summary Comparison */}
              <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4">Comparison Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Outcome</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(Math.max(...scenarios.map(s => s.result.finalValue)))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(scenarios.reduce((sum, s) => sum + s.result.finalValue, 0) / scenarios.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conservative</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(Math.min(...scenarios.map(s => s.result.finalValue)))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Individual Scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenarios.map((scenario, index) => (
                  <div key={index} className="card relative group hover:shadow-xl transition-all">
                    <button
                      onClick={() => setScenarios(scenarios.filter((_, i) => i !== index))}
                      className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove scenario"
                    >
                      ✕
                    </button>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-green-500' : 
                        index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <h3 className="font-bold text-black dark:text-white">{scenario.name}</h3>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Initial:</span>
                        <span>{formatCurrency(scenario.params.initialInvestment)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Monthly:</span>
                        <span>{formatCurrency(scenario.params.monthlyContribution)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Time:</span>
                        <span>{scenario.params.timeHorizon} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Mode:</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{scenario.params.mode}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Final Portfolio Value</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(scenario.result.finalValue)}
                        </p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Returns:</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          +{formatCurrency(scenario.result.totalReturns)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">ROI:</span>
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          {((scenario.result.totalReturns / scenario.result.totalContributions) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* What-If Analysis View */}
      {activeView === 'whatif' && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white mb-2">What-If Analysis</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  See how changing one parameter affects your investment outcomes. Compare multiple values side-by-side to find the optimal strategy.
                </p>
              </div>
            </div>
          </div>

          {/* Parameter Selection */}
          <div className="card">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Select Parameter to Analyze</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => setWhatIfParameter('initialInvestment')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  whatIfParameter === 'initialInvestment'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold text-black dark:text-white">Initial Investment</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: {formatCurrency(initialInvestment)}</div>
              </button>
              <button
                onClick={() => setWhatIfParameter('monthlyContribution')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  whatIfParameter === 'monthlyContribution'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                }`}
              >
                <div className="text-2xl mb-2">📅</div>
                <div className="font-semibold text-black dark:text-white">Monthly Contribution</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: {formatCurrency(monthlyContribution)}</div>
              </button>
              <button
                onClick={() => setWhatIfParameter('timeHorizon')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  whatIfParameter === 'timeHorizon'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                }`}
              >
                <div className="text-2xl mb-2">⏰</div>
                <div className="font-semibold text-black dark:text-white">Time Horizon</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: {timeHorizon} years</div>
              </button>
              <button
                onClick={() => setWhatIfParameter('allocations')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  whatIfParameter === 'allocations'
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700'
                }`}
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="font-semibold text-black dark:text-white">Stock Allocation</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current: {allocations.stocks}%</div>
              </button>
            </div>
          </div>

          {/* Results Chart */}
          {whatIfLoading ? (
            <div className="card text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Analyzing scenarios...</p>
            </div>
          ) : whatIfResults.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                Impact Analysis: {whatIfParameter === 'initialInvestment' ? 'Initial Investment' : 
                                  whatIfParameter === 'monthlyContribution' ? 'Monthly Contribution' :
                                  whatIfParameter === 'timeHorizon' ? 'Time Horizon' : 'Stock Allocation'}
              </h3>
              
              {/* Visual Bar Chart */}
              <div className="space-y-3 mb-6">
                {whatIfResults.map((item, index) => {
                  const maxValue = Math.max(...whatIfResults.map(r => r.result.finalValue));
                  const percentage = (item.result.finalValue / maxValue) * 100;
                  const isCurrent = 
                    (whatIfParameter === 'initialInvestment' && item.value === initialInvestment) ||
                    (whatIfParameter === 'monthlyContribution' && item.value === monthlyContribution) ||
                    (whatIfParameter === 'timeHorizon' && item.value === timeHorizon) ||
                    (whatIfParameter === 'allocations' && item.value === allocations.stocks);

                  return (
                    <div key={index} className={`p-3 rounded-lg ${isCurrent ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500' : 'bg-gray-50 dark:bg-gray-800'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black dark:text-white">
                            {whatIfParameter === 'allocations' ? `${item.value}% Stocks` :
                             whatIfParameter === 'timeHorizon' ? `${item.value} Years` :
                             formatCurrency(item.value)}
                          </span>
                          {isCurrent && <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Current</span>}
                        </div>
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                          {formatCurrency(item.result.finalValue)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCurrent ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                        <span>Returns: {formatCurrency(item.result.totalReturns)}</span>
                        <span>ROI: {((item.result.totalReturns / item.result.totalContributions) * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Outcome</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(Math.max(...whatIfResults.map(r => r.result.finalValue)))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {(() => {
                      const maxValue = Math.max(...whatIfResults.map(r => r.result.finalValue));
                      const bestResult = whatIfResults.find(r => r.result.finalValue === maxValue);
                      if (!bestResult) return 'N/A';
                      
                      if (whatIfParameter === 'allocations') {
                        return `${bestResult.value}% Stocks`;
                      } else if (whatIfParameter === 'timeHorizon') {
                        return `${bestResult.value} Years`;
                      } else {
                        return formatCurrency(bestResult.value);
                      }
                    })()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(whatIfResults.reduce((sum, r) => sum + r.result.finalValue, 0) / whatIfResults.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variance</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(Math.max(...whatIfResults.map(r => r.result.finalValue)) - Math.min(...whatIfResults.map(r => r.result.finalValue)))}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Range of outcomes</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Goal Planning View */}
      {activeView === 'goals' && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white mb-2">Goal-Based Planning</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set your financial target and discover exactly what you need to invest to reach your goal. Get personalized recommendations based on your timeline.
                </p>
              </div>
            </div>
          </div>

          {/* Goal Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-bold text-black dark:text-white mb-4">Your Financial Goal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Target Amount
                  </label>
                  <div className="flex gap-2">
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(goalAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="5000000"
                    step="50000"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(parseInt(e.target.value))}
                    className="w-full mt-2 accent-green-600 dark:accent-green-400"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setGoalAmount(500000)} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700">$500K</button>
                    <button onClick={() => setGoalAmount(1000000)} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700">$1M</button>
                    <button onClick={() => setGoalAmount(2000000)} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700">$2M</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Time to Goal
                  </label>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {goalTimeframe} Years
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={goalTimeframe}
                    onChange={(e) => setGoalTimeframe(parseInt(e.target.value))}
                    className="w-full mt-2 accent-blue-600 dark:accent-blue-400"
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Current Initial Investment:</span>
                      <span className="font-semibold text-black dark:text-white">{formatCurrency(initialInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Monthly Contribution:</span>
                      <span className="font-semibold text-black dark:text-white">{formatCurrency(monthlyContribution)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Analysis */}
            {goalResults && (
              <div className="card">
                <h3 className="text-lg font-bold text-black dark:text-white mb-4">Path to Your Goal</h3>
                
                {/* Progress Circle */}
                <div className="text-center mb-6">
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200 dark:text-gray-700" />
                      <circle 
                        cx="64" 
                        cy="64" 
                        r="56" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        fill="none" 
                        className={goalResults.onTrack ? "text-green-500" : "text-orange-500"}
                        strokeDasharray={`${Math.min(goalResults.percentToGoal, 100) * 3.51} 351`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <div className={`text-2xl font-bold ${goalResults.onTrack ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {Math.min(goalResults.percentToGoal, 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">to goal</div>
                    </div>
                  </div>
                </div>

                {goalResults.onTrack ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-bold text-green-800 dark:text-green-300">On Track!</span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      You're projected to reach <strong>{formatCurrency(goalResults.projectedValue)}</strong> in {goalTimeframe} years, 
                      exceeding your goal by <strong>{formatCurrency(Math.abs(goalResults.shortfall))}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-bold text-orange-800 dark:text-orange-300">Shortfall Detected</span>
                    </div>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Currently projected: <strong>{formatCurrency(goalResults.projectedValue)}</strong>
                      <br/>You're <strong>{formatCurrency(goalResults.shortfall)}</strong> short of your goal
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-black dark:text-white">Recommended Actions:</h4>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">💰</div>
                      <div>
                        <div className="font-semibold text-black dark:text-white mb-1">Required Monthly Investment</div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {formatCurrency(goalResults.requiredMonthly)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {goalResults.requiredMonthly > monthlyContribution 
                            ? `Increase by ${formatCurrency(goalResults.requiredMonthly - monthlyContribution)}/month`
                            : "You're contributing enough! Consider saving the extra."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total to Invest</div>
                      <div className="font-bold text-black dark:text-white">
                        {formatCurrency(initialInvestment + (goalResults.requiredMonthly * goalTimeframe * 12))}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expected Returns</div>
                      <div className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(goalAmount - (initialInvestment + (goalResults.requiredMonthly * goalTimeframe * 12)))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setMonthlyContribution(Math.ceil(goalResults.requiredMonthly));
                      setTimeHorizon(goalTimeframe);
                      setActiveView('inputs');
                    }}
                    className="w-full btn-primary mt-4"
                  >
                    Apply These Settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Alternative Paths */}
          <div className="card">
            <h3 className="text-lg font-bold text-black dark:text-white mb-4">Alternative Paths to Your Goal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Aggressive', years: Math.max(5, goalTimeframe - 5), emoji: '🚀' },
                { label: 'Moderate', years: goalTimeframe, emoji: '⚖️' },
                { label: 'Conservative', years: goalTimeframe + 5, emoji: '🛡️' }
              ].map((plan, idx) => {
                const monthlyRate = 0.08 / 12;
                const months = plan.years * 12;
                const futureValueOfInitial = initialInvestment * Math.pow(1 + monthlyRate, months);
                const remainingNeeded = goalAmount - futureValueOfInitial;
                const requiredMonthly = Math.max(0, remainingNeeded * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1));

                return (
                  <div key={idx} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer">
                    <div className="text-3xl mb-2">{plan.emoji}</div>
                    <div className="font-bold text-black dark:text-white mb-2">{plan.label} Plan</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                      <div className="flex justify-between">
                        <span>Timeline:</span>
                        <span className="font-semibold text-black dark:text-white">{plan.years} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(requiredMonthly)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Invested:</span>
                        <span className="font-semibold text-black dark:text-white">{formatCurrency(initialInvestment + (requiredMonthly * months))}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-black border-t-transparent dark:border-t-transparent"></div>
          Calculating...
        </div>
      )}
    </div>
  );
};

export default InvestmentSimulator;
