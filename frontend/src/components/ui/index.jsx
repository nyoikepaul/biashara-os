
import { X, ChevronDown, Search, Loader2, AlertTriangle, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { statusColor } from '../../lib/utils'
 
export function Badge({ status, label, className='' }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(status)} ${className}`}>{label||status}</span>
}
 
export function Spinner({ size=18, className='' }) {
  return <Loader2 size={size} className={`animate-spin text-blue-500 ${className}`} />
}
 
export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-gray-200 mb-3" />}
      <p className="font-semibold text-gray-500 text-sm">{title}</p>
      {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
 
export function Modal({ isOpen, onClose, title, children, size='md', footer }) {
  useEffect(() => { document.body.style.overflow = isOpen?'hidden':''; return ()=>{document.body.style.overflow=''} }, [isOpen])
  if (!isOpen) return null
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-6xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)'}}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] flex flex-col`} style={{animation:'slideUp 0.2s ease'}}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">{footer}</div>}
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
 
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText='Delete', danger=true, loading=false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white ${danger?'bg-red-600 hover:bg-red-700':'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
          {loading ? <Spinner size={14}/> : confirmText}
        </button>
      </>}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger?'bg-red-100':'bg-blue-100'}`}>
          <AlertTriangle size={20} className={danger?'text-red-600':'text-blue-600'} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-1">{message}</p>
      </div>
    </Modal>
  )
}
 
export function SearchInput({ value, onChange, placeholder='Search...', className='' }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
        value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
 
export function Table({ columns, data, loading, onRow, emptyIcon, emptyText='No records found' }) {
  if (loading) return <div className="flex justify-center py-12"><Spinner size={24}/></div>
  if (!data?.length) return <EmptyState icon={emptyIcon} title={emptyText} />
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map(col => (
              <th key={col.key} className={`text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 ${col.className||''}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id||i} onClick={()=>onRow?.(row)} className={`border-b border-gray-50 transition-colors ${onRow?'cursor-pointer hover:bg-blue-50/30':''}`}>
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-4 ${col.className||''}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
 
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-gray-200 mb-4">
      {tabs.map(tab => (
        <button key={tab.id} onClick={()=>onChange(tab.id)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            active===tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          {tab.icon && <tab.icon size={14}/>}{tab.label}
          {tab.count !== undefined && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active===tab.id?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}
 
export function FormField({ label, error, required, children, hint }) {
  return (
    <div className="form-group">
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>}
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle size={11}/>{error}</p>}
    </div>
  )
}
 
export function StatCard({ label, value, sub, icon: Icon, color='blue', trend }) {
  const colors = {
    blue:'bg-blue-100 text-blue-600', green:'bg-green-100 text-green-600',
    red:'bg-red-100 text-red-600', amber:'bg-amber-100 text-amber-600',
    purple:'bg-purple-100 text-purple-600', indigo:'bg-indigo-100 text-indigo-600',
    pink:'bg-pink-100 text-pink-600', orange:'bg-orange-100 text-orange-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]||colors.blue}`}>
          {Icon && <Icon size={18}/>}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${trend>=0?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>
            {trend>=0?'↑':'↓'}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
 
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}
