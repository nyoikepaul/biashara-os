export const formatKES = (amount) => 'KES ' + Number(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 0 })
export const formatDate = (date) => new Date(date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })
