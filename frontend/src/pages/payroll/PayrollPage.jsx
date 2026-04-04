import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import {
  Users, DollarSign, Calculator, Plus, Search, RefreshCw, X,
  Edit2, Loader2, CheckCircle2, Download, Eye, Award, ChevronRight,
  TrendingUp, AlertTriangle, Smartphone, Info
} from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatKESFull, formatDate, badgeClass, getInitials, pct } from '../../lib/utils'
import { ValidationModal } from '../../components/ui/ValidationModal'
import toast from 'react-hot-toast'
 
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
 
function NavTabs() {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
      {[{to:'/payroll',l:'Payroll Runs',icon:DollarSign,end:true},{to:'/payroll/employees',l:'Employees',icon:Users},{to:'/payroll/calculator',l:'Tax Calculator',icon:Calculator}].map(({to,l,icon:Icon,end})=>(
        <NavLink key={to} to={to} end={end} className={({isActive})=>'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap '+(isActive?'bg-white text-gray-900 shadow-sm':'text-gray-500 hover:text-gray-700')}>
          <Icon size={14}/>{l}
        </NavLink>
      ))}
    </div>
  )
}
 
// ═══════════════ PAYROLL RUNS ════════════════════════════════════════════════
function PayrollRuns() {
  const [payrolls,setPayrolls] = useState([])
  const [loading,setLoading]   = useState(true)
  const [selected,setSelected] = useState(null)
  const [slips,setSlips]       = useState([])
  const [modal,setModal]       = useState({isOpen:false})
  const now = new Date()
  const [period,setPeriod]     = useState({month:now.getMonth()+1,year:now.getFullYear()})
 
  const load = async () => { setLoading(true); try { const r=await api.get('/payroll'); setPayrolls(r.data||[]) } catch{} finally{setLoading(false)} }
  useEffect(()=>{ load() },[])
 
  const loadSlips = async (id) => {
    try { const r=await api.get('/payroll/'+id+'/payslips'); setSlips(r.data||[]) } catch{}
  }
 
  const runPayroll = () => {
    const pLabel = MONTHS[period.month-1]+' '+period.year
    setModal({isOpen:true,type:'warning',
      title:'Run Payroll — '+pLabel,
      message:'Calculating PAYE, SHA (2.75%), NSSF Tier I & II for all active employees using Finance Act 2024/25.',
      list:['PAYE personal relief: KES 2,400/month','SHA rate: 2.75% of gross (Oct 2024)','NSSF Tier I: 6% of KES 7,000 = KES 420','NSSF Tier II: 6% on earnings KES 7,001–36,000'],
      confirmText:'Run Now', cancelText:'Cancel',
      onConfirm: async () => {
        setModal({isOpen:true,type:'loading',title:'Running payroll...',message:'Calculating for all active employees'})
        try {
          const r = await api.post('/payroll/run', period)
          const data = r.data
          setModal({isOpen:true,type:'success',
            title:'Payroll Complete! 🎉',
            message:data.summary.length+' employees processed for '+pLabel,
            list:[
              'Total Gross: '+formatKES(data.payroll.totalGross),
              'Total PAYE (KRA): '+formatKES(data.payroll.totalPaye),
              'Total SHA: '+formatKES(data.payroll.totalNhif),
              'Total NSSF: '+formatKES(data.payroll.totalNssf),
              'NET PAY: '+formatKES(data.payroll.totalNet),
            ],
            confirmText:'View Payroll', cancelText:'Close',
            onConfirm: ()=>{ setModal({isOpen:false}); load() },
            onCancel:  ()=>{ setModal({isOpen:false}); load() }
          })
        } catch(err) {
          setModal({isOpen:true,type:'error',title:'Payroll Failed',message:err.error||'Could not run payroll',confirmText:'OK',onConfirm:()=>setModal({isOpen:false}),onCancel:()=>setModal({isOpen:false})})
        }
      },
      onCancel: ()=>setModal({isOpen:false})
    })
  }
 
  const approve = async (id) => {
    try { await api.patch('/payroll/'+id+'/approve'); toast.success('Payroll approved'); load() } catch(e){ toast.error(e.error||'Failed') }
  }
 
  const ST = {DRAFT:'badge-yellow',PENDING_APPROVAL:'badge-blue',APPROVED:'badge-blue',PAID:'badge-green',CANCELLED:'badge-red'}
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal}/>
 
      {/* Run control card */}
      <div className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h3 className="section-title">Run Payroll</h3>
            <p className="text-xs text-gray-500 mt-0.5">Finance Act 2024/25 · SHA 2.75% · NSSF Tier I + II · PAYE personal relief KES 2,400</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="select w-24 text-sm" value={period.month} onChange={e=>setPeriod(p=>({...p,month:+e.target.value}))}>
              {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
            </select>
            <select className="select w-20 text-sm" value={period.year} onChange={e=>setPeriod(p=>({...p,year:+e.target.value}))}>
              {[2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={runPayroll} className="btn-primary"><Calculator size={14}/>Run Payroll</button>
          </div>
        </div>
 
        {/* Compliance chips */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
          {[
            {l:'PAYE — Finance Act 2024',     c:'bg-blue-50 text-blue-700 border-blue-200'},
            {l:'SHA/NHIF — 2.75% (Oct 2024)', c:'bg-emerald-50 text-emerald-700 border-emerald-200'},
            {l:'NSSF — Tier I + Tier II',     c:'bg-purple-50 text-purple-700 border-purple-200'},
            {l:'Personal Relief — KES 2,400', c:'bg-amber-50 text-amber-700 border-amber-200'},
            {l:'Commuter Exempt ≤ KES 5,000', c:'bg-gray-50 text-gray-700 border-gray-200'},
            {l:'AHL — Court Suspended',        c:'bg-red-50 text-red-600 border-red-200'},
          ].map(({l,c})=>(
            <span key={l} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c}`}>{l}</span>
          ))}
        </div>
      </div>
 
      <div className={"grid gap-4 "+(selected?'grid-cols-1 xl:grid-cols-3':'grid-cols-1')}>
        {/* History table */}
        <div className={"card overflow-hidden "+(selected?'xl:col-span-2':'')}>
          <div className="card-header">
            <p className="section-title">Payroll History</p>
            <button onClick={load} className="btn-ghost btn-icon-sm"><RefreshCw size={13}/></button>
          </div>
          {loading ? <div className="p-4 space-y-2">{[...Array(4)].map((_,i)=><div key={i} className="skeleton h-12"/>)}</div>
          : payrolls.length===0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-gray-400">
              <DollarSign size={32} className="mb-2 opacity-20"/>
              <p className="text-sm">No payrolls yet</p>
              <p className="text-xs text-gray-400 mt-1">Run your first payroll above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full tbl">
                <thead><tr>
                  {['Period','Gross','PAYE','SHA','NSSF','Net Pay','Status',''].map(h=><th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {payrolls.map(pr=>(
                    <tr key={pr.id} onClick={()=>{ setSelected(pr); loadSlips(pr.id) }} className={"tbl-clickable "+(selected?.id===pr.id?'bg-blue-50 hover:bg-blue-50':'')}>
                      <td><span className="font-semibold">{MONTHS[(pr.month||1)-1]} {pr.year}</span></td>
                      <td className="money">{formatKES(pr.totalGross)}</td>
                      <td className="text-red-600 money">{formatKES(pr.totalPaye)}</td>
                      <td className="text-amber-600 money">{formatKES(pr.totalNhif)}</td>
                      <td className="text-purple-600 money">{formatKES(pr.totalNssf)}</td>
                      <td className="money text-emerald-700 font-bold">{formatKES(pr.totalNet)}</td>
                      <td><span className={"badge "+(ST[pr.status]||'badge-gray')}>{pr.status}</span></td>
                      <td><Eye size={13} className="text-gray-400"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
 
        {/* Payroll detail panel */}
        {selected && (
          <div className="card p-4 space-y-4">
            <div className="flex-between">
              <div>
                <p className="font-bold text-gray-900">{MONTHS[(selected.month||1)-1]} {selected.year}</p>
                <span className={"badge mt-1 "+(ST[selected.status]||'badge-gray')}>{selected.status}</span>
              </div>
              <button onClick={()=>setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <div className="space-y-2">
              {[['Total Gross','text-gray-900',selected.totalGross],['Total PAYE','text-red-600',selected.totalPaye],['Total SHA','text-amber-600',selected.totalNhif],['Total NSSF','text-purple-600',selected.totalNssf],['Net Pay','text-emerald-700 font-bold text-base',selected.totalNet]].map(([l,c,v])=>(
                <div key={l} className="flex justify-between text-xs py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">{l}</span><span className={`font-semibold ${c}`}>{formatKESFull(v)}</span>
                </div>
              ))}
            </div>
            {slips.length>0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Employee Payslips ({slips.length})</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {slips.map(s=>(
                    <div key={s.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex-center text-blue-700 text-xs font-bold flex-shrink-0">
                        {getInitials((s.employee?.firstName||'')+(s.employee?.lastName||''))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{s.employee?.firstName} {s.employee?.lastName}</p>
                        <p className="text-xs text-gray-400">{s.employee?.department}</p>
                      </div>
                      <p className="text-xs font-bold text-emerald-700">{formatKES(s.netSalary)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              {selected.status==='DRAFT'&&<button onClick={()=>approve(selected.id)} className="btn-primary w-full justify-center"><CheckCircle2 size={14}/>Approve Payroll</button>}
              <button className="btn-secondary w-full justify-center"><Download size={14}/>Export to Excel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 
// ═══════════════ EMPLOYEES ═══════════════════════════════════════════════════
function Employees() {
  const [employees,setEmployees] = useState([])
  const [loading,setLoading]     = useState(true)
  const [search,setSearch]       = useState('')
  const [showAdd,setShowAdd]     = useState(false)
  const [editing,setEditing]     = useState(null)
  const [modal,setModal]         = useState({isOpen:false})
  const [form,setForm] = useState({firstName:'',lastName:'',email:'',phone:'',nationalId:'',kraPin:'',gender:'MALE',dob:'',department:'',designation:'',employmentType:'PERMANENT',basicSalary:'',mpesaPhone:'',joinDate:'',allowances:{housing:0,transport:0,commuter:0,medical:0,other:0}})
 
  const load = async () => { setLoading(true); try{const r=await api.get('/payroll/employees');setEmployees(r.data||[])}catch{} finally{setLoading(false)} }
  useEffect(()=>load(),[])
 
  const save = async (e) => {
    e.preventDefault()
    setModal({isOpen:true,type:'loading',title:editing?'Updating...':'Adding employee...',message:'Please wait'})
    try {
      const payload = {...form, basicSalary:Number(form.basicSalary)}
      if(editing) await api.patch('/payroll/employees/'+editing.id, payload)
      else await api.post('/payroll/employees', payload)
      setModal({isOpen:false})
      toast.success(editing?'Employee updated':'Employee added')
      setShowAdd(false); setEditing(null); load()
    } catch(err){
      setModal({isOpen:true,type:'error',title:'Failed',message:err.error||'Error',confirmText:'OK',onConfirm:()=>setModal({isOpen:false}),onCancel:()=>setModal({isOpen:false})})
    }
  }
 
  const openEdit = (e) => {
    setEditing(e)
    setForm({firstName:e.firstName||'',lastName:e.lastName||'',email:e.email||'',phone:e.phone||'',nationalId:e.nationalId||'',kraPin:e.kraPin||'',gender:e.gender||'MALE',dob:e.dob?e.dob.slice(0,10):'',department:e.department||'',designation:e.designation||'',employmentType:e.employmentType||'PERMANENT',basicSalary:e.basicSalary||'',mpesaPhone:e.mpesaPhone||'',joinDate:e.joinDate?e.joinDate.slice(0,10):'',allowances:e.allowances||{housing:0,transport:0,commuter:0,medical:0,other:0}})
    setShowAdd(true)
  }
 
  const setA = (k,v) => setForm(f=>({...f,allowances:{...f.allowances,[k]:Number(v)}}))
  const gross = Number(form.basicSalary||0)+Object.values(form.allowances||{}).reduce((s,v)=>s+Number(v||0),0)
  const filtered = employees.filter(e=>!search||(e.firstName+' '+e.lastName+e.department).toLowerCase().includes(search.toLowerCase()))
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal}/>
 
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {l:'Total',v:employees.length,c:'text-blue-700 bg-blue-50'},
          {l:'Gross Payroll',v:formatKES(employees.reduce((s,e)=>s+(e.basicSalary||0),0)),c:'text-emerald-700 bg-emerald-50'},
          {l:'Departments',v:new Set(employees.map(e=>e.department)).size,c:'text-purple-700 bg-purple-50'},
          {l:'With M-Pesa',v:employees.filter(e=>e.mpesaPhone).length,c:'text-amber-700 bg-amber-50'},
        ].map(({l,v,c})=>(
          <div key={l} className={`rounded-xl p-3.5 border border-gray-100 ${c.split(' ')[1]}`}>
            <p className={`text-xl font-bold ${c.split(' ')[0]}`}>{v}</p>
            <p className="text-xs text-gray-500 mt-0.5">{l}</p>
          </div>
        ))}
      </div>
 
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
        <button onClick={()=>{setEditing(null);setForm({firstName:'',lastName:'',email:'',phone:'',nationalId:'',kraPin:'',gender:'MALE',dob:'',department:'',designation:'',employmentType:'PERMANENT',basicSalary:'',mpesaPhone:'',joinDate:'',allowances:{housing:0,transport:0,commuter:0,medical:0,other:0}});setShowAdd(true)}} className="btn-primary"><Plus size={14}/>Add Employee</button>
      </div>
 
      <div className="card overflow-hidden">
        {loading?<div className="p-4 space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-12"/>)}</div>
        :filtered.length===0?<div className="flex flex-col items-center py-14 text-gray-400"><Users size={32} className="mb-2 opacity-20"/><p className="text-sm">{search?'No match':'No employees yet'}</p></div>
        :(
          <div className="overflow-x-auto">
            <table className="w-full tbl">
              <thead><tr>{['Employee','Dept','Position','Type','Basic','Gross (Est.)','M-Pesa',''].map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(e=>{
                  const allowTotal = Object.values(e.allowances||{}).reduce((s,v)=>s+Number(v||0),0)
                  return (
                    <tr key={e.id} className="tbl-row">
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex-center text-blue-700 text-xs font-bold flex-shrink-0">{getInitials((e.firstName||'')+(e.lastName||''))}</div>
                          <div><p className="font-semibold text-xs text-gray-900">{e.firstName} {e.lastName}</p><p className="mono text-gray-400">{e.employeeNo}</p></div>
                        </div>
                      </td>
                      <td>{e.department}</td>
                      <td className="text-gray-600">{e.designation}</td>
                      <td><span className={`badge ${e.employmentType==='PERMANENT'?'badge-green':e.employmentType==='CONTRACT'?'badge-blue':'badge-gray'}`}>{e.employmentType}</span></td>
                      <td className="money">{formatKES(e.basicSalary)}</td>
                      <td className="money text-emerald-700">{formatKES((e.basicSalary||0)+allowTotal)}</td>
                      <td>{e.mpesaPhone?<span className="kenya-badge mpesa-green">📱 {e.mpesaPhone}</span>:<span className="text-gray-400 text-xs">—</span>}</td>
                      <td><button onClick={()=>openEdit(e)} className="btn-ghost btn-icon-sm text-blue-600"><Edit2 size={13}/></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
 
      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-4 anim-scale">
            <div className="flex-between mb-5">
              <div><h2 className="font-bold text-gray-900">{editing?'Edit Employee':'Add Employee'}</h2><p className="text-xs text-gray-500 mt-0.5">Deductions auto-calculated on payroll run</p></div>
              <button onClick={()=>{setShowAdd(false);setEditing(null)}} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={save}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[{k:'firstName',l:'First Name *',ph:'John',req:true},{k:'lastName',l:'Last Name *',ph:'Kamau',req:true},{k:'email',l:'Email',ph:'john@co.ke',type:'email'},{k:'phone',l:'Phone *',ph:'0712345678',req:true},{k:'nationalId',l:'National ID *',ph:'12345678',req:true},{k:'kraPin',l:'KRA PIN',ph:'A123456789B'},{k:'department',l:'Department *',ph:'Sales',req:true},{k:'designation',l:'Designation *',ph:'Sales Manager',req:true},{k:'basicSalary',l:'Basic Salary (KES) *',ph:'50000',type:'number',req:true},{k:'mpesaPhone',l:'M-Pesa Phone',ph:'0712345678'},{k:'dob',l:'Date of Birth *',type:'date',req:true},{k:'joinDate',l:'Join Date *',type:'date',req:true}].map(({k,l,ph,type,req})=>(
                  <div key={k}><label className="label">{l}</label><input className="input" placeholder={ph||''} type={type||'text'} required={req} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/></div>
                ))}
                <div><label className="label">Gender</label><select className="select" value={form.gender} onChange={e=>setForm(f=>({...f,gender:e.target.value}))}>{['MALE','FEMALE','OTHER'].map(g=><option key={g} value={g}>{g}</option>)}</select></div>
                <div><label className="label">Employment Type</label><select className="select" value={form.employmentType} onChange={e=>setForm(f=>({...f,employmentType:e.target.value}))}>{['PERMANENT','CONTRACT','CASUAL','INTERN','PROBATION'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              {/* Allowances */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-bold text-gray-700 mb-3">Monthly Allowances (KES)</p>
                <div className="grid grid-cols-5 gap-2">
                  {[{k:'housing',l:'Housing',h:'Taxable'},{k:'transport',l:'Transport',h:'Taxable'},{k:'commuter',l:'Commuter',h:'Exempt ≤5K'},{k:'medical',l:'Medical',h:'Taxable'},{k:'other',l:'Other',h:'Taxable'}].map(({k,l,h})=>(
                    <div key={k}><label className="label">{l}</label><input className="input text-xs" type="number" min="0" placeholder="0" value={form.allowances?.[k]||''} onChange={e=>setA(k,e.target.value)}/><p className="hint">{h}</p></div>
                  ))}
                </div>
                {form.basicSalary&&<div className="flex-between mt-3 pt-3 border-t border-gray-200"><p className="text-xs text-gray-600">Estimated Gross</p><p className="font-bold text-emerald-700">{formatKES(gross)}</p></div>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={()=>{setShowAdd(false);setEditing(null)}} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing?'Update':'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
// ═══════════════ TAX CALCULATOR ══════════════════════════════════════════════
function TaxCalc() {
  const [inp,setInp]   = useState({basicSalary:'',housing:'',transport:'',commuter:'',medical:'',other:''})
  const [res,setRes]   = useState(null)
  const [loading,setL] = useState(false)
 
  const calc = async () => {
    setL(true)
    try {
      const r = await api.post('/payroll/calculate',{basicSalary:Number(inp.basicSalary||0),allowances:{housing:Number(inp.housing||0),transport:Number(inp.transport||0),commuter:Number(inp.commuter||0),medical:Number(inp.medical||0),other:Number(inp.other||0)}})
      setRes(r.data)
    } catch(e){ toast.error(e.error||'Calc failed') }
    finally{setL(false)}
  }
 
  const gross = Number(inp.basicSalary||0)+['housing','transport','commuter','medical','other'].reduce((s,k)=>s+Number(inp[k]||0),0)
 
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 max-w-4xl">
      {/* Input */}
      <div className="card p-5">
        <h3 className="section-title mb-1">Kenya Payroll Tax Calculator</h3>
        <p className="text-xs text-gray-500 mb-4">Finance Act 2024/25 · SHA 2.75% · NSSF Tier I+II · Personal Relief KES 2,400</p>
        <div className="space-y-3">
          <div><label className="label">Basic Salary (KES) *</label>
            <input className="input text-base font-semibold" type="number" placeholder="e.g. 80,000" value={inp.basicSalary} onChange={e=>setInp(f=>({...f,basicSalary:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{k:'housing',l:'Housing Allowance'},{k:'transport',l:'Transport Allowance'},{k:'commuter',l:'Commuter (Exempt ≤5K)'},{k:'medical',l:'Medical Allowance'},{k:'other',l:'Other Allowances'}].map(({k,l})=>(
              <div key={k}><label className="label">{l}</label><input className="input" type="number" min="0" placeholder="0" value={inp[k]} onChange={e=>setInp(f=>({...f,[k]:e.target.value}))}/></div>
            ))}
          </div>
          {gross>0&&<p className="text-sm font-medium text-gray-700">Gross: <span className="font-bold text-gray-900">{formatKES(gross)}</span></p>}
          <button onClick={calc} disabled={!inp.basicSalary||loading} className="btn-primary w-full justify-center py-2.5 text-base">
            {loading?<><Loader2 size={16} className="animate-spin"/>Calculating...</>:<><Calculator size={16}/>Calculate Deductions</>}
          </button>
        </div>
 
        {/* Info panel */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-900 flex items-center gap-1.5 mb-2"><Info size={12}/>Kenya Statutory Rates 2024/25</p>
          {[['PAYE Bands','10%–35% progressive (KRA)'],['SHA/NHIF','2.75% of gross (Oct 2024)'],['NSSF Tier I','6% × KES 7,000 = KES 420'],['NSSF Tier II','6% × (gross–KES 7,000) up to KES 36K'],['Personal Relief','KES 2,400/month'],['AHL','1.5% — suspended by court']].map(([k,v])=>(
            <div key={k} className="flex justify-between text-xs py-0.5"><span className="text-blue-700 font-medium">{k}</span><span className="text-blue-600">{v}</span></div>
          ))}
        </div>
      </div>
 
      {/* Result */}
      {res && (
        <div className="card overflow-hidden anim-scale">
          <div className="card-header" style={{background:'#0f172a'}}>
            <div><p className="text-white font-bold">Payslip Breakdown</p><p className="text-slate-400 text-xs">Finance Act 2024/25</p></div>
            <span className="badge badge-green">Calculated</span>
          </div>
          <div className="p-5 space-y-4">
            {/* Earnings */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Earnings</p>
              {[['Basic Salary',res.basicSalary],res.housingAllowance>0&&['Housing Allowance',res.housingAllowance],res.transportAllowance>0&&['Transport Allowance',res.transportAllowance],res.commuterAllowance>0&&['Commuter Allowance',res.commuterAllowance],res.medicalAllowance>0&&['Medical Allowance',res.medicalAllowance],res.otherAllowances>0&&['Other Allowances',res.otherAllowances]].filter(Boolean).map(([l,v])=>(
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 text-sm"><span className="text-gray-600">{l}</span><span className="font-medium">{formatKES(v)}</span></div>
              ))}
              <div className="flex justify-between py-2 font-bold"><span>Gross Salary</span><span>{formatKES(res.grossSalary)}</span></div>
            </div>
            {/* Deductions */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Statutory Deductions</p>
              {[['NSSF (Tier I + II)',res.nssf,'NSSF Act 2013'],['SHA / NHIF (2.75%)',res.sha,'Effective Oct 2024'],['Taxable Income',res.taxableIncome,'After NSSF & commuter exempt'],['PAYE',res.paye,'After personal relief KES '+res.breakdown?.personalRelief?.toLocaleString()],res.ahl>0&&['AHL (1.5%)',res.ahl,'Housing levy']].filter(Boolean).map(([l,v,n])=>(
                <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 text-sm">
                  <div><p className="text-gray-700">{l}</p><p className="text-xs text-gray-400">{n}</p></div>
                  <span className="font-medium text-red-600">({formatKES(v)})</span>
                </div>
              ))}
              <div className="flex justify-between py-1.5 text-sm font-semibold"><span>Total Deductions</span><span className="text-red-700">({formatKES(res.totalDeductions)})</span></div>
            </div>
            {/* Net */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex-between">
              <div><p className="font-bold text-gray-900">NET SALARY (Take Home)</p><p className="text-xs text-emerald-700 mt-0.5">Effective tax rate: {pct(res.paye,res.grossSalary)}%</p></div>
              <p className="text-2xl font-bold text-emerald-700">{formatKES(res.netSalary)}</p>
            </div>
            {/* Rates */}
            <div className="grid grid-cols-3 gap-2">
              {[['PAYE Rate',pct(res.paye,res.grossSalary)+'%'],['Deduction %',pct(res.totalDeductions,res.grossSalary)+'%'],['Take Home',pct(res.netSalary,res.grossSalary)+'%']].map(([l,v])=>(
                <div key={l} className="bg-gray-50 rounded-xl p-2.5 text-center"><p className="font-bold text-gray-900">{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
 
export default function PayrollPage() {
  return (
    <div>
      <div className="mb-4"><h1 className="page-title">HR & Payroll</h1><p className="page-subtitle">Employees · Payroll processing · Finance Act 2024/25 compliance</p></div>
      <NavTabs/>
      <Routes>
        <Route index element={<PayrollRuns/>}/>
        <Route path="employees" element={<Employees/>}/>
        <Route path="calculator" element={<TaxCalc/>}/>
      </Routes>
    </div>
  )
}
