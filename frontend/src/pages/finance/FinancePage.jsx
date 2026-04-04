import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { TrendingUp, DollarSign, FileText, BarChart2, Plus, Search, RefreshCw, X, Trash2, Download, AlertCircle, ChevronDown } from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatKESFull, formatDate, badgeClass } from '../../lib/utils'
import { ValidationModal } from '../../components/ui/ValidationModal'
import toast from 'react-hot-toast'
 
const EXPENSE_CATS = ['Rent','Salaries','Utilities','Transport','Marketing','Equipment','Repairs','Insurance','Taxes & Levies','Bank Charges','Entertainment','Printing','Security','Cleaning','Internet','Telephone','Fuel','Miscellaneous']
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 
function FinanceNav() {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
      {[{to:'/finance',l:'Expenses',icon:DollarSign,end:true},{to:'/finance/pnl',l:'P&L Report',icon:TrendingUp},{to:'/finance/vat',l:'VAT Return',icon:FileText},{to:'/finance/accounts',l:'Chart of Accounts',icon:BarChart2}].map(({to,l,icon:Icon,end})=>(
        <NavLink key={to} to={to} end={end} className={({isActive})=>'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap '+(isActive?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700')}>
          <Icon size={14}/>{l}
        </NavLink>
      ))}
    </div>
  )
}
 
function Expenses() {
  const [expenses,setExpenses] = useState([])
  const [summary,setSummary]   = useState([])
  const [loading,setL]         = useState(true)
  const [search,setSearch]     = useState('')
  const [catFilter,setCat]     = useState('')
  const [showAdd,setAdd]       = useState(false)
  const [form,setForm]         = useState({category:'Rent',description:'',amount:'',paymentMode:'MPESA',vendor:'',isRecurring:false})
  const [total,setTotal]       = useState(0)
 
  const load = async () => {
    setL(true)
    try {
      const r = await api.get('/finance/expenses'+(catFilter?'?category='+catFilter:''))
      setExpenses(r.data||[])
      setTotal(r.total||0)
      // Get summary from all expenses for category breakdown
      const allR = await api.get('/finance/expenses')
      setSummary(allR.summary||[])
    } catch{}
    finally{setL(false)}
  }
  useEffect(()=>load(),[catFilter])
 
  const save = async (e) => {
    e.preventDefault()
    try { await api.post('/finance/expenses',{...form,amount:Number(form.amount)}); toast.success('Expense recorded'); setAdd(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const del = async (id) => {
    if (!confirm('Delete this expense?')) return
    try { await api.delete('/finance/expenses/'+id); toast.success('Deleted'); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const filtered = expenses.filter(e=>!search||(e.description+e.category+(e.vendor||'')).toLowerCase().includes(search.toLowerCase()))
  const totalFiltered = filtered.reduce((s,e)=>s+(e.amount||0),0)
 
  return (
    <div className="space-y-4">
      {/* Category breakdown */}
      {summary.length>0 && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {summary.slice(0,4).map(s=>(
            <div key={s.category} onClick={()=>setCat(s.category===catFilter?'':s.category)}
              className={`rounded-xl p-3.5 border cursor-pointer transition-all ${s.category===catFilter?'border-blue-400 bg-blue-50':'border-gray-100 bg-white hover:border-gray-200'}`}>
              <p className="text-lg font-bold text-gray-900">{formatKES(s._sum.amount)}</p>
              <p className="text-xs font-medium text-gray-600">{s.category}</p>
              <p className="text-xs text-gray-400">{s._count} transactions</p>
            </div>
          ))}
        </div>
      )}
 
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search expenses..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="select w-36" value={catFilter} onChange={e=>setCat(e.target.value)}><option value="">All Categories</option>{EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
        <button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Record Expense</button>
      </div>
 
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :filtered.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><DollarSign size={32} className="mb-2 opacity-20"/><p className="text-sm">No expenses yet</p></div>
        :<>
          <table className="w-full tbl">
            <thead><tr>{['Date','Category','Description','Vendor','Mode','Amount',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(e=>(
                <tr key={e.id} className="tbl-row">
                  <td className="text-xs text-gray-500">{formatDate(e.createdAt)}</td>
                  <td><span className="badge badge-gray">{e.category}</span></td>
                  <td className="font-medium text-gray-900">{e.description}</td>
                  <td className="text-gray-500">{e.vendor||'—'}</td>
                  <td>{e.paymentMode}</td>
                  <td className="font-bold text-red-700">{formatKES(e.amount)}</td>
                  <td><button onClick={()=>del(e.id)} className="btn-ghost btn-icon-sm text-red-500"><Trash2 size={13}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-footer flex justify-between text-sm">
            <span className="text-gray-500">{filtered.length} records</span>
            <span className="font-bold text-red-700">Total: {formatKES(totalFiltered)}</span>
          </div>
        </>}
      </div>
 
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Record Expense</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Category *</label><select className="select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{EXPENSE_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="label">Description *</label><input className="input" required placeholder="e.g. Office rent — April 2025" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Amount (KES) *</label><input className="input" type="number" required min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
                <div><label className="label">Payment Mode</label><select className="select" value={form.paymentMode} onChange={e=>setForm(f=>({...f,paymentMode:e.target.value}))}>{['MPESA','CASH','BANK_TRANSFER','CHEQUE'].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
              </div>
              <div><label className="label">Vendor / Payee</label><input className="input" placeholder="e.g. Posta Kenya" value={form.vendor} onChange={e=>setForm(f=>({...f,vendor:e.target.value}))}/></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={e=>setForm(f=>({...f,isRecurring:e.target.checked}))}/>
                <label htmlFor="recurring" className="text-xs font-medium text-gray-600 cursor-pointer">Recurring monthly expense</label>
              </div>
              <div className="flex gap-3 mt-1"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Record Expense</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function PnLReport() {
  const now = new Date()
  const [period,setPeriod] = useState({month:now.getMonth()+1,year:now.getFullYear()})
  const [data,setData]     = useState(null)
  const [loading,setL]     = useState(false)
 
  const load = async () => {
    setL(true)
    try { const r=await api.get('/finance/reports/pnl?month='+period.month+'&year='+period.year); setData(r.data) }
    catch{} finally{setL(false)}
  }
  useEffect(()=>load(),[period])
 
  return (
    <div className="space-y-4 max-w-2xl">
      {/* Period selector */}
      <div className="flex items-center gap-3">
        <select className="select w-28" value={period.month} onChange={e=>setPeriod(p=>({...p,month:+e.target.value}))}>
          {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
        </select>
        <select className="select w-20" value={period.year} onChange={e=>setPeriod(p=>({...p,year:+e.target.value}))}>
          {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
        </select>
        {data&&<button className="btn-secondary flex items-center gap-2 ml-auto"><Download size={14}/>Export PDF</button>}
      </div>
 
      {loading?<div className="skeleton h-96"/>:data&&(
        <div className="card overflow-hidden anim-scale">
          {/* Header */}
          <div className="px-6 py-5" style={{background:'#0f172a'}}>
            <p className="text-white font-bold text-lg">Profit & Loss Statement</p>
            <p className="text-slate-400 text-sm mt-0.5">{data.period}</p>
          </div>
 
          <div className="p-6 space-y-5">
            {/* Revenue */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">REVENUE</p>
              {[['Retail Sales',data.revenue.retail],['Rental Income',data.revenue.rent],['School Fees',data.revenue.fees]].filter(([,v])=>v>0).map(([l,v])=>(
                <div key={l} className="flex justify-between py-2 border-b border-gray-50 text-sm"><span className="text-gray-600 pl-4">{l}</span><span className="font-medium text-gray-900">{formatKESFull(v)}</span></div>
              ))}
              <div className="flex justify-between py-2.5 font-bold text-sm border-b-2 border-gray-200 mt-1">
                <span>Total Revenue</span><span className="text-emerald-700">{formatKESFull(data.revenue.total)}</span>
              </div>
              {data.revenue.vat>0&&<div className="flex justify-between py-1.5 text-xs text-gray-500"><span className="pl-4">Less: VAT Collected (KRA)</span><span>({formatKESFull(data.revenue.vat)})</span></div>}
              <div className="flex justify-between py-1.5 text-sm font-semibold text-gray-700"><span>Net Revenue</span><span>{formatKESFull(data.revenue.netRevenue)}</span></div>
            </div>
 
            {/* Expenses */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">OPERATING EXPENSES</p>
              {Object.entries(data.expenses.breakdown||{}).filter(([,v])=>v>0).map(([cat,val])=>(
                <div key={cat} className="flex justify-between py-2 border-b border-gray-50 text-sm"><span className="text-gray-600 pl-4">{cat}</span><span className="text-gray-700">({formatKESFull(val)})</span></div>
              ))}
              {data.expenses.payroll>0&&<div className="flex justify-between py-2 border-b border-gray-50 text-sm"><span className="text-gray-600 pl-4">Salaries & Wages</span><span className="text-gray-700">({formatKESFull(data.expenses.payroll)})</span></div>}
              <div className="flex justify-between py-2.5 font-bold text-sm border-b-2 border-gray-200 mt-1">
                <span>Total Expenses</span><span className="text-red-700">({formatKESFull(data.expenses.total)})</span>
              </div>
            </div>
 
            {/* Net Profit */}
            <div className={`rounded-xl p-5 flex justify-between items-center ${data.netProfit>=0?'bg-emerald-50 border border-emerald-100':'bg-red-50 border border-red-100'}`}>
              <div>
                <p className={`text-lg font-bold ${data.netProfit>=0?'text-emerald-900':'text-red-900'}`}>Net {data.netProfit>=0?'Profit':'Loss'}</p>
                <p className={`text-xs mt-0.5 ${data.netProfit>=0?'text-emerald-600':'text-red-600'}`}>Net Margin: {data.netMargin}%</p>
              </div>
              <p className={`text-3xl font-bold ${data.netProfit>=0?'text-emerald-700':'text-red-700'}`}>{formatKES(Math.abs(data.netProfit))}</p>
            </div>
 
            {/* Transactions summary */}
            <div className="grid grid-cols-3 gap-3">
              {[['Sales Txns',data.transactions.sales],['Rent Payments',data.transactions.rent],['Fee Payments',data.transactions.fees]].map(([l,v])=>(
                <div key={l} className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xl font-bold text-gray-900">{v}</p><p className="text-xs text-gray-500">{l}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
function VATReturn() {
  const now = new Date()
  const [period,setPeriod] = useState({month:now.getMonth()+1,year:now.getFullYear()})
  const [data,setData]     = useState(null)
  const [loading,setL]     = useState(false)
 
  const load = async () => {
    setL(true)
    try { const r=await api.get('/finance/reports/vat?month='+period.month+'&year='+period.year); setData(r.data) }
    catch{} finally{setL(false)}
  }
  useEffect(()=>load(),[period])
 
  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-3">
        <select className="select w-28" value={period.month} onChange={e=>setPeriod(p=>({...p,month:+e.target.value}))}>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select>
        <select className="select w-20" value={period.year} onChange={e=>setPeriod(p=>({...p,year:+e.target.value}))}>{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
      </div>
 
      {loading?<div className="skeleton h-64"/>:data&&(
        <div className="card p-6 anim-scale space-y-4">
          <div className="flex-between">
            <div><p className="font-bold text-gray-900">VAT Return — {data.period}</p><p className="text-xs text-gray-500 mt-0.5">Kenya Revenue Authority (KRA)</p></div>
            <span className="kenya-badge kra-red">🇰🇪 KRA eTIMS</span>
          </div>
 
          <div className="space-y-2">
            {[['Standard-Rated Sales (16%)',formatKESFull(data.taxableSales),'text-gray-900'],['Output VAT (16% of sales)',formatKESFull(data.outputVat),'text-red-700'],['Exempt Sales (0%)',formatKESFull(data.exemptSales),'text-gray-700'],['Input VAT (Purchases)',formatKESFull(data.purchases.inputVat),'text-emerald-700']].map(([l,v,c])=>(
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-600">{l}</span><span className={`font-semibold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
 
          <div className={data.vatPayable>0?'bg-red-50 border border-red-100 rounded-xl p-4':'bg-emerald-50 border border-emerald-100 rounded-xl p-4'}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`font-bold ${data.vatPayable>0?'text-red-900':'text-emerald-900'}`}>{data.vatPayable>0?'VAT Payable to KRA':'VAT Refund from KRA'}</p>
                <p className="text-xs text-gray-500 mt-0.5">File by: {formatDate(data.filingDeadline)}</p>
              </div>
              <p className={`text-2xl font-bold ${data.vatPayable>0?'text-red-700':'text-emerald-700'}`}>{formatKES(data.vatPayable||data.vatRefund)}</p>
            </div>
          </div>
 
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-amber-800">{data.kraNote}</p>
          </div>
 
          <button className="btn-primary w-full justify-center"><Download size={14}/>Export for iTax Filing</button>
        </div>
      )}
    </div>
  )
}
 
function ChartOfAccounts() {
  const [accounts,setAccounts] = useState([])
  const [loading,setL]         = useState(true)
  const [showAdd,setAdd]       = useState(false)
  const [form,setForm]         = useState({code:'',name:'',type:'ASSET',description:''})
 
  const load = async () => { setL(true); try{ const r=await api.get('/finance/accounts'); setAccounts(r.data||[]) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[])
 
  const save = async (e) => {
    e.preventDefault()
    try { await api.post('/finance/accounts',form); toast.success('Account added'); setAdd(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const TYPE_COLORS = {ASSET:'badge-blue',LIABILITY:'badge-red',EQUITY:'badge-purple',REVENUE:'badge-green',EXPENSE:'badge-orange',COST_OF_GOODS:'badge-yellow'}
  const grouped = ['ASSET','LIABILITY','EQUITY','REVENUE','REVENUE','EXPENSE','COST_OF_GOODS'].filter((v,i,a)=>a.indexOf(v)===i)
    .map(type=>({ type, accounts:accounts.filter(a=>a.type===type), total:accounts.filter(a=>a.type===type).reduce((s,a)=>s+(a.balance||0),0) }))
    .filter(g=>g.accounts.length>0)
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><div className="flex-1"/><button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Add Account</button></div>
      {loading?<div className="skeleton h-64"/>:grouped.map(g=>(
        <div key={g.type} className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-2"><span className={`badge ${TYPE_COLORS[g.type]||'badge-gray'}`}>{g.type}</span><p className="section-title">{g.type.replace(/_/g,' ')}</p></div>
            <span className="font-bold text-sm">{formatKES(g.total)}</span>
          </div>
          <table className="w-full tbl">
            <thead><tr>{['Code','Account Name','Description','Balance'].map(h=><th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {g.accounts.map(a=>(
                <tr key={a.id} className="tbl-row">
                  <td className="mono">{a.code}</td>
                  <td className="font-medium text-gray-900">{a.name}</td>
                  <td className="text-gray-500">{a.description||'—'}</td>
                  <td className={`font-bold ${(a.balance||0)>0?'text-emerald-700':'text-gray-600'}`}>{formatKES(a.balance||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Add Account</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Account Code *</label><input className="input" required placeholder="e.g. 1100" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))}/></div>
                <div><label className="label">Type *</label><select className="select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE','COST_OF_GOODS'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <div><label className="label">Account Name *</label><input className="input" required placeholder="e.g. Cash at Hand" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div><label className="label">Description</label><input className="input" placeholder="Optional description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="flex gap-3"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Add Account</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
export default function FinancePage() {
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">Finance & Accounting</h1><p className="page-subtitle">Expenses · P&L Report · VAT Return (KRA) · Chart of Accounts</p></div>
      <FinanceNav/>
      <Routes>
        <Route index element={<Expenses/>}/>
        <Route path="pnl" element={<PnLReport/>}/>
        <Route path="vat" element={<VATReturn/>}/>
        <Route path="accounts" element={<ChartOfAccounts/>}/>
      </Routes>
    </div>
  )
}
