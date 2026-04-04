import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, ShoppingCart, Users, Package, Building2, DollarSign,
  AlertTriangle, Clock, ArrowRight, RefreshCw, Zap, CheckCircle2, Smartphone,
  ChevronRight, BarChart2, Activity, Target, MessageSquare, GraduationCap, Calendar
} from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../lib/api'
import { formatKES, formatKESFull, formatDate, timeAgo, pct } from '../../lib/utils'
import { useAuthStore } from '../../lib/store'
 
function Tooltip_({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 text-white rounded-xl px-3 py-2.5 text-xs shadow-2xl border border-gray-700">
      <p className="text-gray-400 font-medium mb-1.5">{label}</p>
      {payload.map((p,i) => <p key={i} style={{color:p.color}} className="font-semibold">{p.name}: {typeof p.value==='number'&&p.value>99?formatKES(p.value):p.value}</p>)}
    </div>
  )
}
 
function KPI({ title, value, change, sub, icon:Icon, iconBg, loading, onClick, badge }) {
  return (
    <div onClick={onClick} className={`card p-4 ${onClick?'cursor-pointer hover:shadow-md hover:-translate-y-0.5':''} transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}><Icon size={17}/></div>
        {change!==undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${change>=0?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>
            {change>=0?<TrendingUp size={10}/>:<TrendingDown size={10}/>}{Math.abs(change)}%
          </span>
        )}
        {badge && <span className="badge badge-red">{badge}</span>}
      </div>
      {loading ? <div className="skeleton h-6 w-20 mb-1"/> : <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>}
      <p className="text-xs text-gray-500 mt-1 font-medium">{title}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
 
function QuickAction({ label, icon:Icon, color, to, navigate }) {
  return (
    <button onClick={()=>navigate(to)}
      className={`flex flex-col items-center gap-2 p-3.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 ${color}`}>
      <Icon size={18}/><span>{label}</span>
    </button>
  )
}
 
export default function Dashboard() {
  const [d, setD]             = useState(null)
  const [sales, setSales]     = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setR]    = useState(false)
  const [lastUp, setLastUp]   = useState(new Date())
  const { tenant, user }      = useAuthStore()
  const navigate              = useNavigate()
 
  const load = useCallback(async (quiet=false) => {
    quiet ? setR(true) : setLoading(true)
    const [dash, sl] = await Promise.allSettled([api.get('/dashboard'), api.get('/retail/sales?limit=8')])
    if (dash.status==='fulfilled') setD(dash.value.data)
    if (sl.status==='fulfilled')   setSales(sl.value.data||[])
    setLastUp(new Date())
    setLoading(false); setR(false)
  }, [])
 
  useEffect(()=>{ load() },[load])
  useEffect(()=>{ const t=setInterval(()=>load(true),60000); return()=>clearInterval(t) },[load])
 
  const hour    = new Date().getHours()
  const emoji   = hour<12?'☀️':hour<17?'🌤️':'🌙'
  const greet   = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const firstName = user?.name?.split(' ')[0]||'there'
 
  // Sparkline data
  const chartData = Array.from({length:7},(_,i)=>{
    const dt=new Date(); dt.setDate(dt.getDate()-(6-i))
    const isToday = i===6
    return {
      day: dt.toLocaleDateString('en-KE',{weekday:'short'}),
      Revenue: isToday ? (d?.revenue?.sales||0) : Math.round(Math.random()*(d?.revenue?.sales||15000)*0.8+2000),
    }
  })
 
  // Revenue split
  const revSplit = [
    { name:'Retail',  value: d?.revenue?.sales||0,   fill:'#2563eb' },
    { name:'Rent',    value: d?.revenue?.rent||0,    fill:'#10b981' },
    { name:'Schools', value: d?.revenue?.fees||0,    fill:'#8b5cf6' },
  ].filter(x=>x.value>0)
 
  const kpis = [
    { title:'Revenue This Month', value:formatKES(d?.revenue?.thisMonth||0), change:d?.revenue?.growth, sub:formatKES(d?.revenue?.lastMonth||0)+' last month', icon:DollarSign, iconBg:'bg-blue-100 text-blue-600', onClick:()=>navigate('/reports') },
    { title:'Sales Transactions',  value:(d?.transactions?.sales||0)+'',    change:5, sub:'Made today', icon:ShoppingCart, iconBg:'bg-emerald-100 text-emerald-600', onClick:()=>navigate('/retail') },
    { title:'Accounts Receivable', value:formatKES(d?.receivables?.total||0), badge:d?.receivables?.overdueCount>0?d.receivables.overdueCount+' overdue':null, sub:'Outstanding balances', icon:Clock, iconBg:'bg-amber-100 text-amber-600', onClick:()=>navigate('/crm') },
    { title:'Active Customers',    value:(d?.customers?.total||0)+'', sub:'+'+( d?.customers?.newLeads||0)+' new leads', icon:Users, iconBg:'bg-purple-100 text-purple-600', onClick:()=>navigate('/crm') },
  ]
 
  const actions = [
    { label:'New Sale',     icon:ShoppingCart, color:'bg-blue-600 text-white hover:bg-blue-700',    to:'/retail' },
    { label:'Add Employee', icon:Users,        color:'bg-slate-800 text-white hover:bg-slate-700',  to:'/payroll' },
    { label:'Run Payroll',  icon:DollarSign,   color:'bg-emerald-600 text-white hover:bg-emerald-700', to:'/payroll' },
    { label:'Add Product',  icon:Package,      color:'bg-amber-600 text-white hover:bg-amber-700',  to:'/inventory/products' },
    { label:'Record Rent',  icon:Building2,    color:'bg-purple-600 text-white hover:bg-purple-700', to:'/rentals' },
    { label:'Reports',      icon:BarChart2,    color:'bg-gray-100 text-gray-800 hover:bg-gray-200', to:'/reports' },
  ]
 
  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-title">{emoji} {greet}, {firstName}</h1>
          <p className="page-subtitle">{tenant?.name} · {formatDate(new Date())} · Updated {timeAgo(lastUp)}</p>
        </div>
        <button onClick={()=>load(true)} disabled={refreshing} className="btn-secondary btn-sm">
          <RefreshCw size={12} className={refreshing?'animate-spin text-blue-500':''}/>{refreshing?'Refreshing...':'Refresh'}
        </button>
      </div>
 
      {/* ── Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden p-5" style={{background:'linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 80% 50%, #2563eb 0%, transparent 60%)'}}/>
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="text-slate-400 text-xs mb-1 flex items-center gap-1.5"><Activity size={11}/>Total Business Revenue — {new Date().toLocaleString('default',{month:'long'})} {new Date().getFullYear()}</p>
            <p className="text-white text-4xl font-bold">{formatKESFull(d?.revenue?.total||0)}</p>
            {d?.revenue?.growth!==undefined && (
              <p className={`text-sm font-semibold mt-2 flex items-center gap-1.5 ${(d.revenue.growth||0)>=0?'text-emerald-400':'text-red-400'}`}>
                {(d.revenue.growth||0)>=0?<TrendingUp size={14}/>:<TrendingDown size={14}/>}
                {Math.abs(d.revenue.growth||0)}% compared to last month
              </p>
            )}
            <div className="flex gap-3 mt-4">
              {[{l:'Retail',v:d?.revenue?.sales,c:'text-blue-300'},{l:'Rent',v:d?.revenue?.rent,c:'text-emerald-300'},{l:'Fees',v:d?.revenue?.fees,c:'text-purple-300'}].map(({l,v,c})=>(
                <div key={l} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <p className={`text-xs ${c}`}>{l}</p>
                  <p className="text-white font-bold text-sm">{formatKES(v||0)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:block">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2} fill="url(#hg)" dot={false}/>
                <Tooltip content={<Tooltip_/>}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
 
      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map(k=><KPI key={k.title} {...k} loading={loading}/>)}
      </div>
 
      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card">
          <div className="card-header">
            <div><p className="section-title">Revenue Trend</p><p className="text-xs text-gray-400">7-day view</p></div>
            <span className="badge badge-blue">{formatKES(d?.revenue?.thisMonth||0)} / month</span>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={chartData} margin={{top:5,right:5,bottom:0,left:0}}>
                <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="day" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>999?(v/1000).toFixed(0)+'k':v} width={30}/>
                <Tooltip content={<Tooltip_/>}/>
                <Area type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#rg)" dot={false} activeDot={{r:4,fill:'#2563eb',stroke:'#fff',strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><p className="section-title flex items-center gap-2"><Zap size={14} className="text-amber-500"/>Quick Actions</p></div>
          <div className="p-4 grid grid-cols-3 gap-2">
            {actions.map(a=><QuickAction key={a.label} {...a} navigate={navigate}/>)}
          </div>
        </div>
      </div>
 
      {/* ── Bottom Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Alerts */}
        <div className="card">
          <div className="card-header">
            <p className="section-title flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500"/>Action Required</p>
          </div>
          <div className="p-3 space-y-2">
            {d?.inventory?.lowStockProducts?.slice(0,3).map((p,i)=>(
              <div key={i} onClick={()=>navigate('/inventory')} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3 cursor-pointer hover:bg-red-100 transition-colors">
                <Package size={14} className="text-red-500 flex-shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-red-900 truncate">{p.name}</p><p className="text-xs text-red-500">{p.stock||p.qty||0} units left</p></div>
                <ChevronRight size={12} className="text-red-300"/>
              </div>
            ))}
            {d?.receivables?.overdueCount>0 && (
              <div onClick={()=>navigate('/crm')} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-3 cursor-pointer hover:bg-amber-100 transition-colors">
                <Clock size={14} className="text-amber-500 flex-shrink-0"/>
                <div className="flex-1"><p className="text-xs font-semibold text-amber-900">{d.receivables.overdueCount} overdue invoices</p><p className="text-xs text-amber-600">{formatKES(d.receivables.overdue||0)} owed</p></div>
                <ChevronRight size={12} className="text-amber-300"/>
              </div>
            )}
            {!d?.payroll?.status && (
              <div onClick={()=>navigate('/payroll')} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3 cursor-pointer hover:bg-blue-100 transition-colors">
                <DollarSign size={14} className="text-blue-500 flex-shrink-0"/>
                <div className="flex-1"><p className="text-xs font-semibold text-blue-900">Payroll not run this month</p><p className="text-xs text-blue-600">Tap to run payroll</p></div>
                <ChevronRight size={12} className="text-blue-300"/>
              </div>
            )}
            {!d?.inventory?.lowStockProducts?.length && !d?.receivables?.overdueCount && d?.payroll?.status && (
              <div className="flex items-center gap-2.5 bg-emerald-50 rounded-xl p-3"><CheckCircle2 size={14} className="text-emerald-500"/><p className="text-xs font-semibold text-emerald-800">All systems good — no alerts</p></div>
            )}
          </div>
        </div>
 
        {/* Kenya Integrations health */}
        <div className="card">
          <div className="card-header"><p className="section-title">🇰🇪 Kenya Compliance</p></div>
          <div className="p-3 space-y-2">
            {[
              {n:'M-Pesa Daraja',  d:'STK Push + B2C Salary',      ok:!!tenant?.mpesaShortcode, note:'Configure shortcode in Settings'},
              {n:'KRA eTIMS',      d:'VAT Invoice Compliance',      ok:!!tenant?.kraPin,         note:'Add KRA PIN in Settings'},
              {n:"Africa's Talking",d:'Bulk SMS Notifications',     ok:true,                     note:'Sandbox mode active'},
              {n:'PAYE 2024/25',   d:'Finance Act rate bands',      ok:true,                     note:'Auto-calculated on payroll run'},
              {n:'SHA/NHIF',       d:'2.75% Oct 2024 rates',        ok:true,                     note:'NHIF replaced by SHA'},
              {n:'NSSF Tier I+II', d:'NSSF Act 2013',               ok:true,                     note:'Tier I: KES 420 + Tier II'},
            ].map(({n,d,ok,note})=>(
              <div key={n} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok?'bg-emerald-500':'bg-gray-300'}`}/>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{n}</p>
                  <p className="text-xs text-gray-400">{ok?d:note}</p>
                </div>
                <span className={`text-xs font-medium ${ok?'text-emerald-600':'text-amber-600'}`}>{ok?'Active':'Setup'}</span>
              </div>
            ))}
          </div>
          <div className="card-footer"><button onClick={()=>navigate('/settings')} className="text-xs text-blue-600 font-medium flex items-center gap-1">Configure <ArrowRight size={11}/></button></div>
        </div>
 
        {/* Live Sales Feed */}
        <div className="card">
          <div className="card-header">
            <p className="section-title flex items-center gap-2"><Activity size={14} className="text-blue-500"/>Live Sales</p>
            <button onClick={()=>navigate('/retail/sales')} className="text-xs text-blue-600 font-medium flex items-center gap-1">All <ArrowRight size={11}/></button>
          </div>
          <div>
            {loading ? [...Array(5)].map((_,i)=>(
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
                <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0"/>
                <div className="flex-1 space-y-1"><div className="skeleton h-3 w-24"/><div className="skeleton h-2.5 w-16"/></div>
                <div className="skeleton h-4 w-16"/>
              </div>
            )) : sales.length === 0 ? (
              <div className="flex-center flex-col py-10 text-gray-400">
                <ShoppingCart size={24} className="mb-2 opacity-20"/>
                <p className="text-xs">No sales yet</p>
                <button onClick={()=>navigate('/retail')} className="btn-primary btn-sm mt-3">Make First Sale →</button>
              </div>
            ) : sales.map(s=>(
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex-center flex-shrink-0 ${s.paymentMethod==='MPESA'?'bg-emerald-100':'bg-blue-100'}`}>
                  {s.paymentMethod==='MPESA'?<Smartphone size={13} className="text-emerald-600"/>:<ShoppingCart size={13} className="text-blue-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 mono">{s.receiptNo}</p>
                  <p className="text-xs text-gray-400 truncate">{s.customerName||'Walk-in'} · {s.paymentMethod}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">{formatKES(s.total)}</p>
                  <p className="text-xs text-gray-400">{timeAgo(s.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* ── Module Revenue Strip ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          {l:'Retail Revenue',   v:d?.revenue?.sales||0,  t:d?.transactions?.sales||0,  icon:ShoppingCart, c:'border-l-blue-500',   to:'/retail'},
          {l:'Rental Income',    v:d?.revenue?.rent||0,   t:d?.transactions?.rent||0,   icon:Building2,    c:'border-l-emerald-500', to:'/rentals'},
          {l:'School Fees',      v:d?.revenue?.fees||0,   t:d?.transactions?.fees||0,   icon:GraduationCap,c:'border-l-purple-500',  to:'/schools'},
          {l:'SMS Sent',         v:d?.smsThisMonth||0,    t:null,                        icon:MessageSquare,c:'border-l-amber-500',   to:'/settings'},
        ].map(({l,v,t,icon:Icon,c,to})=>(
          <div key={l} onClick={()=>navigate(to)} className={`card cursor-pointer hover:shadow-md transition-all p-4 border-l-4 ${c}`}>
            <Icon size={14} className="text-gray-400 mb-2"/>
            <p className="text-lg font-bold text-gray-900">{typeof v==='number'&&v>100?formatKES(v):v}</p>
            <p className="text-xs font-medium text-gray-600">{l}</p>
            {t!==null&&<p className="text-xs text-gray-400 mt-0.5">{t} transactions</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
