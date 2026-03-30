import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { formatKES } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Bell, Plus } from 'lucide-react'

export default function RentalsPage() {
  const [properties, setProperties] = useState([])
  const [report, setReport] = useState(null)
  const [showPayment, setShowPayment] = useState(null)
  const [payForm, setPayForm] = useState({ amount:'', mpesaRef:'' })
  const now = new Date()

  useEffect(() => {
    api.get('/rentals/properties').then(r => setProperties(r.data)).catch(()=>{})
    api.get('/rentals/reports/occupancy').then(r => setReport(r.data)).catch(()=>{})
  }, [])

  const recordPayment = async (e) => {
    e.preventDefault()
    try {
      await api.post('/rentals/payments', { leaseId:showPayment.lease.id, amount:Number(payForm.amount), mpesaRef:payForm.mpesaRef, month:now.getMonth()+1, year:now.getFullYear() })
      toast.success('Payment recorded + SMS sent to tenant')
      setShowPayment(null)
      api.get('/rentals/reports/occupancy').then(r => setReport(r.data)).catch(()=>{})
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  const requestPayment = async (leaseId) => {
    try {
      await api.post('/rentals/request-payment', { leaseId, month:now.getMonth()+1, year:now.getFullYear() })
      toast.success('M-Pesa STK Push sent to tenant')
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  const allUnits = properties.flatMap(p => p.units.map(u => ({...u, propertyName:p.name})))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
        <p className="text-gray-500 text-sm">Auto rent reminders · M-Pesa collection · WhatsApp receipts</p>
      </div>

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{label:'Total Units',value:report.total},{label:'Occupied',value:`${report.occupied} (${report.occupancyRate}%)`},{label:'Expected Revenue',value:formatKES(report.expectedRevenue)},{label:'Collected',value:`${formatKES(report.collectedRevenue)} (${report.collectionRate}%)`}].map(({label,value})=>(
            <div key={label} className="card"><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
          ))}
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">All Units</h3>
        {allUnits.length===0 ? <p className="text-gray-400 text-sm text-center py-8">No properties yet. Add a property to get started.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Property','Unit','Tenant','Phone','Rent/Month','Status','Actions'].map(h=><th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>)}</tr></thead>
              <tbody>{allUnits.map(unit => {
                const lease = unit.leases?.[0]
                return (
                  <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-600">{unit.propertyName}</td>
                    <td className="py-2 px-3 font-medium">{unit.unitNo}</td>
                    <td className="py-2 px-3">{lease?.tenantName||'—'}</td>
                    <td className="py-2 px-3 text-gray-500">{lease?.tenantPhone||'—'}</td>
                    <td className="py-2 px-3 font-semibold">{formatKES(unit.rentAmount)}</td>
                    <td className="py-2 px-3"><span className={unit.isOccupied?'badge-green':'badge-yellow'}>{unit.isOccupied?'Occupied':'Vacant'}</span></td>
                    <td className="py-2 px-3">
                      {lease && (
                        <div className="flex gap-2">
                          <button onClick={()=>{setShowPayment({unit,lease});setPayForm({amount:unit.rentAmount,mpesaRef:''})}} className="text-xs btn-secondary py-1 px-2">Record</button>
                          <button onClick={()=>requestPayment(lease.id)} className="text-xs bg-green-50 text-green-700 border border-green-200 py-1 px-2 rounded-lg hover:bg-green-100 flex items-center gap-1"><Bell size={12}/>STK</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}</tbody>
            </table>
          </div>
        )}
      </div>

      {report?.defaulters?.length > 0 && (
        <div className="card border-red-100">
          <h3 className="font-semibold text-red-700 mb-3">Rent Defaulters — {now.toLocaleString('en-KE',{month:'long'})} {now.getFullYear()}</h3>
          <div className="space-y-2">
            {report.defaulters.map((d,i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{d.tenantname||d.tenantName}</p>
                  <p className="text-xs text-gray-500">{d.property_name} — {d.unitno||d.unitNo}</p>
                </div>
                <p className="font-bold text-red-700 text-sm">{formatKES(Number(d.rentamount||d.rentAmount)-Number(d.paid))} outstanding</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-1">Record Rent Payment</h2>
            <p className="text-sm text-gray-500 mb-4">{showPayment.lease.tenantName} — Unit {showPayment.unit.unitNo}</p>
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
    </div>
  )
}
