import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Headphones, Users, Target, FileText, ShoppingBag, Plus, Search, X, RefreshCw, Eye } from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatDate, badgeClass } from '../../lib/utils'
import toast from 'react-hot-toast'
 
function CRMNav() {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
      {[{to:'/crm',l:'Customers',icon:Users,end:true},{to:'/crm/leads',l:'Leads',icon:Target},{to:'/crm/invoices',l:'Invoices',icon:FileText},{to:'/crm/orders',l:'Orders',icon:ShoppingBag}].map(({to,l,icon:Icon,end})=>(
        <NavLink key={to} to={to} end={end} className={({isActive})=>'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap '+(isActive?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700')}>
          <Icon size={14}/>{l}
        </NavLink>
      ))}
    </div>
  )
}
 
function Customers() {
  const [customers,setC] = useState([])
  const [loading,setL]   = useState(true)
  const [search,setS]    = useState('')
  const [showAdd,setAdd] = useState(false)
  const [form,setForm]   = useState({name:'',phone:'',email:'',customerType:'RETAIL',county:'Nairobi',creditLimit:'0'})
 
  const load = async () => { setL(true); try{ const r=await api.get('/crm/customers'); setC(r.data||[]) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[])
 
  const save = async (e) => {
    e.preventDefault()
    try { await api.post('/crm/customers',{...form,creditLimit:Number(form.creditLimit)}); toast.success('Customer added'); setAdd(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const filtered = customers.filter(c=>!search||(c.name+c.phone+(c.email||'')).toLowerCase().includes(search.toLowerCase()))
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search customers..." value={search} onChange={e=>setS(e.target.value)}/></div>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
        <button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Add Customer</button>
      </div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :filtered.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><Users size={32} className="mb-2 opacity-20"/><p className="text-sm">{search?'No customers match':'No customers yet'}</p><button onClick={()=>setAdd(true)} className="btn-primary btn-sm mt-3">Add First Customer</button></div>
        :<table className="w-full tbl">
          <thead><tr>{['Name','Phone','Email','Type','County','Total Revenue'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id} className="tbl-row">
                <td className="font-semibold text-gray-900">{c.name}</td>
                <td className="mono text-xs">{c.phone}</td>
                <td className="text-gray-500">{c.email||'—'}</td>
                <td><span className="badge badge-blue">{c.customerType}</span></td>
                <td>{c.county||'—'}</td>
                <td className="font-bold text-emerald-700">{formatKES(c.totalRevenue||0)}</td>
              </tr>
            ))}
          </tbody>
        </table>}
        {filtered.length>0&&<div className="card-footer text-xs text-gray-500">{filtered.length} customers</div>}
      </div>
      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Add Customer</h2><button onClick={()=>setAdd(false)} className="text-gray-400"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Name *</label><input className="input" required placeholder="Kamau Enterprises" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div><label className="label">Phone *</label><input className="input" required placeholder="0712345678" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
              <div><label className="label">Email</label><input className="input" type="email" placeholder="info@business.co.ke" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Type</label><select className="select" value={form.customerType} onChange={e=>setForm(f=>({...f,customerType:e.target.value}))}>{['RETAIL','WHOLESALE','CORPORATE','GOVERNMENT','NGO'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="label">Credit Limit (KES)</label><input className="input" type="number" value={form.creditLimit} onChange={e=>setForm(f=>({...f,creditLimit:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Add Customer</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function Leads() {
  const [leads,setLeads] = useState([])
  const [loading,setL]   = useState(true)
  const [showAdd,setAdd] = useState(false)
  const [form,setForm]   = useState({title:'',source:'DIRECT',status:'NEW',priority:'MEDIUM',value:'',description:''})
 
  const load = async () => { setL(true); try{ const r=await api.get('/crm/leads'); setLeads(r.data||[]) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[])
 
  const save = async (e) => {
    e.preventDefault()
    try { await api.post('/crm/leads',{...form,value:Number(form.value||0)}); toast.success('Lead added'); setAdd(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><div className="flex-1"/>
        <button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Add Lead</button>
      </div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :leads.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><Target size={32} className="mb-2 opacity-20"/><p className="text-sm">No leads yet</p><button onClick={()=>setAdd(true)} className="btn-primary btn-sm mt-3">Add First Lead</button></div>
        :<table className="w-full tbl">
          <thead><tr>{['Title','Source','Status','Priority','Value','Date'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {leads.map(l=>(
              <tr key={l.id} className="tbl-row">
                <td className="font-medium text-gray-900">{l.title}</td>
                <td><span className="badge badge-gray">{l.source}</span></td>
                <td><span className={badgeClass(l.status)}>{l.status}</span></td>
                <td><span className={badgeClass(l.priority)}>{l.priority}</span></td>
                <td className="font-semibold">{l.value?formatKES(l.value):'—'}</td>
                <td className="text-xs text-gray-500">{formatDate(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
      {showAdd&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Add Lead</h2><button onClick={()=>setAdd(false)} className="text-gray-400"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Title *</label><input className="input" required placeholder="e.g. Westgate Supermarket — POS System" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
              <div><label className="label">Description</label><input className="input" placeholder="Brief description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Source</label><select className="select" value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>{['DIRECT','REFERRAL','SOCIAL_MEDIA','WEBSITE','COLD_CALL','EMAIL','EXHIBITION'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}</select></div>
                <div><label className="label">Priority</label><select className="select" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>{['LOW','MEDIUM','HIGH','URGENT'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="label">Est. Value (KES)</label><input className="input" type="number" placeholder="50000" value={form.value} onChange={e=>setForm(f=>({...f,value:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Add Lead</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function Invoices() {
  const [invoices,setInv] = useState([])
  const [loading,setL]    = useState(true)
  useEffect(()=>{ setL(true); api.get('/crm/invoices').then(r=>setInv(r.data||[])).catch(()=>{}).finally(()=>setL(false)) },[])
  const ST={DRAFT:'badge-gray',UNPAID:'badge-yellow',PARTIAL:'badge-blue',PAID:'badge-green',OVERDUE:'badge-red',CANCELLED:'badge-gray'}
  return (
    <div className="card overflow-hidden">
      {loading?<div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
      :invoices.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><FileText size={32} className="mb-2 opacity-20"/><p className="text-sm">No invoices yet — create from Sales Orders</p></div>
      :<table className="w-full tbl">
        <thead><tr>{['Invoice #','Customer','Date','Due','Total','Paid','Balance','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {invoices.map(i=>(
            <tr key={i.id} className="tbl-row">
              <td className="mono font-semibold text-blue-700">{i.invoiceNo}</td>
              <td>{i.customer?.name}</td>
              <td className="text-xs">{formatDate(i.invoiceDate||i.createdAt)}</td>
              <td className="text-xs">{formatDate(i.dueDate)}</td>
              <td className="font-bold">{formatKES(i.total)}</td>
              <td className="text-emerald-700 font-semibold">{formatKES(i.amountPaid)}</td>
              <td className={i.balance>0?'text-red-700 font-bold':'text-emerald-600'}>{i.balance>0?formatKES(i.balance):'✓ Paid'}</td>
              <td><span className={"badge "+(ST[i.status]||'badge-gray')}>{i.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
  )
}
 
function Orders() {
  const [orders,setO] = useState([])
  const [loading,setL]= useState(true)
  useEffect(()=>{ setL(true); api.get('/crm/orders').then(r=>setO(r.data||[])).catch(()=>{}).finally(()=>setL(false)) },[])
  const ST={DRAFT:'badge-gray',CONFIRMED:'badge-blue',PROCESSING:'badge-blue',DELIVERED:'badge-green',CANCELLED:'badge-red'}
  return (
    <div className="card overflow-hidden">
      {loading?<div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
      :orders.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><ShoppingBag size={32} className="mb-2 opacity-20"/><p className="text-sm">No sales orders yet</p></div>
      :<table className="w-full tbl">
        <thead><tr>{['Order #','Customer','Date','Items','Total','Payment','Status'].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {orders.map(o=>(
            <tr key={o.id} className="tbl-row">
              <td className="mono font-semibold text-blue-700">{o.orderNo}</td>
              <td>{o.customer?.name}</td>
              <td className="text-xs">{formatDate(o.orderDate||o.createdAt)}</td>
              <td>{o.items?.length||0}</td>
              <td className="font-bold">{formatKES(o.total)}</td>
              <td><span className={badgeClass(o.paymentStatus||o.status)}>{o.paymentMethod}</span></td>
              <td><span className={"badge "+(ST[o.status]||'badge-gray')}>{o.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>}
    </div>
  )
}
 
export default function CRMPage() {
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">CRM & Sales</h1><p className="page-subtitle">Customers · Leads · Invoices · Sales Orders</p></div>
      <CRMNav/>
      <Routes>
        <Route index element={<Customers/>}/>
        <Route path="leads" element={<Leads/>}/>
        <Route path="invoices" element={<Invoices/>}/>
        <Route path="orders" element={<Orders/>}/>
      </Routes>
    </div>
  )
}
