import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { GraduationCap, DollarSign, AlertTriangle, Plus, Search, RefreshCw, X, Loader2, CheckCircle2, MessageSquare, Users, BookOpen } from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatDate, badgeClass } from '../../lib/utils'
import { ValidationModal } from '../../components/ui/ValidationModal'
import toast from 'react-hot-toast'
 
const TERMS = [1,2,3]
const CLASSES = ['PP1','PP2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']
 
function SchoolNav() {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
      {[{to:'/schools',l:'Overview',icon:GraduationCap,end:true},{to:'/schools/students',l:'Students',icon:Users},{to:'/schools/fees',l:'Fee Structures',icon:BookOpen},{to:'/schools/payments',l:'Payments',icon:DollarSign},{to:'/schools/defaulters',l:'Defaulters',icon:AlertTriangle}].map(({to,l,icon:Icon,end})=>(
        <NavLink key={to} to={to} end={end} className={({isActive})=>'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap '+(isActive?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700')}>
          <Icon size={14}/>{l}
        </NavLink>
      ))}
    </div>
  )
}
 
function Overview() {
  const [stats,setStats] = useState(null)
  const [loading,setL]   = useState(true)
  useEffect(()=>{ api.get('/schools/stats').then(r=>setStats(r.data)).catch(()=>{}).finally(()=>setL(false)) },[])
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {loading?[...Array(4)].map((_,i)=><div key={i} className="skeleton h-24"/>):[
          {l:'Total Students',v:stats?.totalStudents||0,c:'bg-blue-50 text-blue-700'},
          {l:'Classes',v:stats?.classes||0,c:'bg-purple-50 text-purple-700'},
          {l:'This Month Fees',v:formatKES(stats?.monthlyCollection||0),c:'bg-emerald-50 text-emerald-700'},
          {l:'Current Term',v:'Term '+(stats?.currentTerm||1),c:'bg-amber-50 text-amber-700'},
        ].map(({l,v,c})=>(
          <div key={l} className={`rounded-xl p-4 border border-gray-100 ${c.split(' ')[0]}`}>
            <p className={`text-2xl font-bold ${c.split(' ')[1]}`}>{v}</p>
            <p className="text-xs text-gray-500 mt-1">{l}</p>
          </div>
        ))}
      </div>
      {stats && (
        <div className="card p-5 max-w-sm">
          <h3 className="section-title mb-3">Fee Collection</h3>
          <div className="space-y-2">
            {[['Expected (Term)',formatKES(stats.totalExpected),'text-gray-900'],['Collected (Month)',formatKES(stats.monthlyCollection),'text-emerald-700'],['Transactions',stats.paymentsCount+' payments','text-blue-700']].map(([l,v,c])=>(
              <div key={l} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                <span className="text-gray-600">{l}</span><span className={`font-bold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
 
function Students() {
  const [students,setStudents] = useState([])
  const [loading,setL]         = useState(true)
  const [search,setSearch]     = useState('')
  const [cls,setCls]           = useState('')
  const [showAdd,setAdd]       = useState(false)
  const [form,setForm]         = useState({name:'',admNo:'',dob:'',gender:'MALE',guardianName:'',guardianPhone:'',guardianEmail:'',class:'Grade 1',stream:'',year:new Date().getFullYear()})
 
  const load = async () => { setL(true); try{ const r=await api.get('/schools/students'+(cls?'?class='+cls:'')); setStudents(r.data||[]) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[cls])
 
  const save = async (e) => {
    e.preventDefault()
    try { await api.post('/schools/students',form); toast.success('Student registered'); setAdd(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const filtered = students.filter(s=>!search||(s.name+s.admNo+s.guardianPhone).toLowerCase().includes(search.toLowerCase()))
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search students, admission no, guardian phone..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="select w-32" value={cls} onChange={e=>setCls(e.target.value)}><option value="">All Classes</option>{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
        <button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Register Student</button>
      </div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :filtered.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><GraduationCap size={32} className="mb-2 opacity-20"/><p className="text-sm">{search?'No students match':'No students yet'}</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Admission No','Student Name','Class','Guardian','Phone','Year'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id} className="tbl-row">
                <td className="mono">{s.admNo}</td>
                <td className="font-semibold text-gray-900">{s.name}</td>
                <td><span className="badge badge-blue">{s.class}{s.stream?' '+s.stream:''}</span></td>
                <td>{s.guardianName}</td>
                <td className="mono text-xs">{s.guardianPhone}</td>
                <td>{s.year}</td>
              </tr>
            ))}
          </tbody>
        </table>}
        {filtered.length>0&&<div className="card-footer text-xs text-gray-500">{filtered.length} students</div>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 my-4 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Register Student</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Full Name *</label><input className="input" required placeholder="e.g. Jane Wanjiku Kamau" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              {[{k:'admNo',l:'Admission No',ph:'Leave blank to auto-generate'},{k:'guardianName',l:'Guardian Name *',ph:'John Kamau',req:true},{k:'guardianPhone',l:'Guardian Phone *',ph:'0712345678',req:true},{k:'guardianEmail',l:'Guardian Email',ph:'parent@email.com',type:'email'},{k:'dob',l:'Date of Birth *',type:'date',req:true}].map(({k,l,ph,type,req})=>(
                <div key={k}><label className="label">{l}</label><input className="input" placeholder={ph||''} type={type||'text'} required={req} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
              ))}
              <div><label className="label">Gender</label><select className="select" value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>{['MALE','FEMALE'].map(g=><option key={g} value={g}>{g}</option>)}</select></div>
              <div><label className="label">Class *</label><select className="select" required value={form.class} onChange={e=>setForm(f=>({...f,class:e.target.value}))}>{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="label">Stream</label><input className="input" placeholder="e.g. North" value={form.stream} onChange={e=>setForm(f=>({...f,stream:e.target.value}))}/></div>
              <div><label className="label">Year</label><input className="input" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:+e.target.value}))}/></div>
              <div className="col-span-2 flex gap-3 mt-1"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Register Student</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function FeeStructures() {
  const [fees,setFees]   = useState([])
  const [loading,setL]   = useState(true)
  const [showAdd,setAdd] = useState(false)
  const [form,setForm]   = useState({class:'Grade 1',term:1,year:new Date().getFullYear(),tuition:'',lunch:'0',activity:'0',boarding:'0'})
 
  const load = async () => { setL(true); try{ const r=await api.get('/schools/fee-structures'); setFees(r.data||[]) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[])
 
  const save = async (e) => {
    e.preventDefault()
    try { await api.post('/schools/fee-structures',form); toast.success('Fee structure saved'); setAdd(false); load() }
    catch(err){ toast.error(err.error||'Failed') }
  }
 
  const total = Number(form.tuition||0)+Number(form.lunch||0)+Number(form.activity||0)+Number(form.boarding||0)
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><div className="flex-1"/><button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Add Fee Structure</button></div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :fees.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><BookOpen size={32} className="mb-2 opacity-20"/><p className="text-sm">No fee structures yet</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Class','Term','Year','Tuition','Lunch','Activity','Boarding','Total'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {fees.map(f=>(
              <tr key={f.id} className="tbl-row">
                <td className="font-semibold">{f.class}</td>
                <td>Term {f.term}</td>
                <td>{f.year}</td>
                <td>{formatKES(f.tuition)}</td>
                <td>{f.lunch>0?formatKES(f.lunch):'—'}</td>
                <td>{f.activity>0?formatKES(f.activity):'—'}</td>
                <td>{f.boarding>0?formatKES(f.boarding):'—'}</td>
                <td className="font-bold text-blue-700">{formatKES(f.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 anim-scale">
            <div className="flex-between mb-4"><h2 className="font-bold">Add Fee Structure</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="label">Class *</label><select className="select" value={form.class} onChange={e=>setForm(f=>({...f,class:e.target.value}))}>{CLASSES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="label">Term</label><select className="select" value={form.term} onChange={e=>setForm(f=>({...f,term:+e.target.value}))}>{TERMS.map(t=><option key={t} value={t}>Term {t}</option>)}</select></div>
                <div><label className="label">Year</label><input className="input" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:+e.target.value}))}/></div>
              </div>
              {[{k:'tuition',l:'Tuition (KES) *',req:true},{k:'lunch',l:'Lunch'},{k:'activity',l:'Activity Fee'},{k:'boarding',l:'Boarding'}].map(({k,l,req})=>(
                <div key={k}><label className="label">{l}</label><input className="input" type="number" min="0" required={req} placeholder="0" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
              ))}
              {total>0&&<div className="bg-blue-50 rounded-xl p-3 flex justify-between"><span className="text-sm font-semibold text-blue-900">Total Per Term</span><span className="font-bold text-blue-700">{formatKES(total)}</span></div>}
              <div className="flex gap-3"><button type="button" onClick={()=>setAdd(false)} className="btn-secondary flex-1">Cancel</button><button type="submit" className="btn-primary flex-1">Save Structure</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
function FeePayments() {
  const [payments,setPayments] = useState([])
  const [students,setStudents] = useState([])
  const [loading,setL]         = useState(true)
  const [showAdd,setAdd]       = useState(false)
  const [modal,setModal]       = useState({isOpen:false})
  const now = new Date()
  const [form,setForm]         = useState({studentId:'',term:1,year:now.getFullYear(),amount:'',mpesaRef:'',paymentMode:'MPESA'})
 
  const load = async () => { setL(true); try{ const r=await api.get('/schools/payments'); setPayments(r.data||[]) }catch{} finally{setL(false)} }
  const loadStudents = async () => { try{ const r=await api.get('/schools/students'); setStudents(r.data||[]) }catch{} }
  useEffect(()=>{ load(); loadStudents() },[])
 
  const save = async (e) => {
    e.preventDefault()
    setModal({isOpen:true,type:'loading',title:'Recording payment...',message:'Sending SMS to guardian'})
    try {
      const r = await api.post('/schools/payments',{...form,amount:Number(form.amount),term:parseInt(form.term),year:parseInt(form.year)})
      setModal({isOpen:true,type:'success',title:'Payment Recorded!',message:'Receipt: '+r.data.receiptNo+(r.data.balance>0?' · Balance: '+formatKES(r.data.balance):' · FULLY PAID ✓'),autoClose:3000,confirmText:'OK',onConfirm:()=>{setModal({isOpen:false});setAdd(false);load()},onCancel:()=>{setModal({isOpen:false});setAdd(false);load()}})
    } catch(err){ setModal({isOpen:true,type:'error',title:'Failed',message:err.error||'Error',confirmText:'OK',onConfirm:()=>setModal({isOpen:false}),onCancel:()=>setModal({isOpen:false})}) }
  }
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal}/>
      <div className="flex items-center gap-2"><div className="flex-1"/><button onClick={()=>setAdd(true)} className="btn-primary"><Plus size={14}/>Record Fee Payment</button></div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :payments.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><DollarSign size={32} className="mb-2 opacity-20"/><p className="text-sm">No fee payments yet</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Receipt No','Student','Class','Term','Amount Paid','Balance','M-Pesa','SMS','Date'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {payments.map(pm=>(
              <tr key={pm.id} className="tbl-row">
                <td className="mono text-xs">{pm.receiptNo}</td>
                <td><p className="font-semibold text-xs text-gray-900">{pm.student?.name}</p><p className="mono text-xs text-gray-400">{pm.student?.admNo}</p></td>
                <td><span className="badge badge-blue">{pm.student?.class}</span></td>
                <td>T{pm.term} {pm.year}</td>
                <td className="font-bold text-emerald-700">{formatKES(pm.amount)}</td>
                <td className={pm.balance>0?'text-red-600 font-semibold':'text-emerald-600 font-semibold'}>{pm.balance>0?formatKES(pm.balance):'PAID ✓'}</td>
                <td className="mono text-xs">{pm.mpesaRef||'—'}</td>
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
            <div className="flex-between mb-4"><h2 className="font-bold">Record Fee Payment</h2><button onClick={()=>setAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3">
              <div><label className="label">Student *</label>
                <select className="select" required value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))}>
                  <option value="">Select student...</option>
                  {students.map(s=><option key={s.id} value={s.id}>{s.admNo} — {s.name} ({s.class})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Term</label><select className="select" value={form.term} onChange={e=>setForm(f=>({...f,term:+e.target.value}))}>{TERMS.map(t=><option key={t} value={t}>Term {t}</option>)}</select></div>
                <div><label className="label">Year</label><input className="input" type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:+e.target.value}))}/></div>
                <div><label className="label">Amount (KES) *</label><input className="input" type="number" required placeholder="5000" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></div>
                <div><label className="label">Payment Mode</label><select className="select" value={form.paymentMode} onChange={e=>setForm(f=>({...f,paymentMode:e.target.value}))}>{['MPESA','CASH','BANK_TRANSFER','CHEQUE'].map(m=><option key={m} value={m}>{m}</option>)}</select></div>
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
  const now = new Date()
  const [term,setTerm]   = useState(Math.ceil((now.getMonth()+1)/4))
  const [year,setYear]   = useState(now.getFullYear())
  const [data,setData]   = useState(null)
  const [loading,setL]   = useState(true)
  const [sending,setSend]= useState(false)
 
  const load = async () => { setL(true); try{ const r=await api.get('/schools/defaulters?term='+term+'&year='+year); setData(r) }catch{} finally{setL(false)} }
  useEffect(()=>load(),[term,year])
 
  const sendReminders = async () => {
    setSend(true)
    try { const r=await api.post('/schools/send-reminders',{term,year}); toast.success('Sent '+r.sent+' SMS reminders!') }
    catch(err){ toast.error(err.error||'Failed') }
    finally{ setSend(false) }
  }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <select className="select w-24" value={term} onChange={e=>{setTerm(+e.target.value)}}>{TERMS.map(t=><option key={t} value={t}>Term {t}</option>)}</select>
        <select className="select w-20" value={year} onChange={e=>setYear(+e.target.value)}>{[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}</select>
        {data?.count>0&&<button onClick={sendReminders} disabled={sending} className="btn-warning flex items-center gap-2">{sending?<><Loader2 size={14} className="animate-spin"/>Sending...</>:<><MessageSquare size={14}/>Send Bulk SMS ({data.count})</>}</button>}
        <div className="flex-1"/>
        {data&&<div className="text-sm font-semibold text-red-700">{data.count} students owe {formatKES(data.totalOwed)}</div>}
      </div>
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
        :!data?.data?.length?<div className="flex flex-col items-center py-14 text-emerald-600"><CheckCircle2 size={32} className="mb-2"/><p className="font-semibold">All fees paid up for this term!</p></div>
        :<table className="w-full tbl">
          <thead><tr>{['Adm No','Student','Class','Guardian','Phone','Expected','Paid','Balance'].map(h=><th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {data.data.map(s=>(
              <tr key={s.id} className="tbl-row">
                <td className="mono text-xs">{s.admNo}</td>
                <td className="font-semibold text-gray-900">{s.name}</td>
                <td><span className="badge badge-blue">{s.class}</span></td>
                <td>{s.guardianName}</td>
                <td className="mono text-xs">{s.guardianPhone}</td>
                <td>{formatKES(s.totalFee)}</td>
                <td className="text-emerald-700 font-semibold">{formatKES(s.paid)}</td>
                <td className="text-red-700 font-bold">{formatKES(s.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  )
}
 
export default function SchoolsPage() {
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">School Management</h1><p className="page-subtitle">Students · Fee Structures · Fee Payments · Defaulters · SMS Reminders</p></div>
      <SchoolNav/>
      <Routes>
        <Route index element={<Overview/>}/>
        <Route path="students" element={<Students/>}/>
        <Route path="fees" element={<FeeStructures/>}/>
        <Route path="payments" element={<FeePayments/>}/>
        <Route path="defaulters" element={<Defaulters/>}/>
      </Routes>
    </div>
  )
}
