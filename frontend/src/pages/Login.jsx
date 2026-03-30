import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import toast from 'react-hot-toast'
export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('token', res.token)
      setAuth(res.token, res.user, res.tenant)
      navigate('/')
    } catch (err) { toast.error(err.error || 'Login failed') }
    finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3"><span className="text-white font-bold text-xl">B</span></div>
          <h1 className="text-2xl font-bold text-gray-900">BiasharaOS</h1>
          <p className="text-gray-500 text-sm mt-1">Kenya's all-in-one business platform</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Email</label><input className="input" type="email" required placeholder="you@business.co.ke" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><label className="label">Password</label><input className="input" type="password" required placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">No account? <Link to="/register" className="text-blue-600 hover:underline font-medium">Register your business</Link></p>
      </div>
    </div>
  )
}
