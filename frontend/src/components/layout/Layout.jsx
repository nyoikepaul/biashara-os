
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, ShoppingCart, Users, Building2, GraduationCap,
  LogOut, Menu, X, ChevronRight, Bell, Settings, DollarSign,
  Package, TrendingUp, HelpCircle, Zap, ChevronDown, Globe,
  BarChart3, UserCheck, ClipboardList, Truck
} from 'lucide-react'
import { useAuthStore } from '../../lib/store'
import { getInitials } from '../../lib/utils'
import toast from 'react-hot-toast'
import api from '../../lib/api'
 
const NAV = [
  { to:'/',          icon:LayoutDashboard, label:'Dashboard',        end:true },
  { divider:'Operations' },
  { to:'/retail',    icon:ShoppingCart,    label:'Retail & POS' },
  { to:'/inventory', icon:Package,         label:'Inventory' },
  { to:'/crm',       icon:TrendingUp,      label:'CRM & Sales' },
  { divider:'People' },
  { to:'/hr',        icon:Users,           label:'HR & Payroll' },
  { to:'/rentals',   icon:Building2,       label:'Rentals' },
  { to:'/schools',   icon:GraduationCap,   label:'Schools' },
  { divider:'Finance' },
  { to:'/finance',   icon:DollarSign,      label:'Finance & Accounting' },
  { to:'/reports',   icon:BarChart3,       label:'Reports & Analytics' },
  { divider:'System' },
  { to:'/settings',  icon:Settings,        label:'Settings' },
]
 
export default function Layout() {
  const [mobile, setMobile] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const { user, tenant, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
 
  useEffect(() => { setMobile(false) }, [location.pathname])
 
  const handleLogout = () => { logout(); toast.success('Signed out'); navigate('/login') }
 
  const SidebarContent = () => (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100 w-64">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
            <Zap size={17} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">BiasharaOS</p>
            <p className="text-xs text-gray-400 truncate max-w-[130px]">{tenant?.name}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tenant?.plan==='ENTERPRISE'?'bg-purple-100 text-purple-700':tenant?.plan==='BUSINESS'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>
            {tenant?.plan||'STARTER'}
          </span>
        </div>
      </div>
 
      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map((item, i) => {
          if (item.divider) return (
            <p key={i} className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-2">{item.divider}</p>
          )
          const Icon = item.icon
          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-0.5 ${isActive?'bg-blue-50 text-blue-700 shadow-sm':'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
 
      {/* User */}
      <div className="px-2 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer group">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
            <LogOut size={15}/>
          </button>
        </div>
      </div>
    </aside>
  )
 
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <div className="w-64 fixed h-full z-30"><SidebarContent /></div>
      </div>
 
      {/* Mobile sidebar */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setMobile(false)} />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl"><SidebarContent /></div>
        </div>
      )}
 
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-64">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0 z-20">
          <button onClick={()=>setMobile(true)} className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu size={22}/>
          </button>
          <div className="flex-1" />
          {/* Notifications */}
          <button onClick={()=>setShowNotifs(!showNotifs)} className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
            <Bell size={18}/>
            {notifs.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          {/* User avatar */}
          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name}</p>
              <p className="text-xs text-gray-400">{tenant?.plan}</p>
            </div>
          </div>
        </header>
 
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
