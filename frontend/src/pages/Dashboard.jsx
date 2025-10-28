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
  
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
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
      const month = t.transaction_date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { income: 0, expenses: 0 };
      if (t.transaction_type === 'income') monthMap[month].income += t.amount;
      else monthMap[month].expenses += t.amount;
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
    if (!confirm('⚠️ Are you sure? Deleting this account cannot be undone.')) return;
    try {
      await api.deleteAccount(id);
      await loadAllData();
      showToast('✅ Account deleted.', 'success');
    } catch (error) {
      showToast('⚠️ We couldn\'t delete this account right now. Please try again in a moment.', 'error');
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!confirm('⚠️ Are you sure? This transaction will be permanently deleted.')) return;
    try {
      await api.deleteTransaction(id);
      await loadAllData();
      showToast('✅ Transaction deleted.', 'success');
    } catch (error) {
      showToast('⚠️ We couldn\'t delete this transaction right now. Please try again in a moment.', 'error');
    }
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
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">FinAgent Dashboard</h1>
              <div className="flex gap-2">
                <a href="/chat" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Chat
                </a>
                <a href="/anomaly" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  Anomaly
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {profile?.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span>{profile?.full_name || 'Profile'}</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Balance</p>
                <h3 className="text-3xl font-bold mt-1">${summary?.total_balance?.toFixed(2) || '0.00'}</h3>
              </div>
              <Wallet className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-blue-100 text-xs">{accounts.length} accounts</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Income</p>
                <h3 className="text-3xl font-bold mt-1">${summary?.total_income?.toFixed(2) || '0.00'}</h3>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-green-100 text-xs">This period</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                <h3 className="text-3xl font-bold mt-1">${summary?.total_expenses?.toFixed(2) || '0.00'}</h3>
              </div>
              <TrendingDown className="w-10 h-10 opacity-80" />
            </div>
            <p className="text-red-100 text-xs">This period</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-purple-100 text-sm font-medium">Active Goals</p>
                <h3 className="text-3xl font-bold mt-1">{goals.filter(g => g.status === 'active').length}</h3>
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
    </div>
  );
}
