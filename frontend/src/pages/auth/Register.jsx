import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Check, Loader2, User, Mail, Phone, Lock, MapPin, CreditCard } from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import { ValidationModal, ValidationBanner, FieldError } from '../../components/ui/ValidationModal'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const PLANS = [
  { id: 'STARTER',    name: 'Starter',    price: 'KES 2,500/mo', features: ['Retail & POS','M-Pesa payments','Up to 5 users','Email support'] },
  { id: 'BUSINESS',   name: 'Business',   price: 'KES 5,500/mo', features: ['Any 3 modules','M-Pesa + eTIMS','Up to 20 users','Priority support'], popular: true },
  { id: 'ENTERPRISE', name: 'Enterprise', price: 'KES 12,000/mo', features: ['All 4 modules','All integrations','Unlimited users','Dedicated support','Custom reports','SLA 99.9%'] },
]

function validateForm(form) {
  const errors = {}
  if (!form.businessName?.trim())              errors.businessName = 'Business name is required'
  else if (form.businessName.length < 2)       errors.businessName = 'Business name is too short'
  if (!form.email)                             errors.email        = 'Email address is required'
  else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.phone)                             errors.phone        = 'Phone number is required'
  else if (!/^(0|\+254)[17]\d{8}$/.test(form.phone.replace(/\s/g,''))) errors.phone = 'Enter a valid Kenyan phone number (07XXXXXXXX)'
  if (!form.password)                          errors.password     = 'Password is required'
  else if (form.password.length < 8)           errors.password     = 'Password must be at least 8 characters'
  else if (!/[A-Z]/.test(form.password))       errors.password     = 'Include at least one uppercase letter'
  if (form.kraPin && !/^[A-Z]\d{9}[A-Z]$/.test(form.kraPin)) errors.kraPin = 'KRA PIN format: A123456789B'
  return errors
}

export default function Register() {
  const [form, setForm]     = useState({ businessName: '', email: '', phone: '', password: '', kraPin: '', plan: 'BUSINESS' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [modal, setModal]   = useState({ isOpen: false })
  const [banner, setBanner] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const { setAuth }         = useAuthStore()
  const navigate            = useNavigate()

  const f = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })) }

  const getPasswordStrength = (p) => {
    if (!p) return { score: 0, label: '', color: '' }
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    const map = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
    return { score, label: map[score], color: colors[score] }
  }

  const pwStrength = getPasswordStrength(form.password)

  const submit = async (e) => {
    e.preventDefault()
    setBanner(null)
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) {
      setBanner({ type: 'error', message: Object.keys(errs).length + ' validation error(s) — please fix the highlighted fields.' })
      return
    }

    setLoading(true)
    setModal({ isOpen: true, type: 'loading', title: 'Creating your account...', message: 'Setting up your business workspace' })

    try {
      const res = await api.post('/auth/register', form)
      setModal({
        isOpen: true, type: 'success',
        title: 'Account Created! 🎉',
        message: 'Welcome to BiasharaOS, ' + form.businessName + '! Your 14-day free trial has started.',
        list: ['Default chart of accounts created', 'M-Pesa integration ready to configure', 'KRA eTIMS ready to connect'],
        confirmText: 'Go to Dashboard →',
        onConfirm: () => {
          setModal({ isOpen: false })
          setAuth(res.token, res.user, res.tenant)
          toast.success('Welcome to BiasharaOS! 🚀')
          navigate('/')
        }
      })
    } catch (err) {
      setModal({ isOpen: false })
      const msg = err.error || err.message || (typeof err === 'string' ? err : 'Registration failed — check your connection')
      if (msg.includes('already')) {
        setErrors({ email: 'This email is already registered' })
        setModal({
          isOpen: true, type: 'warning',
          title: 'Email Already Registered',
          message: 'An account with this email already exists. Did you forget your password?',
          confirmText: 'Sign In Instead',
          cancelText: 'Try Different Email',
          onConfirm: () => { setModal({ isOpen: false }); navigate('/login') },
          onCancel:  () => setModal({ isOpen: false })
        })
      } else {
        setModal({
          isOpen: true, type: 'error',
          title: 'Registration Failed',
          message: 'Something went wrong while creating your account.',
          detail: msg,
          confirmText: 'Try Again',
          cancelText: 'Cancel',
          onConfirm: () => setModal({ isOpen: false }),
          onCancel:  () => setModal({ isOpen: false })
        })
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen py-8 px-4 flex items-start justify-center"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 50%, #eef2ff 100%)' }}>
      <ValidationModal {...modal} />

      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-200">
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Start your free trial</h1>
          <p className="text-gray-500 mt-1">14 days free • No credit card required • Cancel anytime</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', padding: '2rem' }}>
          {/* Validation banner */}
          {banner && (
            <div className="mb-6">
              <ValidationBanner type={banner.type} message={banner.message} show={!!banner} onDismiss={() => setBanner(null)} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Plan selector */}
            <div className="lg:col-span-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Select Plan</h3>
              <div className="space-y-3">
                {PLANS.map(plan => (
                  <div key={plan.id} onClick={() => setForm(p => ({ ...p, plan: plan.id }))}
                    className={"border-2 rounded-xl p-4 cursor-pointer transition-all " +
                      (form.plan === plan.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300')}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{plan.name}</span>
                      {plan.popular && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Popular</span>}
                    </div>
                    <p className="text-blue-600 font-semibold text-sm mb-2">{plan.price}</p>
                    <ul className="space-y-1">
                      {plan.features.map(feat => (
                        <li key={feat} className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Check size={11} className="text-green-500 flex-shrink-0" />{feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Business Details</h3>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business Name *</label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={"w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all " + (errors.businessName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                      placeholder="Kamau & Sons Ltd" value={form.businessName} onChange={f('businessName')} />
                  </div>
                  <FieldError message={errors.businessName} show={!!errors.businessName} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address *</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className={"w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all " + (errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                        type="email" placeholder="admin@company.co.ke" value={form.email} onChange={f('email')} />
                    </div>
                    <FieldError message={errors.email} show={!!errors.email} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className={"w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all " + (errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                        placeholder="0712 345 678" value={form.phone} onChange={f('phone')} />
                    </div>
                    <FieldError message={errors.phone} show={!!errors.phone} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">KRA PIN <span className="font-normal text-gray-400">(optional)</span></label>
                    <div className="relative">
                      <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className={"w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm outline-none transition-all " + (errors.kraPin ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                        placeholder="P051234567A" value={form.kraPin} onChange={f('kraPin')} />
                    </div>
                    <FieldError message={errors.kraPin} show={!!errors.kraPin} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className={"w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm outline-none transition-all " + (errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100')}
                        type={showPass ? 'text' : 'password'} placeholder="Min 8 chars" value={form.password} onChange={f('password')} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: (pwStrength.score/4*100)+'%', background: pwStrength.color }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                      </div>
                    )}
                    <FieldError message={errors.password} show={!!errors.password} />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ background: loading ? '#93c5fd' : '#2563eb', borderRadius: 14, width: '100%', padding: '0.85rem', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" />Creating Account...</> : 'Create Account — 14-day Free Trial 🚀'}
                </button>

                <p className="text-center text-xs text-gray-400">
                  By registering you agree to our Terms of Service and Privacy Policy
                </p>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
