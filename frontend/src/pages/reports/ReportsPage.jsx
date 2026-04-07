import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Package, DollarSign, Download, RefreshCw } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../lib/api'
import { formatKES, formatKESFull, formatDate } from '../../lib/utils'
 
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 
function ChartTip({ active, payload, label }) {
  if (!active||!payload?.length) return null
  return <div className="bg-gray-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl"><p className="text-gray-400 mb-1">{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color}}>{p.name}: {p.value>100?formatKES(p.value):p.value}</p>)}</div>
}
 
export default function ReportsPage() {
  const [module,setMod]   = useState('Sales Analytics')
  const [data,setData]    = useState(null)
  const [loading,setL]    = useState(false)
  const now = new Date()
  const [period,setPeriod] = useState({month:now.getMonth()+1,year:now.getFullYear()})
 
  const MODULES = [
    {l:'Sales Analytics', icon:BarChart3, fetch: ()=>api.get('/crm/reports/sales?days=30')},
    {l:'P&L Report',      icon:TrendingUp, fetch: ()=>api.get('/finance/reports/pnl?month='+period.month+'&year='+period.year)},
    {l:'VAT Return',      icon:DollarSign, fetch: ()=>api.get('/finance/reports/vat?month='+period.month+'&year='+period.year)},
    {l:'Stock Valuation', icon:Package,    fetch: ()=>api.get('/inventory/reports/valuation')},
  ]
 
  const load = async () => {
    setL(true); setData(null)
    try { const mod = MODULES.find(m=>m.l===module); if(mod){ const r=await mod.fetch(); setData(r.data) } }
    catch{} finally{setL(false)}
  }
  useEffect(()=>load(),[module,period])
 
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Sales · Financial · Inventory reports</p></div>
 
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Sidebar */}
        <div className="card p-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Report Types</p>
          {MODULES.map(({l,icon:Icon})=>(
            <button key={l} onClick={()=>setMod(l)}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 " + (module===l?'bg-blue-600 text-white':'text-gray-600 hover:bg-gray-100')}>
              <Icon size={15}/>{l}
            </button>
          ))}
 
          {['P&L Report','VAT Return'].includes(module)&&(
            <div className="mt-4 space-y-2 px-1">
              <p className="text-xs font-semibold text-gray-500">Period</p>
              <select className="select text-xs" value={period.month} onChange={e=>setPeriod(p=>({...p,month:+e.target.value}))}>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select>
              <select className="select text-xs" value={period.year} onChange={e=>setPeriod(p=>({...p,year:+e.target.value}))}>{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
            </div>
          )}
        </div>
 
        {/* Content */}
        <div className="xl:col-span-3">
          <div className="card">
            <div className="card-header">
              <p className="section-title">{module}</p>
              <div className="flex items-center gap-2">
                <button onClick={load} className="btn-ghost btn-icon-sm"><RefreshCw size={13}/></button>
                <button className="btn-secondary btn-sm"><Download size={13}/>Export</button>
              </div>
            </div>
            <div className="p-5">
              {loading?<div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-12"/>)}</div>
              :!data?<div className="flex flex-col items-center py-16 text-gray-400"><BarChart3 size={36} className="mb-2 opacity-20"/><p className="text-sm">No data for selected period</p></div>
              :(
                <>
                  {module==='Sales Analytics'&&data.topProducts&&(
                    <div className="space-y-5">
                      {/* Top products chart */}
                      {data.topProducts.length>0&&(
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Top Products by Revenue (Last 30 days)</p>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.topProducts.slice(0,8)} layout="vertical" margin={{left:80}}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                              <XAxis type="number" tick={{fontSize:10}} tickFormatter={v=>v>999?(v/1000)+'k':v}/>
                              <YAxis type="category" dataKey="name" tick={{fontSize:11}} width={80}/>
                              <Tooltip content={<ChartTip/>}/>
                              <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[0,4,4,0]}/>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      {/* Payment methods */}
                      {data.byPaymentMethod&&data.byPaymentMethod.length>0&&(
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase mb-3">Payment Methods</p>
                          <div className="space-y-2">
                            {data.byPaymentMethod.map(m=>{
                              const total=data.byPaymentMethod.reduce((s,x)=>s+Number(x._sum?.total||0),0)
                              const pct=total>0?Math.round(Number(m._sum?.total||0)/total*100):0
                              return (
                                <div key={m.paymentMethod} className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-600 w-24">{m.paymentMethod}</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={"h-full rounded-full "+(m.paymentMethod==='MPESA'?'bg-emerald-500':m.paymentMethod==='CASH'?'bg-blue-500':'bg-purple-500')} style={{width:pct+'%'}}/>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                                  <span className="text-xs text-gray-500 w-20 text-right">{formatKES(m._sum?.total)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {!data.topProducts.length&&!data.byPaymentMethod?.length&&(
                        <div className="text-center py-12 text-gray-400"><BarChart3 size={32} className="mb-2 opacity-20"/><p>No sales data for last 30 days</p></div>
                      )}
                    </div>
                  )}
 
                  {module==='P&L Report'&&data.revenue&&(
                    <div className="space-y-3 max-w-md">
                      {[['Total Revenue',data.revenue.total,'text-emerald-700 font-bold text-lg'],['Net Revenue (ex-VAT)',data.revenue.netRevenue,'text-gray-900']].map(([l,v,c])=>(
                        <div key={l} className="flex justify-between py-2 border-b border-gray-100 text-sm"><span className="text-gray-600">{l}</span><span className={c}>{formatKESFull(v)}</span></div>
                      ))}
                      <div className="flex justify-between py-2 border-b border-gray-100 text-sm"><span className="text-gray-600">Total Expenses</span><span className="text-red-700">({formatKESFull(data.expenses.total)})</span></div>
                      <div className={"flex justify-between p-4 rounded-xl "+(data.netProfit>=0?'bg-emerald-50':'bg-red-50')}>
                        <span className="font-bold">Net {data.netProfit>=0?'Profit':'Loss'}</span>
                        <span className={"text-xl font-bold "+(data.netProfit>=0?'text-emerald-700':'text-red-700')}>{formatKES(Math.abs(data.netProfit))}</span>
                      </div>
                      <p className="text-xs text-gray-500 text-center">Net Margin: {data.netMargin}%</p>
                    </div>
                  )}
 
                  {module==='VAT Return'&&data.outputVat!==undefined&&(
                    <div className="space-y-3 max-w-md">
                      {[['Taxable Sales (16%)',formatKESFull(data.taxableSales),'text-gray-900'],['Output VAT',formatKESFull(data.outputVat),'text-red-700'],['Input VAT (Purchases)',formatKESFull(data.purchases?.inputVat||0),'text-emerald-700']].map(([l,v,c])=>(
                        <div key={l} className="flex justify-between py-2 border-b border-gray-100 text-sm"><span className="text-gray-600">{l}</span><span className={`font-semibold ${c}`}>{v}</span></div>
                      ))}
                      <div className={"flex justify-between p-4 rounded-xl "+(data.vatPayable>0?'bg-red-50 border border-red-100':'bg-emerald-50 border border-emerald-100')}>
                        <div><p className="font-bold">{data.vatPayable>0?'VAT Payable to KRA':'VAT Refund'}</p><p className="text-xs text-gray-500">File by: {formatDate(data.filingDeadline)}</p></div>
                        <span className={"text-xl font-bold "+(data.vatPayable>0?'text-red-700':'text-emerald-700')}>{formatKES(data.vatPayable||data.vatRefund)}</span>
                      </div>
                    </div>
                  )}
 
                  {module==='Stock Valuation'&&data.totals&&(
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[{l:'Cost Value',v:data.totals.costValue,c:'bg-blue-50 text-blue-700'},{l:'Retail Value',v:data.totals.retailValue,c:'bg-emerald-50 text-emerald-700'},{l:'Potential Profit',v:data.totals.potentialProfit,c:'bg-purple-50 text-purple-700'}].map(({l,v,c})=>(
                          <div key={l} className={`rounded-xl p-4 ${c.split(' ')[0]}`}><p className={`text-xl font-bold ${c.split(' ')[1]}`}>{formatKES(v)}</p><p className="text-xs text-gray-500 mt-1">{l}</p></div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{data.totals.totalUnits||0} total units across {data.items?.length||0} products</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
