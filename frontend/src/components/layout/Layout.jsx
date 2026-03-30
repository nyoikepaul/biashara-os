import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Users, Building2, GraduationCap, LogOut, Menu, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../lib/store'
const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/retail', icon: ShoppingCart, label: 'Retail & POS' },
  { to: '/payroll', icon: Users, label: 'Payroll' },
  { to: '/rentals', icon: Building2, label: 'Rentals' },
  { to: '/schools', icon: GraduationCap, label: 'Schools' },
]
function Sidebar({ onNav }) {
  const { tenant, user, logout } = useAuthStore()
  const navigate = useNavigate()
  return (
    <aside className="flex flex-col w-64 bg-white border-r border-gray-100 h-full">
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">B</span></div>
          <div><p className="font-semibold text-gray-900 text-sm leading-none">BiasharaOS</p><p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">{tenant?.name}</p></div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNav}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Icon size={17} />{label}
            <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">{user?.name?.charAt(0)||'U'}</div>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p><p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p></div>
          <button onClick={() => { logout(); navigate('/login') }} className="text-gray-400 hover:text-red-500 transition-colors"><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  )
}
export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="hidden lg:flex"><Sidebar /></div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 flex flex-col"><Sidebar onNav={() => setOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
          <button onClick={() => setOpen(true)} className="text-gray-500"><Menu size={22} /></button>
          <span className="font-semibold text-gray-900">BiasharaOS</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  )
}
