import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Building2, GraduationCap,
  DollarSign, Headphones, BarChart3, Settings, LogOut, Bell, Menu, X,
  ChevronRight, Building, TrendingUp, MessageSquare, Zap, Search, HelpCircle,
  Moon, Globe, AlertCircle, CheckCircle2
} from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import { formatKES, getInitials, timeAgo } from '../../lib/utils'
import api from '../../lib/api'
import toast from 'react-hot-toast'
 
const NAV_GROUPS = [
  { label: 'OVERVIEW', items: [
    { to:'/',          icon:LayoutDashboard, label:'Dashboard',    end:true }
  ]},
  { label: 'COMMERCE', items: [
    { to:'/retail',    icon:ShoppingCart,    label:'Retail & POS' },
    { to:'/inventory', icon:Package,         label:'Inventory' },
    { to:'/crm',       icon:Headphones,      label:'CRM & Sales' },
  ]},
  { label: 'OPERATIONS', items: [
    { to:'/payroll',   icon:Users,           label:'HR & Payroll' },
    { to:'/rentals',   icon:Building2,       label:'Rentals' },
    { to:'/schools',   icon:GraduationCap,   label:'Schools' },
  ]},
  { label: 'FINANCE', items: [
    { to:'/finance',   icon:TrendingUp,      label:'Accounting' },
    { to:'/reports',   icon:BarChart3,       label:'Reports' },
  ]},
  { label: 'SYSTEM', items: [
    { to:'/settings',  icon:Settings,        label:'Settings' },
  ]},
]
 
const INTEGRATIONS = [
  { key:'mpesa',   label:'M-Pesa',     icon:'📱', check: t => !!t?.mpesaShortcode, href:'/settings' },
  { key:'etims',   label:'eTIMS',      icon:'🏛️', check: t => !!t?.kraPin,         href:'/settings' },
  { key:'sms',     label:'SMS',        icon:'💬', check: () => true,               href:'/settings' },
]
 
