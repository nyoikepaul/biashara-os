import axios from 'axios'
 
const API_URL = import.meta.env.VITE_API_URL || '/api'
 
function getToken() {
  try {
    const direct = localStorage.getItem('token')
    if (direct && direct !== 'null' && direct !== 'undefined') return direct
    const stored = localStorage.getItem('biashara-auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      const token = parsed?.state?.token
      if (token && token !== 'null') return token
    }
  } catch {}
  return null
}
 
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "ngrok-skip-browser-warning": "69420", 'Content-Type': 'application/json' }
})
 
api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
}, err => Promise.reject(err))
 
api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('biashara-auth')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err.response?.data || { error: err.message || 'Network Error' })
  }
)
 
export default api
