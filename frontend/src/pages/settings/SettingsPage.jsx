
import { useState } from 'react'
import { Settings, Building2, CreditCard, Bell, Shield, Users, Globe, Save } from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import { PageHeader, Tabs } from '../../components/ui'
import api from '../../lib/api'
import toast from 'react-hot-toast'
 
export default function SettingsPage() {
  const [tab, setTab] = useState('business')
  const { tenant, user } = useAuthStore()
  const [form, setForm] = useState({ name: tenant?.name||'', phone: tenant?.phone||'', email: tenant?.email||'', kraPin: tenant?.kraPin||'', address: tenant?.address||'', mpesaShortcode: tenant?.mpesaShortcode||'', mpesaPasskey: tenant?.mpesaPasskey||'' })
  const [saving, setSaving] = useState(false)
 
  const save = async () => {
    setSaving(true)
    try {
      await api.patch('/settings/business', form)
      toast.success('Settings saved successfully!')
    } catch (err) {
      toast.error(err.error || 'Save failed')
    } finally { setSaving(false) }
  }
 
  const tabs = [
    {id:'business', label:'Business', icon:Building2},
    {id:'integrations', label:'Integrations', icon:Globe},
    {id:'billing', label:'Billing & Plan', icon:CreditCard},
    {id:'notifications', label:'Notifications', icon:Bell},
    {id:'security', label:'Security', icon:Shield},
    {id:'team', label:'Team Members', icon:Users},
  ]
 
  return (
    <div className="space-y-6">
      <PageHeader title={<span className="flex items-center gap-2"><Settings size={22} className="text-gray-600"/>Settings</span>} subtitle="Manage your account and preferences"/>
      <Tabs tabs={tabs} active={tab} onChange={setTab}/>
 
      {tab === 'business' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h3 className="font-bold text-gray-900 mb-5">Business Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {k:'name', label:'Business Name', ph:'Kamau Enterprises Ltd'},
              {k:'email', label:'Business Email', ph:'info@business.co.ke', type:'email'},
              {k:'phone', label:'Phone Number', ph:'0712 345 678'},
              {k:'kraPin', label:'KRA PIN', ph:'P051234567A'},
              {k:'address', label:'Address', ph:'Nairobi, Kenya', full:true},
            ].map(({k, label, ph, type, full}) => (
              <div key={k} className={full?'col-span-2':''}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  type={type||'text'} placeholder={ph} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="mt-6 btn-primary flex items-center gap-2">
            <Save size={15}/>{saving?'Saving...':'Save Changes'}
          </button>
        </div>
      )}
 
      {tab === 'integrations' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h3 className="font-bold text-gray-900 mb-5">Kenya Integrations</h3>
          <div className="space-y-6">
            {/* M-Pesa */}
            <div className="border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center font-bold text-green-700 text-xs">MP</div>
                <div><p className="font-semibold text-gray-900">M-Pesa Daraja</p><p className="text-xs text-gray-400">STK Push & B2C payments</p></div>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{form.mpesaShortcode?'Configured':'Not Set'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Shortcode / Paybill</label><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="174379" value={form.mpesaShortcode} onChange={e=>setForm(p=>({...p,mpesaShortcode:e.target.value}))}/></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1.5">Passkey</label><input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400" type="password" placeholder="••••••••" value={form.mpesaPasskey} onChange={e=>setForm(p=>({...p,mpesaPasskey:e.target.value}))}/></div>
              </div>
            </div>
            {/* KRA eTIMS */}
            <div className="border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center font-bold text-red-700 text-xs">KRA</div>
                <div><p className="font-semibold text-gray-900">KRA eTIMS</p><p className="text-xs text-gray-400">VAT-compliant invoice submission</p></div>
                <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">{tenant?.kraPin?'KRA PIN Set':'No KRA PIN'}</span>
              </div>
            </div>
            {/* Africa's Talking */}
            <div className="border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-700 text-xs">AT</div>
                <div><p className="font-semibold text-gray-900">Africa's Talking SMS</p><p className="text-xs text-gray-400">Bulk SMS notifications</p></div>
                <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">Active</span>
              </div>
            </div>
          </div>
          <button onClick={save} disabled={saving} className="mt-6 btn-primary flex items-center gap-2">
            <Save size={15}/>{saving?'Saving...':'Save Integration Settings'}
          </button>
        </div>
      )}
 
      {tab === 'billing' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl">
          <h3 className="font-bold text-gray-900 mb-5">Current Plan</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-900 text-xl">{tenant?.plan} Plan</p>
                <p className="text-blue-600 text-sm mt-0.5">{tenant?.plan==='STARTER'?'KES 2,500':tenant?.plan==='BUSINESS'?'KES 5,500':'KES 12,000'}/month</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Next billing</p>
                <p className="font-semibold text-blue-900">1st next month</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {plan:'STARTER', price:'KES 2,500', features:'1 Module · 5 Users'},
              {plan:'BUSINESS', price:'KES 5,500', features:'3 Modules · 20 Users'},
              {plan:'ENTERPRISE', price:'KES 12,000', features:'All Modules · Unlimited'},
            ].map(({plan,price,features})=>(
              <div key={plan} className={`border-2 rounded-xl p-4 ${tenant?.plan===plan?'border-blue-500 bg-blue-50':'border-gray-200 hover:border-gray-300 cursor-pointer'}`}>
                <p className="font-bold text-sm">{plan}</p>
                <p className="text-blue-600 font-semibold text-xs mt-0.5">{price}/mo</p>
                <p className="text-gray-500 text-xs mt-1">{features}</p>
                {tenant?.plan!==plan && <button className="mt-2 text-xs text-blue-600 hover:underline font-medium">Upgrade →</button>}
              </div>
            ))}
          </div>
        </div>
      )}
 
      {(tab === 'notifications' || tab === 'security' || tab === 'team') && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Settings size={40} className="text-gray-200 mx-auto mb-3"/>
          <p className="font-semibold text-gray-500">Coming Soon</p>
          <p className="text-gray-400 text-sm mt-1">This settings section is being built</p>
        </div>
      )}
    </div>
  )
}
