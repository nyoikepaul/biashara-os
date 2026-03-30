import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { formatKES } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Plus, Send, Bell } from 'lucide-react'

export default function SchoolsPage() {
  const [students, setStudents] = useState([])
  const [report, setReport] = useState(null)
  const [showPayment, setShowPayment] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [payForm, setPayForm] = useState({ amount:'', mpesaRef:'' })
  const [newStudent, setNewStudent] = useState({ name:'', admNo:'', dob:'', gender:'M', guardianName:'', guardianPhone:'', class:'', year:new Date().getFullYear() })
  const now = new Date()
  const term = now.getMonth()<4?1:now.getMonth()<8?2:3

  useEffect(() => {
    api.get('/schools/students').then(r => setStudents(r.data)).catch(()=>{})
    api.get(`/schools/reports/collection?term=${term}&year=${now.getFullYear()}`).then(r => setReport(r.data)).catch(()=>{})
  }, [])

  const recordPayment = async (e) => {
    e.preventDefault()
    try {
      await api.post('/schools/payments', { studentId:showPayment.id, term, year:now.getFullYear(), amount:Number(payForm.amount), mpesaRef:payForm.mpesaRef })
      toast.success('Fee recorded + receipt sent')
      setShowPayment(null)
      api.get(`/schools/reports/collection?term=${term}&year=${now.getFullYear()}`).then(r => setReport(r.data)).catch(()=>{})
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  const notifyDefaulters = async () => {
    try {
      const res = await api.post('/schools/notify-defaulters', { term, year:now.getFullYear() })
      toast.success('SMS sent to ' + res.data.notified + ' guardians')
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  const addStudent = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/schools/students', { ...newStudent, dob:new Date(newStudent.dob).toISOString() })
      setStudents(p => [...p, res.data])
      setShowAdd(false)
      toast.success('Student registered')
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  const s = report?.summary
  const collectionRate = s?.expected>0 ? Math.round(Number(s.collected)/Number(s.expected)*100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Fees</h1>
          <p className="text-gray-500 text-sm">Term {term} · {now.getFullYear()} — M-Pesa · SMS · Auto reminders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={notifyDefaulters} className="btn-secondary flex items-center gap-2 text-sm"><Bell size={15}/>Notify Defaulters</button>
          <button onClick={()=>setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add Student</button>
        </div>
      </div>

      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{label:'Students',value:s.students},{label:'Expected',value:formatKES(s.expected)},{label:'Collected',value:formatKES(s.collected)},{label:'Collection Rate',value:collectionRate+'%'}].map(({label,value})=>(
            <div key={label} className="card"><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Students ({students.length})</h3>
        {students.length===0 ? <p className="text-gray-400 text-sm text-center py-8">No students yet.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Adm No','Name','Class','Guardian','Phone','Actions'].map(h=><th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody>{students.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono text-xs text-gray-600">{s.admNo}</td>
                  <td className="py-2 px-3 font-medium">{s.name}</td>
                  <td className="py-2 px-3">{s.class}</td>
                  <td className="py-2 px-3 text-gray-600">{s.guardianName}</td>
                  <td className="py-2 px-3 text-gray-500">{s.guardianPhone}</td>
                  <td className="py-2 px-3">
                    <button onClick={()=>{setShowPayment(s);setPayForm({amount:'',mpesaRef:''})}} className="text-xs btn-secondary py-1 px-2">Record Fee</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {report?.defaulters?.length > 0 && (
        <div className="card border-red-100">
          <h3 className="font-semibold text-red-700 mb-3">Fee Defaulters — Term {term}/{now.getFullYear()}</h3>
          <div className="space-y-2">
            {report.defaulters.map((d,i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                <div><p className="font-medium text-sm">{d.name}</p><p className="text-xs text-gray-500">{d.admno} · {d.class}</p></div>
                <p className="font-bold text-red-700 text-sm">{formatKES(Number(d.balance))} balance</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-1">Record Fee Payment</h2>
            <p className="text-sm text-gray-500 mb-4">{showPayment.name} ({showPayment.admNo})</p>
            <form onSubmit={recordPayment} className="space-y-3">
              <div><label className="label">Amount (KES)</label><input className="input" type="number" required value={payForm.amount} onChange={e=>setPayForm(p=>({...p,amount:e.target.value}))}/></div>
              <div><label className="label">M-Pesa Ref (optional)</label><input className="input" placeholder="QHX7Y4Z..." value={payForm.mpesaRef} onChange={e=>setPayForm(p=>({...p,mpesaRef:e.target.value}))}/></div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={()=>setShowPayment(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Record + SMS</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Register Student</h2>
            <form onSubmit={addStudent} className="grid grid-cols-2 gap-3">
              {[{k:'name',label:'Full Name',ph:'Jane Wanjiku',span:2},{k:'admNo',label:'Adm Number',ph:'2024/001'},{k:'dob',label:'Date of Birth',type:'date'},{k:'class',label:'Class/Form',ph:'Form 1'},{k:'guardianName',label:'Guardian Name',ph:'Mary Wanjiku'},{k:'guardianPhone',label:'Guardian Phone',ph:'0712345678',span:2}].map(({k,label,ph,span,type})=>(
                <div key={k} className={span===2?'col-span-2':''}>
                  <label className="label">{label}</label>
                  <input className="input" required placeholder={ph||''} type={type||'text'} value={newStudent[k]} onChange={e=>setNewStudent(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Register Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
