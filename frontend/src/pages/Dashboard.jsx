import React, { useEffect, useState } from 'react';
import { api, setToken } from '../lib/api';
import { 
  User, LogOut, Wallet, TrendingUp, TrendingDown, 
  Plus, Trash2, Camera, X, DollarSign, Target, 
  CreditCard, PieChart as PieChartIcon, BarChart3
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer
} from 'recharts';
import NewsSection from '../components/NewsSection';
import InvestmentRecommendations from '../components/InvestmentRecommendations';
import InvestmentSimulator from '../components/InvestmentSimulator';
import AIInsights from '../components/AIInsights';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function Dashboard({ token, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categorySpending, setCategorySpending] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'news', 'investments', or 'simulator'
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });
  
  const [profileForm, setProfileForm] = useState({
    full_name: '', email: '', phone: '', profile_photo_url: ''
  });
  const [accountForm, setAccountForm] = useState({
    name: '', account_type: 'checking', balance: 0, currency: 'USD'
  });
  const [transactionForm, setTransactionForm] = useState({
    account_id: '', transaction_type: 'expense', amount: 0, 
    category: 'groceries', description: '', date: new Date().toISOString().split('T')[0]
  });
  const [goalForm, setGoalForm] = useState({
    name: '', goal_type: 'emergency_fund', target_amount: 0, 
    current_amount: 0, target_date: '', monthly_contribution: 0, 
    priority: 1, notes: ''
  });

  useEffect(() => {
    setToken(token);
    loadAllData();
  }, [token]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmModal.onConfirm) {
      confirmModal.onConfirm();
    }
    setConfirmModal({ show: false, message: '', onConfirm: null });
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ show: false, message: '', onConfirm: null });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, accountsRes, transactionsRes, budgetsRes, goalsRes, summaryRes] = 
        await Promise.all([
          api.getProfile().catch(() => null),
          api.getAccounts().catch(() => []),
          api.getTransactions().catch(() => []),
          api.getBudgets().catch(() => []),
          api.getGoals().catch(() => []),
          api.getFinancialSummary().catch(() => null)
        ]);
      
      setProfile(profileRes);
      setAccounts(accountsRes);
      setTransactions(transactionsRes);
      setBudgets(budgetsRes);
      setGoals(goalsRes);
      setSummary(summaryRes);
      
      if (profileRes) {
        setProfileForm({
          full_name: profileRes.full_name || '',
          email: profileRes.email || '',
          phone: profileRes.phone || '',
          profile_photo_url: profileRes.profile_photo_url || ''
        });
      }
      
      processChartData(transactionsRes);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('⚠️ Having trouble loading your data. Please refresh the page or check your internet connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (txns) => {
    const categoryMap = {};
    txns.filter(t => t.transaction_type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    const catData = Object.entries(categoryMap).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value: parseFloat(value.toFixed(2))
    }));
    setCategorySpending(catData);

    const monthMap = {};
    txns.forEach(t => {
      // Use 'date' field instead of 'transaction_date'
      const dateStr = t.date || t.transaction_date;
      if (dateStr) {
        const month = dateStr.substring(0, 7);
        if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
        if (t.transaction_type === 'income') monthMap[month].income += t.amount;
        else monthMap[month].expenses += t.amount;
      }
    });
    const trendData = Object.entries(monthMap)
      .sort()
      .slice(-6)
      .map(([month, data]) => ({
        month,
        income: parseFloat(data.income.toFixed(2)),
        expenses: parseFloat(data.expenses.toFixed(2))
      }));
    setMonthlyTrends(trendData);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm({ ...profileForm, profile_photo_url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateProfile(profileForm);
      await loadAllData();
      setShowProfileModal(false);
      showToast('✅ Success! Your profile has been updated.', 'success');
    } catch (error) {
      showToast('⚠️ Oops! We couldn\'t save your profile changes. Please check your internet connection and try again.', 'error');
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      await api.createAccount(accountForm);
      await loadAllData();
      setShowAccountModal(false);
      setAccountForm({ name: '', account_type: 'checking', balance: 0, currency: 'USD' });
      showToast('✅ Great! Your new account has been created.', 'success');
    } catch (error) {
      console.error('Account creation error:', error);
      let errorMsg = '⚠️ We couldn\'t create your account. ';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Validation errors
          const fields = detail.map(e => e.loc?.[1] || e.loc?.[0]).filter(Boolean).join(', ');
          errorMsg += `Please check: ${fields}`;
        } else if (typeof detail === 'string') {
          errorMsg += detail;
        } else {
          errorMsg += 'Please check your details and try again.';
        }
      } else if (!accountForm.name) {
        errorMsg += 'Please enter an account name.';
      } else {
        errorMsg += 'Please check your details and try again.';
      }
      
      showToast(errorMsg, 'error');
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...transactionForm, 
        account_id: parseInt(transactionForm.account_id),
        date: transactionForm.date + 'T00:00:00Z' // Convert to ISO datetime
      };
      console.log('Sending transaction payload:', payload);
      
      await api.createTransaction(payload);
      await loadAllData();
      setShowTransactionModal(false);
      setTransactionForm({
        account_id: '', transaction_type: 'expense', amount: 0,
        category: 'groceries', description: '', date: new Date().toISOString().split('T')[0]
      });
      showToast('✅ Done! Your transaction has been recorded.', 'success');
    } catch (error) {
      console.error('Transaction error:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMsg = '⚠️ We couldn\'t save this transaction. ';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Validation errors - show specific fields
          const fieldErrors = detail.map(err => {
            const field = err.loc?.[1] || err.loc?.[0];
            const msg = err.msg || '';
            return `${field}: ${msg}`;
          }).join(', ');
          errorMsg += `Issues found: ${fieldErrors}`;
        } else if (typeof detail === 'string') {
          errorMsg += detail;
        } else {
          errorMsg += 'Please check your details and try again.';
        }
      } else if (!transactionForm.account_id) {
        errorMsg += 'Please select an account first.';
      } else if (transactionForm.amount <= 0) {
        errorMsg += 'Amount must be greater than zero.';
      } else if (!transactionForm.date) {
        errorMsg += 'Please enter a valid date.';
      } else {
        errorMsg += 'Please check your details and try again.';
      }
      
      showToast(errorMsg, 'error');
    }
  };

  const handleDeleteAccount = async (id) => {
    showConfirm(
      '⚠️ Are you sure? Deleting this account cannot be undone.',
      async () => {
        try {
          await api.deleteAccount(id);
          await loadAllData();
          showToast('✅ Account deleted.', 'success');
        } catch (error) {
          showToast('⚠️ We couldn\'t delete this account right now. Please try again in a moment.', 'error');
        }
      }
    );
  };

  const handleDeleteTransaction = async (id) => {
    showConfirm(
      '⚠️ Are you sure? This transaction will be permanently deleted.',
      async () => {
        try {
          await api.deleteTransaction(id);
          await loadAllData();
          showToast('✅ Transaction deleted.', 'success');
        } catch (error) {
          showToast('⚠️ We couldn\'t delete this transaction right now. Please try again in a moment.', 'error');
        }
      }
    );
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...goalForm,
        target_amount: parseFloat(goalForm.target_amount),
        current_amount: parseFloat(goalForm.current_amount),
        monthly_contribution: parseFloat(goalForm.monthly_contribution),
        priority: parseInt(goalForm.priority),
        target_date: goalForm.target_date ? goalForm.target_date + 'T00:00:00Z' : null
      };
      
      await api.createGoal(payload);
      await loadAllData();
      setShowGoalModal(false);
      setGoalForm({
        name: '', goal_type: 'emergency_fund', target_amount: 0,
        current_amount: 0, target_date: '', monthly_contribution: 0,
        priority: 1, notes: ''
      });
      showToast('✅ Great! Your financial goal has been created.', 'success');
    } catch (error) {
      console.error('Failed to create goal:', error);
      showToast('⚠️ We couldn\'t create this goal. Please check all fields and try again.', 'error');
    }
  };

  const handleDeleteGoal = async (id) => {
    showConfirm(
      '⚠️ Are you sure? This goal will be permanently deleted.',
      async () => {
        try {
          await api.deleteGoal(id);
          await loadAllData();
          showToast('✅ Goal deleted.', 'success');
        } catch (error) {
          showToast('⚠️ We couldn\'t delete this goal right now. Please try again in a moment.', 'error');
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FinAgent Dashboard</h1>
            
            {/* Main Navigation */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeView === 'dashboard' 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('news')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeView === 'news' 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                News
              </button>
              <button
                onClick={() => setActiveView('investments')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeView === 'investments' 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Recommendations
              </button>
              <button
                onClick={() => setActiveView('ai')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeView === 'ai' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg scale-105' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:scale-102'
                }`}
              >
                AI Insights
              </button>
              <button
                onClick={() => setActiveView('simulator')}
                className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  activeView === 'simulator' 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Simulator
              </button>
              <a 
                href="/chat" 
                className="px-5 py-2.5 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
              >
                Chat
              </a>
            </div>
            
            {/* User Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
              >
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">{profile?.full_name || 'Profile'}</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'news' ? (
          /* Financial News Section */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Financial News & Market Insights</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Personalized financial news based on your spending categories and real-time market data
              </p>
            </div>
            <NewsSection userCategories={categorySpending.map(cat => cat.name)} />
          </div>
        ) : activeView === 'investments' ? (
          /* Investment Recommendations Section */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personalized Investment Recommendations</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Get diversified investment ideas tailored to your financial profile and risk tolerance
              </p>
            </div>
            <InvestmentRecommendations userProfile={profile} />
          </div>
        ) : activeView === 'simulator' ? (
          /* Investment Simulator Section */
          <div>
            <InvestmentSimulator />
          </div>
        ) : activeView === 'ai' ? (
          /* AI Insights Section */
          <div>
            <AIInsights />
          </div>
        ) : (
          /* Dashboard View */
          <>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Balance</p>
                <h3 className="text-3xl font-bold mt-1">${summary?.total_assets?.toFixed(2) || '0.00'}</h3>
              </div>
              <Wallet className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-blue-100 text-xs">{accounts.length} accounts</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Income</p>
                <h3 className="text-3xl font-bold mt-1">${summary?.total_income_this_month?.toFixed(2) || '0.00'}</h3>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-green-100 text-xs">This period</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <h3 className="text-3xl font-bold mt-1">${summary?.total_expenses_this_month?.toFixed(2) || '0.00'}</h3>
              </div>
              <TrendingDown className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-red-100 text-xs">This period</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Goals</p>
                <h3 className="text-3xl font-bold mt-1">{summary?.active_goals_count || 0}</h3>
              </div>
              <Target className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-purple-100 text-xs">{goals.length} total goals</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-500" />
                Spending by Category
              </h2>
            </div>
            {categorySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                No spending data available
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-500" />
                Income vs Expenses (Last 6 Months)
              </h2>
            </div>
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                  <XAxis dataKey="month" tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
                  <YAxis tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400 dark:text-gray-600">
                No transaction data available
              </div>
            )}
          </div>
        </div>

        {/* Accounts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-blue-500" />
              Your Accounts
            </h2>
            <button
              onClick={() => setShowAccountModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => (
              <div key={account.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.account_type}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {account.currency} ${account.balance.toFixed(2)}
                </p>
              </div>
            ))}
            {accounts.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-600">
                No accounts yet. Add your first account to get started!
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-500" />
              Recent Transactions
            </h2>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
              disabled={accounts.length === 0}
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.slice(0, 10).map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{txn.transaction_date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        txn.transaction_type === 'income' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">{txn.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{txn.description}</td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      txn.transaction_type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {txn.transaction_type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => handleDeleteTransaction(txn.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-400 dark:text-gray-600">
                      No transactions yet. Add your first transaction!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Financial Goals
            </h2>
            <button
              onClick={() => setShowGoalModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map(goal => {
              const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
              return (
                <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{goal.goal_type.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="text-gray-900 dark:text-white font-medium">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${goal.current_amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${goal.target_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  {goal.target_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
            {goals.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-600">
                No goals yet. Create your first financial goal!
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                <button onClick={() => setShowProfileModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleProfileUpdate}>
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative">
                    {profileForm.profile_photo_url ? (
                      <img src={profileForm.profile_photo_url} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-500" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-300 dark:border-gray-600">
                        <User className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
                      <Camera className="w-5 h-5" />
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="flex-1 px-4 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Account</h2>
                <button onClick={() => setShowAccountModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateAccount}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Name</label>
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Type</label>
                    <select
                      value={accountForm.account_type}
                      onChange={(e) => setAccountForm({ ...accountForm, account_type: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="investment">Investment</option>
                      <option value="loan">Loan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Balance</label>
                    <input
                      type="number"
                      step="0.01"
                      value={accountForm.balance}
                      onChange={(e) => setAccountForm({ ...accountForm, balance: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                    <select
                      value={accountForm.currency}
                      onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(false)}
                    className="flex-1 px-4 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Transaction</h2>
                <button onClick={() => setShowTransactionModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateTransaction}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account</label>
                    <select
                      value={transactionForm.account_id}
                      onChange={(e) => setTransactionForm({ ...transactionForm, account_id: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                    <select
                      value={transactionForm.transaction_type}
                      onChange={(e) => setTransactionForm({ ...transactionForm, transaction_type: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={transactionForm.category}
                      onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <optgroup label="Income">
                        <option value="salary">Salary</option>
                        <option value="bonus">Bonus</option>
                        <option value="freelance">Freelance</option>
                        <option value="investment_income">Investment Income</option>
                        <option value="other_income">Other Income</option>
                      </optgroup>
                      <optgroup label="Expenses">
                        <option value="groceries">Groceries</option>
                        <option value="dining">Dining</option>
                        <option value="transportation">Transportation</option>
                        <option value="utilities">Utilities</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="entertainment">Entertainment</option>
                        <option value="shopping">Shopping</option>
                        <option value="housing">Housing</option>
                        <option value="education">Education</option>
                        <option value="insurance">Insurance</option>
                        <option value="personal">Personal</option>
                        <option value="other_expense">Other Expense</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionForm.amount}
                      onChange={(e) => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <input
                      type="text"
                      value={transactionForm.description}
                      onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="flex-1 px-4 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                  >
                    Add Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Financial Goal</h2>
                <button onClick={() => setShowGoalModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Name *</label>
                  <input
                    type="text"
                    value={goalForm.name}
                    onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Emergency Fund"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Type *</label>
                  <select
                    value={goalForm.goal_type}
                    onChange={(e) => setGoalForm({ ...goalForm, goal_type: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="emergency_fund">Emergency Fund</option>
                    <option value="retirement">Retirement</option>
                    <option value="home_purchase">Home Purchase</option>
                    <option value="education">Education</option>
                    <option value="vacation">Vacation</option>
                    <option value="debt_free">Debt Free</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.target_amount}
                      onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="10000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.current_amount}
                      onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monthly Contribution</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goalForm.monthly_contribution}
                      onChange={(e) => setGoalForm({ ...goalForm, monthly_contribution: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority (1-3)</label>
                    <select
                      value={goalForm.priority}
                      onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                      className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="1">High (1)</option>
                      <option value="2">Medium (2)</option>
                      <option value="3">Low (3)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={goalForm.notes}
                    onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    rows="3"
                    placeholder="Additional notes about this goal..."
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowGoalModal(false)}
                    className="flex-1 px-4 py-2 border dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`rounded-lg shadow-2xl p-4 pr-10 max-w-md ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast({ show: false, message: '', type: '' })}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full animate-slide-up">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Confirm Action
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelConfirm}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
