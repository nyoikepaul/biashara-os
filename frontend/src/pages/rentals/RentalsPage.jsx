import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { Building2, Home, DollarSign, AlertTriangle, Plus, Search, RefreshCw, X, Edit2, CheckCircle2, Loader2, MessageSquare, Eye, ChevronRight } from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatDate, badgeClass, getInitials } from '../../lib/utils'
import { ValidationModal } from '../../components/ui/ValidationModal'
import toast from 'react-hot-toast'
 
function RentNav() {
  const links = [
    {to:'/rentals',end:true,label:'Overview',icon:Building2},
    {to:'/rentals/properties',label:'Properties',icon:Home},
    {to:'/rentals/leases',label:'Leases',icon:DollarSign},
    {to:'/rentals/payments',label:'Payments',icon:DollarSign},
    {to:'/rentals/defaulters',label:'Defaulters',icon:AlertTriangle},
  ]
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
      {links.map(({to,label,icon:Icon,end})=>(
        <NavLink key={to} to={to} end={end} className={({isActive})=>'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap '+(isActive?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700')}>
          <Icon size={14}/>{label}
        </NavLink>
      ))}
    </div>
  )
}
 
function Overview() {
  const [stats,setStats] = useState(null)
  const [loading,setL]   = useState(true)
  useEffect(()=>{ api.get('/rentals/stats').then(r=>setStats(r.data)).catch(()=>{}).finally(()=>setL(false)) },[])
 
  const kpis = stats ? [
    {label:'Total Properties', value:stats.properties, color:'bg-blue-50 text-blue-700'},
    {label:'Occupancy Rate',   value:stats.occupancyRate+'%', color:'bg-emerald-50 text-emerald-700'},
    {label:'Vacant Units',     value:stats.vacantUnits, color:'bg-amber-50 text-amber-700'},
    {label:'Monthly Collection',value:formatKES(stats.monthlyCollection), color:'bg-purple-50 text-purple-700'},
  ] : []
 
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading ? [...Array(4)].map((_,i)=><div key={i} className="skeleton h-24"/>) : kpis.map(({label,value,color})=>(
          <div key={label} className={`rounded-xl p-4 border border-gray-100 ${color.split(' ')[0]}`}>
            <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
      {stats && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="section-title mb-4">Occupancy Summary</h3>
            <div className="space-y-3">
              {[['Total Units',stats.totalUnits,'text-gray-900'],['Occupied',stats.occupiedUnits,'text-emerald-700'],['Vacant',stats.vacantUnits,'text-amber-700'],['Active Leases',stats.activeLeases,'text-blue-700']].map(([l,v,c])=>(
                <div key={l} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{l}</span><span className={`font-bold ${c}`}>{v}</span>
                </div>
              ))}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1"><span>Occupancy</span><span className="font-semibold">{stats.occupancyRate}%</span></div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:stats.occupancyRate+'%'}}/>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="section-title mb-4">This Month</h3>
            <div className="space-y-3">
              {[['Collections',formatKES(stats.monthlyCollection),'text-emerald-700'],['Payments Received',stats.paymentsCount+' payments','text-blue-700'],['Defaulters',stats.defaulters+' tenants','text-red-700']].map(([l,v,c])=>(
                <div key={l} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{l}</span><span className={`font-bold ${c}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
function Properties() {
  const [props,setProps]   = useState([])
  const [loading,setL]     = useState(true)
  const [selected,setSel]  = useState(null)
  const [units,setUnits]   = useState([])
  const [showAddP,setAddP] = useState(false)
  const [showAddU,setAddU] = useState(false)
  const [modal,setModal]   = useState({isOpen:false})
  const [formP,setFormP]   = useState({name:'',address:'',type:'RESIDENTIAL',totalUnits:0})
  const [formU,setFormU]   = useState({unitNo:'',type:'1BR',rentAmount:'',depositAmount:'',propertyId:''})
 
  const load = async () => { setL(true); try{const r=await api.get('/rentals/properties');setProps(r.data||[])}catch{} finally{setL(false)} }
  const loadUnits = async (id) => { try{const r=await api.get('/rentals/properties/'+id+'/units');setUnits(r.data||[])}catch{} }
  useEffect(()=>load(),[])
 
  const saveProperty = async (e) => {
    e.preventDefault()
    try { await api.post('/rentals/properties',{...formP,totalUnits:Number(formP.totalUnits)}); toast.success('Property added'); setAddP(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const saveUnit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/rentals/units',{...formU,propertyId:selected.id,rentAmount:Number(formU.rentAmount),depositAmount:Number(formU.depositAmount||0)})
      toast.success('Unit added'); setAddU(false); loadUnits(selected.id); load()
    } catch(err){ toast.error(err.error||'Failed') }
  }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1"/>
        <button onClick={()=>setAddP(true)} className="btn-primary"><Plus size={14}/>Add Property</button>
      </div>
      <div className={"grid gap-4 "+(selected?'grid-cols-1 xl:grid-cols-3':'grid-cols-1')}>
        <div className={"card overflow-hidden "+(selected?'xl:col-span-2':'')}>
          {loading ? <div className="p-4 space-y-2">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-16"/>)}</div>
          : props.length===0 ? <div className="flex flex-col items-center py-14 text-gray-400"><Building2 size={32} className="mb-2 opacity-20"/><p className="text-sm">No properties yet</p></div>
          : <table className="w-full tbl">
              <thead><tr>{['Property','Type','Units','Occupied','Vacant','Monthly Rent',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {props.map(pr=>(
                  <tr key={pr.id} onClick={()=>{setSel(pr);loadUnits(pr.id)}} className={"tbl-clickable "+(selected?.id===pr.id?'bg-blue-50 hover:bg-blue-50':'')}>
                    <td><p className="font-semibold text-gray-900">{pr.name}</p><p className="text-xs text-gray-400">{pr.address}</p></td>
                    <td><span className="badge badge-blue">{pr.type}</span></td>
                    <td>{pr.totalUnits}</td>
                    <td className="text-emerald-700 font-semibold">{pr.occupiedUnits}</td>
                    <td className="text-amber-700 font-semibold">{pr.vacantUnits}</td>
                    <td className="font-bold">{formatKES(pr.monthlyRent)}</td>
                    <td><Eye size={13} className="text-gray-400"/></td>
                  </tr>
                ))}
              </tbody>
            </table>}
        </div>
        {selected && (
          <div className="card p-4">
            <div className="flex-between mb-3">
              <div><p className="font-bold text-gray-900">{selected.name}</p><p className="text-xs text-gray-500">{selected.address}</p></div>
              <div className="flex gap-1">
                <button onClick={()=>setAddU(true)} className="btn-primary btn-sm"><Plus size={12}/>Unit</button>
                <button onClick={()=>setSel(null)} className="btn-ghost btn-icon-sm"><X size={14}/></button>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {units.map(u=>(
                <div key={u.id} className={`flex items-center gap-3 rounded-xl p-3 border ${u.isOccupied?'bg-emerald-50 border-emerald-100':'bg-gray-50 border-gray-100'}`}>
                  <div className={`w-8 h-8 rounded-lg flex-center text-xs font-bold ${u.isOccupied?'bg-emerald-200 text-emerald-800':'bg-gray-200 text-gray-600'}`}>{u.unitNo}</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">{u.type}</p>
                    <p className="text-xs text-gray-500">{formatKES(u.rentAmount)}/mo</p>
                  </div>
                  <span className={`text-xs font-semibold ${u.isOccupied?'text-emerald-700':'text-gray-500'}`}>{u.isOccupied?'Occupied':'Vacant'}</span>
                </div>
              ))}
              {units.length===0&&<p className="text-center text-xs text-gray-400 py-6">No units yet — add units above</p>}
            </div>
          </div>
        )}
      </div>
 
      {showAddP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Add Property</h2><button onClick={()=>setAddP(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={saveProperty} className="space-y-3">
              <div><label className="label">Property Name *</label><input className="input" required placeholder="e.g. Westlands Apartments" value={formP.name} onChange={e=>setFormP(f=>({...f,name:e.target.value}))}/></div>
              <div><label className="label">Address *</label><input className="input" required placeholder="e.g. Westlands, Nairobi" value={formP.address} onChange={e=>setFormP(f=>({...f,address:e.target.value}))}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Type</label><select className="select" value={formP.type} onChange={e=>setFormP(f=>({...f,type:e.target.value}))}>{['RESIDENTIAL','COMMERCIAL','MIXED'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="label">Total Units</label><input className="input" type="number" min="1" value={formP.totalUnits} onChange={e=>setFormP(f=>({...f,totalUnits:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3 mt-2"><button type="button" onClick={()=>setAddP(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Add Property</button></div>
            </form>
          </div>
        </div>
      )}
      {showAddU && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Add Unit — {selected.name}</h2><button onClick={()=>setAddU(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={saveUnit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Unit No *</label><input className="input" required placeholder="e.g. A1" value={formU.unitNo} onChange={e=>setFormU(f=>({...f,unitNo:e.target.value}))}/></div>
                <div><label className="label">Type</label><select className="select" value={formU.type} onChange={e=>setFormU(f=>({...f,type:e.target.value}))}>{['Bedsitter','1BR','2BR','3BR','4BR','Studio','Shop','Office'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="label">Monthly Rent (KES) *</label><input className="input" type="number" required placeholder="15000" value={formU.rentAmount} onChange={e=>setFormU(f=>({...f,rentAmount:e.target.value}))}/></div>
                <div><label className="label">Deposit (KES)</label><input className="input" type="number" placeholder="30000" value={formU.depositAmount} onChange={e=>setFormU(f=>({...f,depositAmount:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3 mt-2"><button type="button" onClick={()=>setAddU(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Add Unit</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function Leases() {
  const [leases,setLeases]  = useState([])
  const [loading,setL]      = useState(true)
  const [showAdd,setAdd]    = useState(false)
  const [units,setUnits]    = useState([])
  const [modal,setModal]    = useState({isOpen:false})
  const [form,setForm]      = useState({unitId:'',tenantName:'',tenantPhone:'',tenantIdNo:'',rentAmount:'',depositPaid:'',startDate:''})
 
  const load = async () => { setL(true); try{const r=await api.get('/rentals/leases');setLeases(r.data||[])}catch{} finally{setL(false)} }
  const loadUnits = async () => {
    try {
      const r = await api.get('/rentals/properties')
      const allUnits = []
      for (const prop of r.data||[]) {
        const ur = await api.get('/rentals/properties/'+prop.id+'/units')
        allUnits.push(...(ur.data||[]).filter(u=>!u.isOccupied).map(u=>({...u,propertyName:prop.name})))
      }
      setUnits(allUnits)
    } catch{}
  }
  useEffect(()=>{ load(); loadUnits() },[])
 
  const saveLease = async (e) => {
    e.preventDefault()
    try {
      await api.post('/rentals/leases',{...form,rentAmount:Number(form.rentAmount),depositPaid:Number(form.depositPaid||0)})
      toast.success('Lease created'); setAdd(false); load()
    } catch(err){ toast.error(err.error||'Failed') }
  }
 
  const terminate = (id) => {
    setModal({isOpen:true,type:'warning',title:'Terminate Lease',message:'This will mark the unit as vacant. Are you sure?',confirmText:'Terminate',cancelText:'Cancel',
      onConfirm: async()=>{ try{ await api.patch('/rentals/leases/'+id+'/terminate'); toast.success('Lease terminated'); setModal({isOpen:false}); load() }catch(err){toast.error(err.error||'Failed')} },
      onCancel:()=>setModal({isOpen:false})
    })
  }
 
  const ST={ACTIVE:'badge-green',EXPIRED:'badge-gray',TERMINATED:'badge-red'}
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal}/>
      <div className="flex items-center gap-2">
        <div className="flex-1"/>
        <button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>New Lease</button>
      </div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12"/>)}</div>
        :leases.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><DollarSign size={32} className="mb-2 opacity-20"/><p className="text-sm">No leases yet</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Tenant','Unit','Property','Rent','Deposit','Start','Status','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {leases.map(l=>(
              <tr key={l.id} className="tbl-row">
                <td><p className="font-semibold text-gray-900 text-xs">{l.tenantName}</p><p className="text-xs text-gray-400">{l.tenantPhone}</p></td>
                <td className="font-mono text-xs">{l.unit?.unitNo}</td>
                <td>{l.unit?.property?.name}</td>
                <td className="font-bold">{formatKES(l.rentAmount)}</td>
                <td>{formatKES(l.depositPaid)}</td>
                <td>{formatDate(l.startDate)}</td>
                <td><span className={`badge ${ST[l.status]||'badge-gray'}`}>{l.status}</span></td>
                <td>{l.status==='ACTIVE'&&<button onClick={()=>terminate(l.id)} className="btn-danger btn-sm">End</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">New Lease Agreement</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={saveLease} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Unit *</label>
                <select className="select" required value={form.unitId} onChange={e=>{const u=units.find(u=>u.id===e.target.value);setForm(f=>({...f,unitId:e.target.value,rentAmount:u?.rentAmount||'',depositPaid:u?.depositAmount||''}));}}>
                  <option value="">Select vacant unit...</option>
                  {units.map(u=><option key={u.id} value={u.id}>{u.propertyName} — Unit {u.unitNo} ({u.type}) — {formatKES(u.rentAmount)}/mo</option>)}
                </select>
                {units.length===0&&<p className="text-xs text-amber-600 mt-1">⚠ No vacant units available</p>}
              </div>
              {[{k:'tenantName',l:'Tenant Name *',ph:'John Kamau',req:true},{k:'tenantPhone',l:'Phone *',ph:'0712345678',req:true},{k:'tenantIdNo',l:'National ID *',ph:'12345678',req:true},{k:'rentAmount',l:'Monthly Rent (KES)',ph:'15000',type:'number'},{k:'depositPaid',l:'Deposit Paid (KES)',ph:'30000',type:'number'},{k:'startDate',l:'Start Date *',type:'date',req:true}].map(({k,l,ph,type,req})=>(
                <div key={k}><label className="label">{l}</label><input className="input" placeholder={ph||''} type={type||'text'} required={req} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
              ))}
              <div className="col-span-2 flex gap-3 mt-1"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Create Lease</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function Payments() {
  const [payments,setPayments] = useState([])
  const [leases,setLeases]     = useState([])
  const [loading,setL]         = useState(true)
  const [showAdd,setAdd]       = useState(false)
  const [modal,setModal]       = useState({isOpen:false})
  const now = new Date()
  const [form,setForm]         = useState({leaseId:'',amount:'',month:now.getMonth()+1,year:now.getFullYear(),mpesaRef:'',paymentMethod:'MPESA'})
 
  const load = async () => { setL(true); try{ const r=await api.get('/rentals/payments'); setPayments(r.data||[]) }catch{} finally{setL(false)} }
  const loadLeases = async () => { try{ const r=await api.get('/rentals/leases?status=ACTIVE'); setLeases(r.data||[]) }catch{} }
  useEffect(()=>{ load(); loadLeases() },[])
 
  const save = async (e) => {
    e.preventDefault()
    setModal({isOpen:true,type:'loading',title:'Recording payment...',message:'Sending SMS to tenant'})
    try {
      await api.post('/rentals/payments',{...form,amount:Number(form.amount),month:parseInt(form.month),year:parseInt(form.year)})
      setModal({isOpen:false}); toast.success('Payment recorded & SMS sent'); setAdd(false); load()
    } catch(err){ setModal({isOpen:true,type:'error',title:'Failed',message:err.error||'Error',confirmText:'OK',onConfirm:()=>setModal({isOpen:false}),onCancel:()=>setModal({isOpen:false})}) }
  }
 
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal}/>
      <div className="flex items-center gap-2">
        <div className="flex-1"/>
        <button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Record Payment</button>
      </div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :payments.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><DollarSign size={32} className="mb-2 opacity-20"/><p className="text-sm">No payments yet</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Tenant','Unit/Property','Period','Amount','M-Pesa Ref','Status','SMS','Date'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {payments.map(pm=>(
              <tr key={pm.id} className="tbl-row">
                <td className="font-medium text-xs">{pm.lease?.tenantName}</td>
                <td className="text-xs text-gray-600">{pm.lease?.unit?.unitNo} · {pm.lease?.unit?.property?.name}</td>
                <td className="text-xs">{MONTHS[(pm.month||1)-1]} {pm.year}</td>
                <td className="font-bold text-emerald-700">{formatKES(pm.amount)}</td>
                <td className="mono text-xs">{pm.mpesaRef||'—'}</td>
                <td>{pm.isLate?<span className="badge badge-red">Late</span>:<span className="badge badge-green">On time</span>}</td>
                <td>{pm.smsSent?<span className="badge badge-blue">Sent</span>:<span className="badge badge-gray">—</span>}</td>
                <td className="text-xs text-gray-500">{formatDate(pm.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Record Rent Payment</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Tenant / Lease *</label>
                <select className="select" required value={form.leaseId} onChange={e=>{const l=leases.find(l=>l.id===e.target.value);setForm(f=>({...f,leaseId:e.target.value,amount:l?.rentAmount||''}));}}>
                  <option value="">Select tenant...</option>
                  {leases.map(l=><option key={l.id} value={l.id}>{l.tenantName} — {l.unit?.unitNo} ({formatKES(l.rentAmount)}/mo)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Month *</label>
                  <select className="select" value={form.month} onChange={e=>setForm(f=>({...f,month:+e.target.value}))}>
                    {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div><label className="label">Year</label>
                  <select className="select" value={form.year} onChange={e=>setForm(f=>({...f,year:+e.target.value}))}>
                    {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div><label className="label">Amount (KES) *</label><input className="input" type="number" required value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
                <div><label className="label">Payment Method</label>
                  <select className="select" value={form.paymentMethod} onChange={e=>setForm(f=>({...f,paymentMethod:e.target.value}))}>
                    {['MPESA','CASH','BANK_TRANSFER','CHEQUE'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">M-Pesa Reference</label><input className="input" placeholder="e.g. QA12B34CDE" value={form.mpesaRef} onChange={e=>setForm(f=>({...f,mpesaRef:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3 mt-1"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Record & Send SMS</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function Defaulters() {
  const [data,setData]     = useState(null)
  const [loading,setL]     = useState(true)
  const [sending,setSend]  = useState(false)
 
  const load = async () => { setL(true); try{ const r=await api.get('/rentals/defaulters'); setData(r) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[])
 
  const sendReminders = async () => {
    setSend(true)
    try {
      const r = await api.post('/rentals/send-reminders',{})
      toast.success('Sent '+r.sent+' SMS reminders!')
      load()
    } catch(err){ toast.error(err.error||'Failed') }
    finally{ setSend(false) }
  }
 
  return (
    <div className="space-y-4">
      {data && (
        <div className="card p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/>Rent Defaulters — {new Date().toLocaleString('default',{month:'long',year:'numeric'})}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{data.count} tenants owe a total of <span className="font-bold text-red-700">{formatKES(data.totalOwed)}</span></p>
            </div>
            <button onClick={sendReminders} disabled={sending||!data.count} className="btn-warning flex items-center gap-2">
              {sending?<><Loader2 size={14} className="animate-spin"/>Sending...</>:<><MessageSquare size={14}/>Send Bulk SMS Reminders</>}
            </button>
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12"/>)}</div>
        :!data?.data?.length?<div className="flex flex-col items-center py-14 text-emerald-600"><CheckCircle2 size={32} className="mb-2"/><p className="font-semibold">All tenants are paid up!</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Tenant','Phone','Unit','Property','Rent Owed','Action'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {data.data.map((d,i)=>(
              <tr key={i} className="tbl-row">
                <td className="font-semibold text-gray-900">{d.tenantName}</td>
                <td className="mono text-xs">{d.tenantPhone}</td>
                <td>{d.unitNo}</td>
                <td>{d.property}</td>
                <td className="font-bold text-red-700">{formatKES(d.rentAmount)}</td>
                <td><button className="btn-sm btn-warning">Call</button></td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  )
}
 
export default function RentalsPage() {
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">Rentals Management</h1><p className="page-subtitle">Properties · Units · Leases · Rent collection · M-Pesa · SMS Reminders</p></div>
      <RentNav/>
      <Routes>
        <Route index element={<Overview/>}/>
        <Route path="properties" element={<Properties/>}/>
        <Route path="leases" element={<Leases/>}/>
        <Route path="payments" element={<Payments/>}/>
        <Route path="defaulters" element={<Defaulters/>}/>
      </Routes>
    </div>
  )
}
