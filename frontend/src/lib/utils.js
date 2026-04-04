import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
 
export const formatKES = (n, dec=0) => {
  const v = Number(n)
  if (isNaN(v)) return 'KES 0'
  if (v >= 1000000) return 'KES ' + (v/1000000).toFixed(1) + 'M'
  if (v >= 100000) return 'KES ' + (v/1000).toFixed(0) + 'K'
  return 'KES ' + v.toLocaleString('en-KE',{minimumFractionDigits:dec,maximumFractionDigits:dec})
}
 
export const formatKESFull = (n, dec=0) => {
  const v = Number(n)
  if (isNaN(v)) return 'KES 0'
  return 'KES ' + v.toLocaleString('en-KE',{minimumFractionDigits:dec,maximumFractionDigits:dec})
}
 
export const formatDate = (d, fmt='dd MMM yyyy') => {
  if (!d) return '—'
  try { return format(new Date(d), fmt) } catch { return '—' }
}
 
export const formatDateTime = (d) => {
  if (!d) return '—'
  try { return format(new Date(d), 'dd MMM yyyy · HH:mm') } catch { return '—' }
}
 
export const timeAgo = (d) => {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    if (isToday(dt)) return format(dt,'HH:mm')
    if (isYesterday(dt)) return 'Yesterday'
    return formatDistanceToNow(dt,{addSuffix:true})
  } catch { return '—' }
}
 
export const getInitials = (name='') =>
  name.split(' ').slice(0,2).map(n=>n[0]||'').join('').toUpperCase() || 'U'
 
export const formatPhone = (p='') => p.replace(/^0/,'+254').replace(/^\+?254/,'+254')
 
export const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t=setTimeout(()=>fn(...a),ms) } }
 
export const pct = (a, b) => b > 0 ? parseFloat(((a/b)*100).toFixed(1)) : 0
 
export const statusColor = (s) => ({
  COMPLETED:'green', PAID:'green', APPROVED:'green', ACTIVE:'green', DELIVERED:'green', RECEIVED:'green', WON:'green',
  PENDING:'yellow', PARTIAL:'blue', PROCESSING:'blue', SENT:'blue', DRAFT:'gray',
  OVERDUE:'red', LATE:'red', REJECTED:'red', CANCELLED:'gray', REFUNDED:'orange',
  UNPAID:'yellow', ABSENT:'red', LOST:'red',
}[s] || 'gray')
 
export const badgeClass = (s) => {
  const c = statusColor(s)
  return 'badge badge-' + c
}
