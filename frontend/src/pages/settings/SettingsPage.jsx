import { useState } from 'react'
import { Settings, Building, Plug, CreditCard, Shield, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import api from '../../lib/api'
import toast from 'react-hot-toast'
 
const TABS = [
  {k:'profile',  l:'Business Profile', icon:Building},
  {k:'integrations',l:'Integrations',  icon:Plug},
  {k:'billing',  l:'Billing & Plan',   icon:CreditCard},
  {k:'security', l:'Security',         icon:Shield},
]
 
export default function SettingsPage() {
  const [tab,setTab]    = useState('profile')
  const { tenant,user } = useAuthStore()
  const [form,setForm]  = useState({name:tenant?.name||'',phone:tenant?.phone||'',email:tenant?.email||'',kraPin:tenant?.kraPin||'',address:tenant?.address||''})
  const [saving,setSave]= useState(false)
 
  const save = async (e) => {
    e.preventDefault(); setSave(true)
    try { toast.success('Profile updated') } catch{}
    finally { setSave(false) }
  }
 
  const PLAN_FEATS = {
    STARTER: {price:'KES 2,500/mo', features:['Retail & POS','Up to 5 users','M-Pesa Payments','Email support']},
    BUSINESS:{price:'KES 5,500/mo', features:['Any 3 modules','Up to 20 users','M-Pesa + eTIMS','Priority support']},
    ENTERPRISE:{price:'KES 12,000/mo',features:['All modules','Unlimited users','All integrations','Dedicated support','SLA 99.9%']},
  }
  const plan = PLAN_FEATS[tenant?.plan||'STARTER']
 
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">Settings</h1><p className="page-subtitle">Business profile · Integrations · Billing · Security</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="card p-3">
          {TABS.map(({k,l,icon:Icon})=>(
            <button key={k} onClick={()=>setTab(k)}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 "+(tab===k?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100')}>
              <Icon size={15}/><span className="flex-1 text-left">{l}</span><ChevronRight size={12} className="opacity-40"/>
            </button>
          ))}
        </div>
 
        <div className="xl:col-span-3 space-y-4">
          {tab==='profile'&&(
            <div className="card p-6">
              <h3 className="section-title mb-5">Business Information</h3>
              <form onSubmit={save} className="grid grid-cols-2 gap-4">
                {[{k:'name',l:'Business Name',ph:'Kamau & Sons Ltd'},{k:'phone',l:'Phone',ph:'0712345678'},{k:'email',l:'Email',ph:'admin@business.co.ke',span:2,type:'email'},{k:'kraPin',l:'KRA PIN',ph:'P051234567A'},{k:'address',l:'Physical Address',ph:'Nairobi, Kenya'}].map(({k,l,ph,type,span})=>(
                  <div key={k} className={span===2?'col-span-2':''}>
                    <label className="label">{l}</label>
                    <input className="input" placeholder={ph} type={type||'text'} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
                <div className="col-span-2 flex justify-end">
                  <button type="submit" disabled={saving} className="btn-primary">{saving?'Saving...':'Save Changes'}</button>
                </div>
              </form>
            </div>
          )}
 
          {tab==='integrations'&&(
            <div className="space-y-3">
              {[
                {name:'M-Pesa Daraja',desc:'STK Push & B2C Salary Disbursement',icon:'📱',ok:!!tenant?.mpesaShortcode,detail:tenant?.mpesaShortcode?'Shortcode: '+tenant.mpesaShortcode:'Not configured'},
                {name:'KRA eTIMS',desc:'VAT Invoice Submission & Compliance',icon:'🏛️',ok:!!tenant?.kraPin,detail:tenant?.kraPin?'KRA PIN: '+tenant.kraPin:'Add KRA PIN in Business Profile'},
                {name:"Africa's Talking SMS",desc:'Bulk SMS — Payslips, Rent, Fee Reminders',icon:'💬',ok:true,detail:'Sandbox active · Add API key for production'},
                {name:'PAYE Engine',desc:'Finance Act 2024/25 · 5 Tax Bands',icon:'💰',ok:true,detail:'Auto-calculates on every payroll run'},
                {name:'SHA / NHIF',desc:'2.75% of Gross · Effective Oct 2024',icon:'🏥',ok:true,detail:'SHA replaced NHIF from October 2024'},
                {name:'NSSF Act 2013',desc:'Tier I (KES 420) + Tier II',icon:'🛡️',ok:true,detail:'Employee + Employer contributions'},
              ].map(({name,desc,icon,ok,detail})=>(
                <div key={name} className="card p-4 flex items-center gap-4">
                  <span className="text-2xl w-10 flex-shrink-0 text-center">{icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                    <p className={`text-xs mt-0.5 ${ok?'text-emerald-600':'text-amber-600'}`}>{detail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ok?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{ok?'Active':'Setup'}</span>
                    {!ok&&<button className="btn-primary btn-sm">Configure</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
 
          {tab==='billing'&&(
            <div className="space-y-4">
              <div className="rounded-2xl p-6 text-white" style={{background:'linear-gradient(135deg,#0f172a,#1e3a5f)'}}>
                <p className="text-slate-400 text-sm">Current Plan</p>
                <p className="text-3xl font-bold mt-1">{tenant?.plan||'STARTER'}</p>
                <p className="text-xl text-blue-300 mt-1">{plan.price}</p>
                <ul className="mt-3 space-y-1">
                  {plan.features.map(f=><li key={f} className="text-xs text-slate-300 flex items-center gap-2"><span className="text-emerald-400">✓</span>{f}</li>)}
                </ul>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(PLAN_FEATS).map(([k,v])=>(
                  <div key={k} className={"card p-4 text-center "+(k===tenant?.plan?'ring-2 ring-blue-500':'')}>
                    <p className="font-bold text-gray-900">{k}</p>
                    <p className="text-blue-600 font-semibold text-sm mt-1">{v.price}</p>
                    {k!==tenant?.plan?<button className="btn-primary btn-sm w-full mt-3">Upgrade</button>:<p className="text-xs text-emerald-600 font-semibold mt-3">Current Plan</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
 
          {tab==='security'&&(
            <div className="card p-6 space-y-4">
              <h3 className="section-title">Security Settings</h3>
              <div className="space-y-3">
                {[{l:'Change Password',d:'Update your account password'},{l:'Two-Factor Authentication',d:'Add extra security layer'},{l:'Active Sessions',d:'View and manage login sessions'},{l:'Audit Log',d:'See recent account activity'}].map(({l,d})=>(
                  <div key={l} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div><p className="font-medium text-gray-900 text-sm">{l}</p><p className="text-xs text-gray-500">{d}</p></div>
                    <button className="btn-secondary btn-sm">Manage</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
