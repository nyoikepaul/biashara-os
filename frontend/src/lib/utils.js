import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
 
export const formatKES = (amount, decimals = 0) => {
  const n = Number(amount)
  if (isNaN(n)) return 'KES 0'
  return 'KES ' + n.toLocaleString('en-KE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
 
export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—'
  try { return format(new Date(date), fmt) } catch { return '—' }
}
 
export const formatDateTime = (date) => {
  if (!date) return '—'
  try { return format(new Date(date), 'dd MMM yyyy HH:mm') } catch { return '—' }
}
 
export const timeAgo = (date) => {
  if (!date) return '—'
  try {
    const d = new Date(date)
    if (isToday(d)) return format(d, 'HH:mm') + ' today'
    if (isYesterday(d)) return 'Yesterday'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch { return '—' }
}
 
export const safe = (val, fallback = 0) => {
  const n = Number(val)
  return isNaN(n) ? fallback : n
}
 
export const safeStr = (val, fallback = '—') => {
  if (val === null || val === undefined || val === 'undefined' || val === 'null') return fallback
  return String(val)
}
 
export const statusBadge = (status) => {
  const map = {
    DRAFT:'gray', PENDING:'yellow', ACTIVE:'green', APPROVED:'green',
    PAID:'green', COMPLETED:'green', DELIVERED:'green', WON:'green', RECEIVED:'green',
    PARTIAL:'blue', PROCESSING:'blue', SENT:'blue', CONFIRMED:'blue',
    UNPAID:'yellow', OVERDUE:'red', LATE:'red', ABSENT:'red',
    CANCELLED:'gray', REJECTED:'red', LOST:'red', EXPIRED:'gray',
    REFUNDED:'red', VOIDED:'gray',
  }
  return map[status] || 'gray'
}
 
export const badgeClass = (status) => {
  const color = statusBadge(status)
  const map = {
    gray:'bg-gray-100 text-gray-700', yellow:'bg-yellow-100 text-yellow-700',
    green:'bg-green-100 text-green-700', blue:'bg-blue-100 text-blue-700',
    red:'bg-red-100 text-red-700', purple:'bg-purple-100 text-purple-700',
    orange:'bg-orange-100 text-orange-700',
  }
  return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ' + (map[color] || map.gray)
}
 
export const getInitials = (name) =>
  (name || 'U').split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()
 
export const debounce = (fn, delay) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay) }
}
 
export const formatPhone = (phone) => {
  if (!phone) return ''
  return phone.replace(/^0/, '+254').replace(/^\+?254/, '+254')
}
