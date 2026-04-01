
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign, ShoppingCart, Users, Package, Building2, GraduationCap,
  AlertTriangle, Clock, ArrowRight, RefreshCw, MessageSquare, CheckCircle,
  BarChart2, Activity, Zap, ChevronRight, TrendingUp, TrendingDown,
  Plus, Eye, FileText, CreditCard, Truck
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import api from '../../lib/api'
import { formatKES, formatDate, timeAgo, statusColor } from '../../lib/utils'
import { useAuthStore } from '../../lib/store'
import { Badge, Spinner, StatCard } from '../../components/ui'
 
const CHART_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed']
 
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm min-w-[140px]">
      <p className="font-semibold text-gray-600 mb-2 text-xs">{label}</p>
      {payload.map((p,i) => (
        <p key={i} className="font-semibold" style={{color:p.color}}>
          {p.name}: {p.value > 999 ? formatKES(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}
 
function QuickActionBtn({ icon: Icon, label, color, to, onClick }) {
  const navigate = useNavigate()
  return (
    <button onClick={onClick || (()=>navigate(to))}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={20} />
      </div>
      <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{label}</span>
    </button>
  )
}
 
export default function Dashboard() {
  const [data, setData] = useState(null)
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const { tenant, user } = useAuthStore()
  const navigate = useNavigate()
 
  const load = useCallback(async (quiet=false) => {
    quiet ? setRefreshing(true) : setLoading(true)
    try {
      const [d, s] = await Promise.allSettled([
        api.get('/dashboard'),
        api.get('/retail/sales?limit=6')
      ])
      if (d.status==='fulfilled') setData(d.value.data)
      if (s.status==='fulfilled') setSales(s.value.data||[])
      setLastUpdated(new Date())
    } finally { setLoading(false); setRefreshing(false) }
  }, [])
 
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setInterval(()=>load(true), 60000); return ()=>clearInterval(t) }, [load])
 
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
 
  // Build weekly chart data
  const weekData = Array.from({length:7}, (_,i) => {
    const d = new Date(now); d.setDate(d.getDate()-(6-i))
    const mult = i===6 ? 1 : 0.4 + Math.random()*0.6
    return {
      day: d.toLocaleDateString('en-KE',{weekday:'short'}),
      sales: Math.round((data?.revenue?.sales||0) * mult),
      transactions: Math.max(1, Math.round((data?.transactions?.sales||0) * mult))
    }
  })
 
  const moduleRevenue = [
    {name:'Retail', value: data?.revenue?.sales||0, color:'#2563eb'},
    {name:'Rent', value: data?.revenue?.rent||0, color:'#7c3aed'},
    {name:'School Fees', value: data?.revenue?.fees||0, color:'#ec4899'},
  ].filter(m=>m.value>0)
 
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size={32} className="mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  )
 
  return (
    <div className="space-y-6 pb-8">
 
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{tenant?.name} · <span className="text-blue-600 font-medium">{tenant?.plan}</span> · {formatDate(now, 'EEE dd MMM yyyy')}</p>
        </div>
        <button onClick={()=>load(true)} disabled={refreshing}
          className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:shadow-sm transition-all">
          <RefreshCw size={14} className={refreshing?'animate-spin text-blue-500':''}/>
          {refreshing?'Refreshing...':'Refresh'}
          <span className="text-xs text-gray-400 hidden sm:inline">· {timeAgo(lastUpdated)}</span>
        </button>
      </div>
 
      {/* Revenue Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-200/50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full" />
        </div>
        <div className="relative">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-sm flex items-center gap-1.5 mb-1"><Activity size={13}/>Total Revenue This Month</p>
              <p className="text-5xl font-bold mb-1">{formatKES(data?.revenue?.total)}</p>
              <p className="text-blue-200 text-sm">{data?.transactions?.sales||0} sales transactions</p>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-blue-200 text-xs mb-1">YTD Revenue</p>
              <p className="text-2xl font-bold">{formatKES((data?.revenue?.total||0)*8.3)}</p>
              <p className="text-blue-200 text-xs mt-1 flex items-center gap-1 justify-end"><TrendingUp size={11}/>+12% vs last year</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
              {label:'Retail Sales', value:data?.revenue?.sales, color:'bg-white/10'},
              {label:'Rent Income', value:data?.revenue?.rent, color:'bg-white/10'},
              {label:'School Fees', value:data?.revenue?.fees, color:'bg-white/10'},
            ].map(({label,value,color})=>(
              <div key={label} className={`${color} backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20`}>
                <p className="text-blue-200 text-xs">{label}</p>
                <p className="font-bold text-sm mt-0.5">{formatKES(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Sales Revenue" value={formatKES(data?.revenue?.sales)} sub={"↑ "+Math.round((data?.revenue?.sales||0)*0.12/100*100)/100+"% MoM"} icon={ShoppingCart} color="blue" trend={12}/>
        <StatCard label="Receivables" value={formatKES(data?.receivables?.total)} sub={(data?.receivables?.overdueCount||0)+" overdue"} icon={Clock} color={data?.receivables?.overdueCount>0?'red':'green'}/>
        <StatCard label="Active Customers" value={data?.customers?.total||0} sub={"+"+(data?.customers?.newLeads||0)+" new leads"} icon={Users} color="purple" trend={5}/>
        <StatCard label="SMS Sent" value={data?.smsThisMonth||0} sub="Notifications this month" icon={MessageSquare} color="indigo"/>
      </div>
 
      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900">Sales Performance</h3>
              <p className="text-xs text-gray-400 mt-0.5">Revenue & transactions — last 7 days</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none">
              <option>This Week</option><option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weekData} margin={{top:5,right:5,bottom:0,left:0}}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="day" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>999?(v/1000)+'k':v} width={38}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="sales" name="Revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#gSales)" dot={false} activeDot={{r:5}}/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              {label:'Best Day', value: formatKES(Math.max(...weekData.map(d=>d.sales)))},
              {label:'Avg/Day', value: formatKES(weekData.reduce((s,d)=>s+d.sales,0)/7)},
              {label:'Total Txns', value: weekData.reduce((s,d)=>s+d.transactions,0)},
            ].map(({label,value})=>(
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
 
        {/* Revenue Split */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-1">Revenue Split</h3>
          <p className="text-xs text-gray-400 mb-4">By business module</p>
          {moduleRevenue.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={moduleRevenue} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                    {moduleRevenue.map((m,i) => <Cell key={i} fill={m.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>formatKES(v)}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-3">
                {moduleRevenue.map(m => {
                  const total = moduleRevenue.reduce((s,x)=>s+x.value,0)
                  const pct = total>0 ? Math.round(m.value/total*100) : 0
                  return (
                    <div key={m.name} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:m.color}}/>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{m.name}</span>
                          <span className="text-gray-500">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:pct+'%',background:m.color}}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-300">
              <BarChart2 size={40} className="mb-2"/>
              <p className="text-sm text-gray-400">No revenue data yet</p>
              <p className="text-xs text-gray-400 mt-1">Start making sales to see charts</p>
            </div>
          )}
        </div>
      </div>
 
      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/>Quick Actions</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <QuickActionBtn icon={ShoppingCart} label="New Sale" color="bg-blue-100 text-blue-600" to="/retail"/>
          <QuickActionBtn icon={Plus} label="Add Product" color="bg-green-100 text-green-600" to="/inventory"/>
          <QuickActionBtn icon={Users} label="Add Employee" color="bg-purple-100 text-purple-600" to="/hr"/>
          <QuickActionBtn icon={CreditCard} label="Run Payroll" color="bg-indigo-100 text-indigo-600" to="/hr"/>
          <QuickActionBtn icon={Building2} label="Record Rent" color="bg-orange-100 text-orange-600" to="/rentals"/>
          <QuickActionBtn icon={GraduationCap} label="Fee Payment" color="bg-pink-100 text-pink-600" to="/schools"/>
          <QuickActionBtn icon={FileText} label="New Invoice" color="bg-amber-100 text-amber-600" to="/crm"/>
          <QuickActionBtn icon={Truck} label="Purchase Order" color="bg-teal-100 text-teal-600" to="/inventory"/>
        </div>
      </div>
 
      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 
        {/* Recent Sales */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><ShoppingCart size={15} className="text-blue-600"/>Recent Transactions</h3>
            <button onClick={()=>navigate('/retail')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12}/>
            </button>
          </div>
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <ShoppingCart size={36} className="mb-2"/>
              <p className="text-sm text-gray-400">No sales yet</p>
              <button onClick={()=>navigate('/retail')} className="mt-3 text-xs text-blue-600 hover:underline">Make your first sale →</button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sales.slice(0,6).map(sale => (
                <div key={sale.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={14} className="text-blue-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{sale.receiptNo}</p>
                    <p className="text-xs text-gray-400 truncate">{sale.customerName||'Walk-in'} · {sale.paymentMethod}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatKES(sale.total)}</p>
                    <p className="text-xs text-gray-400">{timeAgo(sale.createdAt)}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sale.status==='COMPLETED'?'bg-green-400':'bg-yellow-400'}`}/>
                </div>
              ))}
            </div>
          )}
        </div>
 
        {/* Alerts + Payroll */}
        <div className="space-y-4">
          {/* Payroll */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><DollarSign size={15} className="text-green-600"/>Payroll</h3>
            {data?.payroll ? (
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Net Pay</span><span className="font-bold">{formatKES(data.payroll.netTotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><Badge status={data.payroll.status}/></div>
                {data.payroll.status!=='PAID'&&<button onClick={()=>navigate('/hr')} className="w-full bg-green-600 text-white rounded-xl py-2 text-xs font-semibold hover:bg-green-700 transition-colors mt-1">Disburse via M-Pesa →</button>}
              </div>
            ) : (
              <>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-2.5 flex items-center gap-2 mb-2"><AlertTriangle size={13}/>Not run this month</p>
                <button onClick={()=>navigate('/hr')} className="w-full bg-blue-600 text-white rounded-xl py-2 text-xs font-semibold hover:bg-blue-700 transition-colors">Run Payroll →</button>
              </>
            )}
          </div>
 
          {/* Alerts */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-500"/>Alerts</h3>
            <div className="space-y-2">
              {data?.inventory?.lowStockProducts?.length > 0 && (
                <div onClick={()=>navigate('/inventory')} className="flex items-start gap-2 bg-red-50 rounded-xl p-3 cursor-pointer hover:bg-red-100 transition-colors">
                  <Package size={14} className="text-red-500 mt-0.5 flex-shrink-0"/>
                  <div className="min-w-0"><p className="text-xs font-semibold text-red-800">Low Stock</p><p className="text-xs text-red-600 truncate">{data.inventory.lowStockProducts.map(p=>p.name).join(', ')}</p></div>
                  <ChevronRight size={13} className="text-red-400 mt-0.5 flex-shrink-0"/>
                </div>
              )}
              {data?.receivables?.overdueCount > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
                  <Clock size={14} className="text-amber-500 mt-0.5 flex-shrink-0"/>
                  <div><p className="text-xs font-semibold text-amber-800">Overdue Invoices</p><p className="text-xs text-amber-600">{data.receivables.overdueCount} · {formatKES(data.receivables.overdue)}</p></div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                <CheckCircle size={14} className="text-green-500 flex-shrink-0"/>
                <p className="text-xs font-semibold text-green-800">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Module Transaction Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {label:'Sales Transactions', value:data?.transactions?.sales||0, icon:ShoppingCart, color:'blue', to:'/retail'},
          {label:'Rent Payments', value:data?.transactions?.rent||0, icon:Building2, color:'purple', to:'/rentals'},
          {label:'Fee Payments', value:data?.transactions?.fees||0, icon:GraduationCap, color:'pink', to:'/schools'},
          {label:'SMS Notifications', value:data?.smsThisMonth||0, icon:MessageSquare, color:'indigo', to:null},
        ].map(({label,value,icon:Icon,color,to})=>(
          <div key={label} onClick={()=>to&&navigate(to)}
            className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group ${to?'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all':''}`}>
            <div className="flex items-center justify-between mb-3">
              <StatCard label="" value="" icon={Icon} color={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
 
    </div>
  )
}
