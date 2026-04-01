
import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Plus, Search, RefreshCw, Download, Filter } from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatDate, statusColor, timeAgo } from '../../lib/utils'
import { Badge, Spinner, EmptyState, SearchInput, PageHeader, StatCard, Tabs, Table } from '../../components/ui'
import toast from 'react-hot-toast'
 
export default function CRMPage() {
  const [tab, setTab] = useState('customers')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
 
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/crm/customers')
      setData(res.data || [])
    } catch (err) {
      // Module may not have data yet
    } finally { setLoading(false) }
  }, [tab])
 
  useEffect(() => { load() }, [load])
 
  const tabs = [{"id":"customers","label":"Customers"},{"id":"leads","label":"Leads"},{"id":"quotes","label":"Quotes"},{"id":"orders","label":"Sales Orders"},{"id":"invoices","label":"Invoices"}]
 
  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="flex items-center gap-2"><TrendingUp size={22} className="text-blue-600"/>CRM & Sales</span>}
        subtitle="Manage your crm workflows"
        actions={<>
          <button onClick={load} className="btn-secondary text-sm flex items-center gap-2"><RefreshCw size={14}/>Refresh</button>
          <button className="btn-primary text-sm flex items-center gap-2"><Plus size={14}/>Add New</button>
        </>}
      />
 
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
 
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search crm..." className="w-64" />
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm flex items-center gap-1.5"><Filter size={13}/>Filter</button>
            <button className="btn-secondary btn-sm flex items-center gap-1.5"><Download size={13}/>Export</button>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28}/></div>
        ) : data.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No crm records yet" subtitle="Get started by adding your first record" action={<button className="btn-primary btn-sm">+ Add CRM</button>} />
        ) : (
          <div className="p-5">
            <p className="text-sm text-gray-500">{data.length} records found</p>
          </div>
        )}
      </div>
    </div>
  )
}
