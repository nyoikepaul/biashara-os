import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store'
import api from '../lib/api'
import toast from 'react-hot-toast'
const PLANS = [
  { id: 'STARTER', label: 'Starter', price: 'KES 2,500/mo', desc: '1 module' },
  { id: 'BUSINESS', label: 'Business', price: 'KES 5,500/mo', desc: '3 modules' },
  { id: 'ENTERPRISE', label: 'Enterprise', price: 'KES 12,000/mo', desc: 'All modules' },
]
export default function Register() {
  const [form, setForm] = useState({ businessName: '', email: '', phone: '', password: '', kraPin: '', plan: 'BUSINESS' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      localStorage.setItem('token', res.token)
      setAuth(res.token, res.user, res.tenant)
      toast.success('Welcome to BiasharaOS!')
      navigate('/')
    } catch (err) { toast.error(err.error || 'Registration failed') }
    finally { setLoading(false) }
  }
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3"><span className="text-white font-bold text-xl">B</span></div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your Business</h1>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Business Name</label><input className="input" required placeholder="Kamau Enterprises Ltd" value={form.businessName} onChange={f('businessName')} /></div>
            <div><label className="label">Email</label><input className="input" type="email" required placeholder="info@business.co.ke" value={form.email} onChange={f('email')} /></div>
            <div><label className="label">Phone</label><input className="input" required placeholder="0712 345 678" value={form.phone} onChange={f('phone')} /></div>
            <div><label className="label">KRA PIN (optional)</label><input className="input" placeholder="P051234567A" value={form.kraPin} onChange={f('kraPin')} /></div>
            <div><label className="label">Password</label><input className="input" type="password" required placeholder="••••••••" value={form.password} onChange={f('password')} /></div>
          </div>
          <div>
            <label className="label">Select Plan</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {PLANS.map(p => (
                <button key={p.id} type="button" onClick={() => setForm(f => ({ ...f, plan: p.id }))}
                  className={`border rounded-lg p-3 text-left transition-colors ${form.plan === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-semibold text-sm text-gray-900">{p.label}</p>
                  <p className="text-xs text-blue-600 font-medium">{p.price}</p>
                  <p className="text-xs text-gray-500">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating account...' : 'Create Account — 14-day free trial'}</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">Already registered? <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link></p>
      </div>
    </div>
  )
}
