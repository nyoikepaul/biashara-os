
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, Lock, Building2 } from 'lucide-react'
import { useAuthStore } from '../lib/store'
import { ValidationModal, ValidationBanner, FieldError } from '../components/ui/ValidationModal'
import api from '../lib/api'
import toast from 'react-hot-toast'

function LoginForm({ onForgot }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState(null)
  const [modal, setModal] = useState({ isOpen: false })
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email address is required'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const submit = async (e) => {
    e.preventDefault()
    setBanner(null)
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    setModal({ isOpen: true, type: 'loading', title: 'Signing you in...', message: 'Verifying your credentials securely' })
    try {
      const res = await api.post('/auth/login', form)
      setModal({ isOpen: false })
      setAuth(res.token, res.user, res.tenant)
      toast.success('Welcome back, ' + res.user.name.split(' ')[0] + '!')
      navigate('/')
    } catch (err) {
      setModal({ isOpen: false })
      const msg = (err.error || err.message || err.toString() || 'Login failed').toLowerCase()
      if (msg.includes('credential') || msg.includes('password') || msg.includes('invalid')) {
        setErrors({ password: 'Incorrect email or password' })
        setBanner({ type: 'error', message: 'Login failed — please check your email and password.' })
      } else if (msg.includes('disabled') || msg.includes('suspended')) {
        setModal({ isOpen: true, type: 'warning', title: 'Account Suspended',
          message: 'Your account has been suspended. Contact support to restore access.',
          confirmText: 'Contact Support', cancelText: 'Close',
          onConfirm: () => { window.open('mailto:support@biashara.co.ke'); setModal({ isOpen: false }) },
          onCancel: () => setModal({ isOpen: false }) })
      } else {
        setModal({ isOpen: true, type: 'error', title: 'Connection Error',
          message: 'Unable to reach the server. Check your internet and try again.',
          detail: err.error || err.message,
          confirmText: 'Try Again', cancelText: 'Close',
          onConfirm: () => setModal({ isOpen: false }),
          onCancel: () => setModal({ isOpen: false }) })
      }
    } finally { setLoading(false) }
  }

  const f = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
  }

  return (
    <>
      <ValidationModal {...modal} />
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BiasharaOS</h1>
          <p className="text-gray-500 mt-1 text-sm">Kenya's all-in-one business platform</p>
        </div>

        <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 8px 40px rgba(0,0,0,0.10)', padding:'2rem' }}>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-5">Sign in to your account</p>

          {banner && (
            <div className="mb-4">
              <ValidationBanner type="error" show={true} message={banner.message} onDismiss={() => setBanner(null)} />
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={"w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all " +
                    (errors.email ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                  type="email" placeholder="you@business.co.ke"
                  value={form.email} onChange={f('email')} autoComplete="email" />
              </div>
              <FieldError message={errors.email} show={!!errors.email} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-600">Password</label>
                <button type="button" onClick={onForgot}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={"w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-all " +
                    (errors.password ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={f('password')} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              <FieldError message={errors.password} show={!!errors.password} />
            </div>

            <button type="submit" disabled={loading}
              style={{ background: loading ? '#93c5fd' : '#2563eb', borderRadius: 12, width: '100%',
                padding: '0.75rem', color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, marginTop: 8 }}>
              {loading ? <><Loader2 size={18} className="animate-spin" />Signing in...</> : 'Sign In →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            No account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register your business</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 256-bit SSL • M-Pesa • KRA eTIMS Certified
        </p>
      </div>
    </>
  )
}

function ForgotForm({ onBack }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState({ isOpen: false })

  const submit = async (e) => {
    e.preventDefault()
    if (!email) { setError('Email address is required'); return }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { setError('Enter a valid email address'); return }
    setLoading(true)
    setModal({ isOpen: true, type: 'loading', title: 'Sending reset link...', message: 'Looking up your account' })
    try {
      await api.post('/auth/forgot-password', { email })
      setModal({
        isOpen: true, type: 'success', title: 'Reset Link Sent!',
        message: 'A password reset link was sent to:', detail: email,
        list: ['Check your inbox and spam folder', 'The link expires in 1 hour', 'Contact support if you need help'],
        confirmText: 'Back to Login',
        onConfirm: () => { setModal({ isOpen: false }); onBack() },
        onCancel:  () => { setModal({ isOpen: false }); onBack() }
      })
    } catch (err) {
      setModal({
        isOpen: true, type: 'error', title: 'Email Not Found',
        message: 'No account found with that email address. Please check and try again.',
        confirmText: 'Try Again', cancelText: 'Back to Login',
        onConfirm: () => setModal({ isOpen: false }),
        onCancel:  () => { setModal({ isOpen: false }); onBack() }
      })
    } finally { setLoading(false) }
  }

  return (
    <>
      <ValidationModal {...modal} />
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Mail size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-500 mt-1 text-sm">We will send a reset link to your email</p>
        </div>

        <div style={{ background:'#fff', borderRadius:20, boxShadow:'0 8px 40px rgba(0,0,0,0.10)', padding:'2rem' }}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className={"w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all " +
                    (error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                  type="email" placeholder="you@business.co.ke"
                  value={email} onChange={e => { setEmail(e.target.value); setError('') }} autoFocus />
              </div>
              <FieldError message={error} show={!!error} />
            </div>

            <button type="submit" disabled={loading}
              style={{ background: loading ? '#93c5fd' : '#2563eb', borderRadius: 12, width: '100%',
                padding: '0.75rem', color: '#fff', fontWeight: 600, fontSize: 15, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8 }}>
              {loading ? <><Loader2 size={18} className="animate-spin" />Sending...</> : 'Send Reset Link →'}
            </button>
          </form>

          <button onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mt-5 mx-auto transition-colors">
            <ArrowLeft size={15} /> Back to Login
          </button>
        </div>
      </div>
    </>
  )
}

export default function Login() {
  const [view, setView] = useState('login')
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#ffffff 50%,#eef2ff 100%)' }}>
      {view === 'login'
        ? <LoginForm onForgot={() => setView('forgot')} />
        : <ForgotForm onBack={() => setView('login')} />
      }
    </div>
  )
}
