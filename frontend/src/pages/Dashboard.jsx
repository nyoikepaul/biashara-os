import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, Building2, GraduationCap, MessageSquare, AlertTriangle } from 'lucide-react'
import api from '../lib/api'
import { formatKES } from '../lib/utils'
import { useAuthStore } from '../lib/store'
export default function Dashboard() {
  const [data, setData] = useState(null)
  const { tenant } = useAuthStore()
  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)).catch(() => {}) }, [])
  const stats = [
    { label: 'Sales This Month', value: formatKES(data?.revenue?.sales), icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
    { label: 'Rent Collected', value: formatKES(data?.revenue?.rent), icon: Building2, color: 'text-green-600 bg-green-50' },
    { label: 'School Fees', value: formatKES(data?.revenue?.fees), icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
    { label: 'SMS Sent', value: data?.smsThisMonth || 0, icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
  ]
  const planBadge = { STARTER: 'badge-blue', BUSINESS: 'badge-green', ENTERPRISE: 'badge-yellow' }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1><p className="text-gray-500 text-sm mt-0.5">Welcome back — here is your business overview</p></div>
        <span className={planBadge[tenant?.plan] || 'badge-blue'}>{tenant?.plan} Plan</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}><Icon size={20} /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div className="card border-0 bg-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div><p className="text-blue-200 text-sm">Total Revenue This Month</p><p className="text-4xl font-bold mt-1">{formatKES(data?.revenue?.total)}</p></div>
          <TrendingUp size={48} className="text-blue-300" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Payroll Status</h3>
          {data?.payroll ? (
            <div className="flex items-center justify-between">
              <div><p className="text-gray-500 text-sm">Net Pay This Month</p><p className="text-2xl font-bold text-gray-900">{formatKES(data.payroll.netTotal)}</p></div>
              <span className={data.payroll.status === 'PAID' ? 'badge-green' : data.payroll.status === 'APPROVED' ? 'badge-yellow' : 'badge-blue'}>{data.payroll.status}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg"><AlertTriangle size={16} /><p className="text-sm">No payroll processed this month</p></div>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Transactions This Month</h3>
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Sales', value: data?.transactions?.sales||0 }, { label: 'Rent', value: data?.transactions?.rent||0 }, { label: 'Fee Payments', value: data?.transactions?.fees||0 }].map(({ label, value }) => (
              <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
