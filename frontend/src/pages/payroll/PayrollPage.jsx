import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { formatKES } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Play, Send, Plus } from 'lucide-react'

export default function PayrollPage() {
  const [employees, setEmployees] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [disbursing, setDisbursing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const now = new Date()
  const [period, setPeriod] = useState({ month: now.getMonth()+1, year: now.getFullYear() })
  const [form, setForm] = useState({ name:'', employeeNo:'', idNumber:'', phone:'', department:'', designation:'', basicSalary:'', mpesaPhone:'' })
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  useEffect(() => { api.get('/payroll/employees').then(r => setEmployees(r.data)).catch(()=>{}) }, [])

  const runPayroll = async () => {
    setLoading(true)
    try {
      const res = await api.post('/payroll/run', period)
      setResult(res.data)
      toast.success('Payroll calculated for ' + res.data.employeeCount + ' employees')
    } catch (err) { toast.error(err.error || 'Failed') }
    finally { setLoading(false) }
  }

  const disburse = async () => {
    if (!result?.payroll?.id) return
    if (!confirm('Disburse salaries via M-Pesa B2C?')) return
    setDisbursing(true)
    try {
      const res = await api.post('/payroll/disburse', { payrollId: result.payroll.id })
      toast.success('Disbursement queued for ' + res.data.results.length + ' employees')
    } catch (err) { toast.error(err.error || 'Failed') }
    finally { setDisbursing(false) }
  }

  const addEmployee = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/payroll/employees', { ...form, basicSalary: Number(form.basicSalary), joinDate: new Date().toISOString() })
      setEmployees(p => [...p, res.data])
      setShowAdd(false)
      setForm({ name:'', employeeNo:'', idNumber:'', phone:'', department:'', designation:'', basicSalary:'', mpesaPhone:'' })
      toast.success('Employee added')
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-500 text-sm">PAYE · NHIF (SHA 2.75%) · NSSF — Finance Act 2024</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add Employee</button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Month</label>
            <select className="input w-32" value={period.month} onChange={e => setPeriod(p => ({...p, month: +e.target.value}))}>
              {months.map((m,i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Year</label>
            <select className="input w-28" value={period.year} onChange={e => setPeriod(p => ({...p, year: +e.target.value}))}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={runPayroll} disabled={loading || employees.length===0} className="btn-primary flex items-center gap-2">
            <Play size={15}/>{loading ? 'Calculating...' : 'Run Payroll'}
          </button>
          {result && (
            <button onClick={disburse} disabled={disbursing} className="btn-secondary flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50">
              <Send size={15}/>{disbursing ? 'Sending...' : 'Disburse via M-Pesa'}
            </button>
          )}
        </div>
        {result && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
            {[{label:'Gross',value:result.totals.totalGross},{label:'PAYE',value:result.totals.totalPaye},{label:'NHIF',value:result.totals.totalNhif},{label:'NSSF',value:result.totals.totalNssf},{label:'Net Pay',value:result.totals.totalNet,highlight:true}].map(({label,value,highlight}) => (
              <div key={label} className={`rounded-xl p-3 text-center ${highlight ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <p className={`text-lg font-bold ${highlight ? 'text-green-700' : 'text-gray-900'}`}>{formatKES(value)}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {result?.summary && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Payslip Preview — {months[period.month-1]} {period.year}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Employee','Gross','PAYE','Net Salary'].map(h=><th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody>{result.summary.map((row,i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row.name}</td>
                  <td className="py-2 px-3 text-gray-600">{formatKES(row.gross)}</td>
                  <td className="py-2 px-3 text-red-600">{formatKES(row.paye)}</td>
                  <td className="py-2 px-3 font-semibold text-green-700">{formatKES(row.net)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Employees ({employees.length})</h3>
        {employees.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No employees yet. Add your first employee above.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Name','Dept','Designation','Basic Salary','M-Pesa'].map(h=><th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody>{employees.map(emp => (
                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{emp.name}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.department}</td>
                  <td className="py-2 px-3 text-gray-600">{emp.designation}</td>
                  <td className="py-2 px-3 font-semibold">{formatKES(emp.basicSalary)}</td>
                  <td className="py-2 px-3 text-gray-500">{emp.mpesaPhone||emp.phone}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Add Employee</h2>
            <form onSubmit={addEmployee} className="grid grid-cols-2 gap-3">
              {[{k:'name',label:'Full Name',ph:'John Kamau',span:2},{k:'employeeNo',label:'Employee No',ph:'EMP001'},{k:'idNumber',label:'ID Number',ph:'12345678'},{k:'phone',label:'Phone',ph:'0712345678'},{k:'mpesaPhone',label:'M-Pesa Phone',ph:'0712345678'},{k:'department',label:'Department',ph:'Sales'},{k:'designation',label:'Designation',ph:'Sales Rep'},{k:'basicSalary',label:'Basic Salary (KES)',ph:'50000',type:'number'}].map(({k,label,ph,span,type})=>(
                <div key={k} className={span===2?'col-span-2':''}>
                  <label className="label">{label}</label>
                  <input className="input" required placeholder={ph} type={type||'text'} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
