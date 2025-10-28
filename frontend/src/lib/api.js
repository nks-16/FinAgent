import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const client = axios.create({ baseURL })
const javaBaseURL = import.meta.env.VITE_JAVA_BASE_URL || 'http://localhost:8080'
const clientJava = axios.create({ baseURL: javaBaseURL })

export function setToken(token){
  client.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : ''
}

export const api = {
  health: () => client.get('/health').then(r=>r.data),
  signup: (data) => client.post('/auth/signup', data).then(r=>r.data),
  login: (data) => client.post('/auth/login', data).then(r=>r.data),
  stats: () => client.get('/collections/stats').then(r=>r.data),
  reset: () => client.post('/collections/reset').then(r=>r.data),
  query: (query) => client.post('/query', { query }).then(r=>r.data),
  chat: (prompt) => client.post('/chat', { prompt }).then(r=>r.data),
  
  // Conversation management
  chatWithSession: (query, sessionId = null) => {
    const payload = { query }
    if (sessionId) payload.session_id = sessionId
    return client.post('/chat', payload).then(r => r.data)
  },
  getConversations: (limit = 50, activeOnly = false) => {
    return client.get('/conversations', { params: { limit, active_only: activeOnly } }).then(r => r.data)
  },
  getConversationMessages: (sessionId) => {
    return client.get(`/conversations/${sessionId}`).then(r => r.data)
  },
  createNewConversation: (title = 'New Conversation') => {
    return client.post('/conversations/new', { title }).then(r => r.data)
  },
  deleteConversation: (sessionId) => {
    return client.delete(`/conversations/${sessionId}`).then(r => r.data)
  },
  archiveConversation: (sessionId) => {
    return client.post(`/conversations/${sessionId}/archive`).then(r => r.data)
  },
  
  // Financial Profile
  getProfile: () => client.get('/financial/profile').then(r => r.data),
  updateProfile: (data) => client.put('/financial/profile', data).then(r => r.data),
  
  // Accounts
  getAccounts: (activeOnly = true) => client.get('/financial/accounts', { params: { active_only: activeOnly } }).then(r => r.data),
  getAccount: (id) => client.get(`/financial/accounts/${id}`).then(r => r.data),
  createAccount: (data) => client.post('/financial/accounts', data).then(r => r.data),
  updateAccount: (id, data) => client.put(`/financial/accounts/${id}`, data).then(r => r.data),
  deleteAccount: (id) => client.delete(`/financial/accounts/${id}`).then(r => r.data),
  
  // Transactions
  getTransactions: (accountId = null, transactionType = null, limit = 100) => {
    const params = { limit }
    if (accountId) params.account_id = accountId
    if (transactionType) params.transaction_type = transactionType
    return client.get('/financial/transactions', { params }).then(r => r.data)
  },
  createTransaction: (data) => client.post('/financial/transactions', data).then(r => r.data),
  updateTransaction: (id, data) => client.put(`/financial/transactions/${id}`, data).then(r => r.data),
  deleteTransaction: (id) => client.delete(`/financial/transactions/${id}`).then(r => r.data),
  
  // Budgets
  getBudgets: (month = null, year = null) => {
    const params = {}
    if (month) params.month = month
    if (year) params.year = year
    return client.get('/financial/budgets', { params }).then(r => r.data)
  },
  createBudget: (data) => client.post('/financial/budgets', data).then(r => r.data),
  updateBudget: (id, data) => client.put(`/financial/budgets/${id}`, data).then(r => r.data),
  
  // Financial Goals
  getGoals: (activeOnly = false) => client.get('/financial/goals', { params: { active_only: activeOnly } }).then(r => r.data),
  createGoal: (data) => client.post('/financial/goals', data).then(r => r.data),
  updateGoal: (id, data) => client.put(`/financial/goals/${id}`, data).then(r => r.data),
  deleteGoal: (id) => client.delete(`/financial/goals/${id}`).then(r => r.data),
  
  // Debts
  getDebts: (activeOnly = false) => client.get('/financial/debts', { params: { active_only: activeOnly } }).then(r => r.data),
  createDebt: (data) => client.post('/financial/debts', data).then(r => r.data),
  updateDebt: (id, data) => client.put(`/financial/debts/${id}`, data).then(r => r.data),
  deleteDebt: (id) => client.delete(`/financial/debts/${id}`).then(r => r.data),
  
  // Investments
  getInvestments: () => client.get('/financial/investments').then(r => r.data),
  createInvestment: (data) => client.post('/financial/investments', data).then(r => r.data),
  updateInvestment: (id, data) => client.put(`/financial/investments/${id}`, data).then(r => r.data),
  deleteInvestment: (id) => client.delete(`/financial/investments/${id}`).then(r => r.data),
  
  // Analytics & Summary
  getFinancialSummary: () => client.get('/financial/summary').then(r => r.data),
  getSpendingByCategory: (startDate = null, endDate = null) => {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    return client.get('/financial/spending-by-category', { params }).then(r => r.data)
  },
  getIncomeVsExpenses: (months = 6) => client.get('/financial/income-vs-expenses', { params: { months } }).then(r => r.data),
  
  recommendations: (data) => client.post('/recommendations', data).then(r=>r.data),
  ingest: (file) => {
    const form = new FormData(); form.append('file', file)
    return client.post('/ingest', form, { headers: { 'Content-Type':'multipart/form-data' } }).then(r=>r.data)
  },
  anomalyFile: (file) => {
    const form = new FormData(); form.append('file', file)
    return client.post('/anomaly/detect', form, { headers: { 'Content-Type':'multipart/form-data' } }).then(r=>r.data)
  },
  anomalyJson: (records, opts={}) => {
    const payload = { records, contamination: opts.contamination || 0.05, top_k: opts.top_k || 10, explain: opts.explain || false }
    return client.post('/anomaly/detect-json', payload).then(r=>r.data)
  },
  anomalyStatus: () => client.get('/anomaly/status').then(r=>r.data)
}

export const apiJava = {
  systemHealth: () => clientJava.get('/system/health').then(r=>r.data),
  exportCsv: (payload) => clientJava.post('/export/csv', payload, { responseType: 'blob' })
}
