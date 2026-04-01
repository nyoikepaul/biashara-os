
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
 
export const formatKES = (n, d=0) =>
  'KES ' + Number(n||0).toLocaleString('en-KE', {minimumFractionDigits:d, maximumFractionDigits:d})
 
export const formatDate = (d, fmt='dd MMM yyyy') => d ? format(new Date(d), fmt) : '—'
export const formatDateTime = (d) => d ? format(new Date(d), 'dd MMM yyyy HH:mm') : '—'
export const timeAgo = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isToday(dt)) return format(dt, 'HH:mm')
  if (isYesterday(dt)) return 'Yesterday ' + format(dt, 'HH:mm')
  return formatDistanceToNow(dt, { addSuffix: true })
}
export const formatPhone = (p) => p?.replace(/^0/,'+254') || ''
export const getInitials = (n) => n?.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)||'?'
 
export const STATUS_COLORS = {
  DRAFT:'bg-gray-100 text-gray-700', PENDING:'bg-yellow-100 text-yellow-700',
  ACTIVE:'bg-green-100 text-green-700', APPROVED:'bg-green-100 text-green-700',
  PAID:'bg-green-100 text-green-700', COMPLETED:'bg-green-100 text-green-700',
  PARTIAL:'bg-blue-100 text-blue-700', PROCESSING:'bg-blue-100 text-blue-700',
  UNPAID:'bg-yellow-100 text-yellow-700', OVERDUE:'bg-red-100 text-red-700',
  CANCELLED:'bg-gray-100 text-gray-600', REJECTED:'bg-red-100 text-red-700',
  REFUNDED:'bg-purple-100 text-purple-700', VOIDED:'bg-gray-100 text-gray-500',
  LATE:'bg-red-100 text-red-700', ABSENT:'bg-red-100 text-red-700',
  PRESENT:'bg-green-100 text-green-700', ON_LEAVE:'bg-blue-100 text-blue-700',
}
export const statusColor = (s) => STATUS_COLORS[s] || 'bg-gray-100 text-gray-700'
 
export const MODULES = {
  retail:   { label:'Retail & POS',      color:'blue' },
  payroll:  { label:'HR & Payroll',       color:'green' },
  rentals:  { label:'Rentals',            color:'purple' },
  schools:  { label:'School Fees',        color:'pink' },
  finance:  { label:'Finance',            color:'indigo' },
  crm:      { label:'CRM',               color:'orange' },
  inventory:{ label:'Inventory',          color:'amber' },
}
 
export const debounce = (fn, ms) => {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), ms) }
}
