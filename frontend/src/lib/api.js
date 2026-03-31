import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.biashara.co.ke' : 'http://localhost:3001') + '/api',
  timeout: 30000,
  withCredentials: false,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
}, err => Promise.reject(err))

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    const message = err.response?.data?.error || err.message || 'Request failed'
    return Promise.reject({ error: message, status: err.response?.status })
  }
)

export default api