export default function Layout() {
  const [open, setOpen]         = useState(false)
  const [stats, setStats]       = useState(null)
  const [notifs, setNotifs]     = useState([])
  const [showNotifs, setShowN]  = useState(false)
  const { user, tenant, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
 
  useEffect(() => {
    api.get('/dashboard').then(r => {
      setStats(r.data)
      // Build notifications from real data
      const n = []
      if (r.data?.inventory?.lowStockProducts?.length > 0) n.push({ id:1, type:'warning', msg: r.data.inventory.lowStockProducts.length + ' products have low stock', time: new Date(), link:'/inventory' })
      if (r.data?.receivables?.overdueCount > 0) n.push({ id:2, type:'error', msg: r.data.receivables.overdueCount + ' invoices are overdue — ' + formatKES(r.data.receivables.overdue), time: new Date(), link:'/crm' })
      if (!r.data?.payroll?.status) n.push({ id:3, type:'info', msg: 'Payroll not run for this month', time: new Date(), link:'/payroll' })
      setNotifs(n)
    }).catch(()=>{})
  }, [])
 
  const logout_ = () => { logout(); toast.success('Signed out'); navigate('/login') }
 
  const planStyle = { STARTER:'text-gray-500 bg-gray-800', BUSINESS:'text-blue-300 bg-blue-900/50', ENTERPRISE:'text-purple-300 bg-purple-900/50' }
 
  const SidebarInner = ({ onNav }) => (
    <div className="flex flex-col h-full" style={{ background:'#0f172a' }}>
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex-center shadow-lg shadow-blue-900/50 flex-shrink-0">
          <Building size={16} className="text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-none">BiasharaOS</p>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{tenant?.name}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${planStyle[tenant?.plan]||planStyle.STARTER}`}>{tenant?.plan}</span>
      </div>
 
      {/* Revenue snapshot */}
      {stats && (
        <div className="grid grid-cols-2 gap-2 px-3 py-3 border-b border-slate-800">
          <div className="rounded-lg px-3 py-2.5" style={{background:'#1e293b'}}>
            <p className="text-white font-bold text-sm leading-none">{formatKES(stats.revenue?.thisMonth||0)}</p>
            <p className="text-slate-400 text-xs mt-1">Revenue / month</p>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{background:'#1e293b'}}>
            <p className="text-emerald-400 font-bold text-sm leading-none">{stats.transactions?.sales||0}</p>
            <p className="text-slate-400 text-xs mt-1">Sales today</p>
          </div>
        </div>
      )}
 
      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-1">{label}</p>
            {items.map(({ to, icon:Icon, label:lbl, end }) => (
              <NavLink key={to} to={to} end={end} onClick={onNav}
                className={({ isActive }) =>
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 group ' +
                  (isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800')
                }>
                <Icon size={16} className="flex-shrink-0"/>
                <span className="flex-1 truncate">{lbl}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
 
      {/* Kenya Integrations */}
      <div className="px-3 py-3 border-t border-slate-800 border-b border-slate-800">
        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-2 px-1">🇰🇪 Integrations</p>
        <div className="flex gap-2">
          {INTEGRATIONS.map(({ key, label, icon, check, href }) => {
            const active = check(tenant)
            return (
              <button key={key} onClick={() => { navigate(href); onNav?.() }}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all ${active ? 'border-emerald-800 bg-emerald-900/30 text-emerald-400' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                <span className="text-base">{icon}</span>
                <span className="text-[10px]">{label}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-600'}`}/>
              </button>
            )
          })}
        </div>
      </div>
 
      {/* User */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs">{user?.role?.toLowerCase()}</p>
          </div>
          <button onClick={logout_} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
            <LogOut size={14}/>
          </button>
        </div>
        <div className="px-2 mt-2">
          <span className="pill-live text-slate-400">System Online</span>
        </div>
      </div>
    </div>
  )
 
  const currentRoute = NAV_GROUPS.flatMap(g=>g.items).find(n => n.end ? location.pathname==='/' : location.pathname.startsWith(n.to))
 
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-56 flex-shrink-0"><SidebarInner/></div>
 
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={()=>setOpen(false)}/>
          <div className="relative w-60 shadow-2xl anim-left"><SidebarInner onNav={()=>setOpen(false)}/></div>
        </div>
      )}
 
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 flex items-center px-4 py-2.5 gap-3 flex-shrink-0 shadow-sm shadow-gray-100/50">
          <button onClick={()=>setOpen(true)} className="lg:hidden btn-ghost btn-icon"><Menu size={19}/></button>
 
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building size={12} className="text-gray-400"/>
            <ChevronRight size={10} className="text-gray-300"/>
            <span className="font-semibold text-gray-800">{currentRoute?.label || 'Dashboard'}</span>
          </div>
 
          <div className="flex-1"/>
 
          {/* Kenya badges */}
          <div className="hidden xl:flex items-center gap-2">
            <span className="kenya-badge mpesa-green">📱 M-Pesa Live</span>
            <span className="kenya-badge kra-red">🇰🇪 eTIMS Ready</span>
          </div>
 
          {/* Notifications */}
          <div className="relative">
            <button onClick={()=>setShowN(!showNotifs)} className="btn-ghost btn-icon relative">
              <Bell size={17}/>
              {notifs.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white"/>}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-10 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50 anim-scale overflow-hidden">
                <div className="flex-between px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-sm">Notifications</p>
                  <button onClick={()=>setShowN(false)} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>
                </div>
                {notifs.length === 0 ? (
                  <div className="flex-center flex-col py-8 text-gray-400">
                    <CheckCircle2 size={24} className="mb-2 opacity-30"/>
                    <p className="text-xs">All clear!</p>
                  </div>
                ) : notifs.map(n => (
                  <div key={n.id} onClick={()=>{navigate(n.link);setShowN(false)}}
                    className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className={`w-7 h-7 rounded-full flex-center flex-shrink-0 ${n.type==='error'?'bg-red-100':n.type==='warning'?'bg-amber-100':'bg-blue-100'}`}>
                      <AlertCircle size={13} className={n.type==='error'?'text-red-600':n.type==='warning'?'text-amber-600':'text-blue-600'}/>
                    </div>
                    <div>
                      <p className="text-xs text-gray-800 font-medium">{n.msg}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          <div className="w-7 h-7 bg-blue-600 rounded-full flex-center text-white text-xs font-bold cursor-pointer" title={user?.name}>
            {getInitials(user?.name)}
          </div>
        </header>
 
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-5 max-w-screen-2xl mx-auto anim-up">
            <Outlet/>
          </div>
        </main>
      </div>
    </div>
  )
}
