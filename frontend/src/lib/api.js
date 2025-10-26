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
  ingest: (file) => {
    const form = new FormData(); form.append('file', file)
    return client.post('/ingest', form, { headers: { 'Content-Type':'multipart/form-data' } }).then(r=>r.data)
  },
  anomalyFile: (file) => {
    const form = new FormData(); form.append('file', file)
    return client.post('/anomaly/detect', form, { headers: { 'Content-Type':'multipart/form-data' } }).then(r=>r.data)
  },
  anomalyJson: (records, opts={}) => {
    const payload = { records, ...opts }
    return client.post('/anomaly/detect', payload).then(r=>r.data)
  },
  anomalyStatus: () => client.get('/anomaly/status').then(r=>r.data)
}

export const apiJava = {
  systemHealth: () => clientJava.get('/system/health').then(r=>r.data),
  exportCsv: (payload) => clientJava.post('/export/csv', payload, { responseType: 'blob' })
}
