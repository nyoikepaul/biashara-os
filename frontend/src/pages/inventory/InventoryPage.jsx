import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import {
  Package, Truck, Users, BarChart2, Plus, Search, RefreshCw,
  X, Edit2, AlertTriangle, ChevronDown, ChevronUp, Eye,
  ArrowUpDown, CheckCircle, Loader2, Download, Filter,
  Building2, TrendingUp, TrendingDown, Archive, ArrowUp, ArrowDown
} from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatDate, formatDateTime, timeAgo, badgeClass } from '../../lib/utils'
import { ValidationModal } from '../../components/ui/ValidationModal'
import toast from 'react-hot-toast'
 
// ── Sub-navigation ─────────────────────────────────────────────────────────────
function InventoryNav() {
  const links = [
    { to: '/inventory',                  label: 'Overview',        icon: BarChart2,   end: true },
    { to: '/inventory/products',         label: 'Products',        icon: Package },
    { to: '/inventory/purchase-orders',  label: 'Purchase Orders', icon: Truck },
    { to: '/inventory/suppliers',        label: 'Suppliers',       icon: Users },
    { to: '/inventory/movements',        label: 'Stock Movements', icon: ArrowUpDown },
    { to: '/inventory/valuation',        label: 'Valuation',       icon: BarChart2 },
  ]
  return (
    <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) =>
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ' +
            (isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')
          }>
          <Icon size={14}/>{label}
        </NavLink>
      ))}
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// OVERVIEW DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function OverviewPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
 
  useEffect(() => {
    api.get('/inventory/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])
 
  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
 
  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Stock Value', value: formatKES(stats?.totalStockValue), icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Low Stock Items', value: stats?.lowStockItems?.length || 0, icon: AlertTriangle, color: 'bg-amber-50 text-amber-600' },
          { label: 'Out of Stock', value: stats?.outOfStockCount || 0, icon: Archive, color: 'bg-red-50 text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18}/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
 
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Low Stock Alert */}
        {stats?.lowStockItems?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
              <AlertTriangle size={15} className="text-amber-500"/>
              <h3 className="font-semibold text-sm text-gray-900">Low Stock Alert</h3>
              <span className="ml-auto badge badge-yellow">{stats.lowStockItems.length} items</span>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.lowStockItems.slice(0, 8).map(p => (
                <div key={p.name} className="flex items-center justify-between px-5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock} units</p>
                    <p className="text-xs text-gray-400">Reorder at {p.lowStockAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* Recent Movements */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <ArrowUpDown size={15} className="text-blue-500"/>
            <h3 className="font-semibold text-sm text-gray-900">Recent Stock Movements</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {(stats?.recentMovements || []).slice(0, 8).map((m, i) => {
              const isIn = ['PURCHASE', 'RETURN_IN', 'ADJUSTMENT_IN', 'OPENING_STOCK'].includes(m.type)
              return (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isIn ? 'bg-green-50' : 'bg-red-50'}`}>
                    {isIn ? <ArrowUp size={13} className="text-green-600"/> : <ArrowDown size={13} className="text-red-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{m.product?.name}</p>
                    <p className="text-xs text-gray-400">{m.type} · {timeAgo(m.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-bold ${isIn ? 'text-green-700' : 'text-red-700'}`}>
                    {isIn ? '+' : '-'}{Math.abs(m.qty)}
                  </span>
                </div>
              )
            })}
            {!stats?.recentMovements?.length && (
              <p className="text-center text-gray-400 text-xs py-8">No stock movements yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showStock, setShowStock] = useState(null)
  const [stockAdj, setStockAdj] = useState({ qty: '', type: 'ADJUSTMENT_IN', notes: '' })
  const [modal, setModal] = useState({ isOpen: false })
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: 'General', unit: 'pcs',
    buyingPrice: '', sellingPrice: '', vatRate: '16', stock: '0', lowStockAt: '10', description: ''
  })
  const CATEGORIES = ['General','Food & Beverages','Electronics','Clothing','Pharmacy','Hardware','Stationery','Agriculture','Beauty','Furniture','Other']
 
  const load = useCallback(async () => {
    setLoading(true)
    try { const r = await api.get('/inventory/products?limit=200'); setProducts(r.data || []) }
    catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [])
 
  useEffect(() => { load() }, [load])
 
  const save = async (e) => {
    e.preventDefault()
    setModal({ isOpen: true, type: 'loading', title: editing ? 'Updating product...' : 'Adding product...', message: 'Please wait' })
    try {
      const payload = {
        ...form,
        buyingPrice: Number(form.buyingPrice), sellingPrice: Number(form.sellingPrice),
        vatRate: Number(form.vatRate), stock: Number(form.stock), lowStockAt: Number(form.lowStockAt)
      }
      if (editing) {
        await api.patch('/inventory/products/' + editing.id, payload)
        toast.success('Product updated')
      } else {
        await api.post('/inventory/products', payload)
        toast.success('Product added')
      }
      setModal({ isOpen: false })
      setShowAdd(false); setEditing(null)
      resetForm()
      load()
    } catch (err) {
      setModal({ isOpen: true, type: 'error', title: 'Failed', message: err.error || 'Could not save product', confirmText: 'OK', onConfirm: () => setModal({ isOpen: false }), onCancel: () => setModal({ isOpen: false }) })
    }
  }
 
  const adjustStock = async (e) => {
    e.preventDefault()
    try {
      const r = await api.post('/inventory/stock/adjust', { productId: showStock.id, qty: stockAdj.qty, type: stockAdj.type, notes: stockAdj.notes })
      toast.success('Stock adjusted — New qty: ' + r.newStock)
      setShowStock(null); setStockAdj({ qty: '', type: 'ADJUSTMENT_IN', notes: '' })
      load()
    } catch (err) { toast.error(err.error || 'Adjustment failed') }
  }
 
  const openEdit = (product) => {
    setEditing(product)
    setForm({ name: product.name, sku: product.sku || '', barcode: product.barcode || '', category: product.category || 'General', unit: product.unit || 'pcs', buyingPrice: product.buyingPrice || '', sellingPrice: product.sellingPrice || '', vatRate: product.vatRate || 16, stock: product.stock || 0, lowStockAt: product.lowStockAt || 10, description: product.description || '' })
    setShowAdd(true)
  }
 
  const resetForm = () => setForm({ name: '', sku: '', barcode: '', category: 'General', unit: 'pcs', buyingPrice: '', sellingPrice: '', vatRate: '16', stock: '0', lowStockAt: '10', description: '' })
 
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))]
  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    return (!search || (p.name + p.sku + (p.barcode || '')).toLowerCase().includes(s)) &&
           (filterCat === 'All' || p.category === filterCat)
  })
  const totalValue = filtered.reduce((s, p) => s + (p.stock || 0) * p.buyingPrice, 0)
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal} />
 
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: products.length, color: 'text-blue-700' },
          { label: 'Low Stock', value: products.filter(p => (p.stock||0) <= (p.lowStockAt||10) && p.stock > 0).length, color: 'text-amber-700' },
          { label: 'Out of Stock', value: products.filter(p => (p.stock||0) === 0).length, color: 'text-red-700' },
          { label: 'Stock Value', value: formatKES(products.reduce((s,p)=>s+(p.stock||0)*p.buyingPrice,0)), color: 'text-green-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
 
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search name, SKU, barcode..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="select w-36" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} className="btn-secondary btn-icon" title="Refresh"><RefreshCw size={14}/></button>
        <button onClick={() => { setEditing(null); resetForm(); setShowAdd(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={14}/>Add Product
        </button>
      </div>
 
      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Package size={36} className="mx-auto mb-2 opacity-20"/>
            <p className="text-sm">{search ? 'No products match your search' : 'No products yet — add your first product'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Product','SKU','Category','Cost','Price','Margin','Stock','Status','Actions'].map(h =>
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(p => {
                    const outOfStock = (p.stock || 0) === 0
                    const lowStock = !outOfStock && (p.stock || 0) <= (p.lowStockAt || 10)
                    const margin = p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.buyingPrice) / p.sellingPrice) * 100) : 0
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-4">
                          <p className="font-medium text-gray-900">{p.name}</p>
                          {p.barcode && <p className="text-xs text-gray-400">{p.barcode}</p>}
                        </td>
                        <td className="py-2.5 px-4"><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{p.sku}</span></td>
                        <td className="py-2.5 px-4 text-gray-600">{p.category}</td>
                        <td className="py-2.5 px-4 text-gray-600">{formatKES(p.buyingPrice)}</td>
                        <td className="py-2.5 px-4 font-semibold">{formatKES(p.sellingPrice)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`text-xs font-semibold ${margin >= 20 ? 'text-green-700' : margin >= 10 ? 'text-amber-700' : 'text-red-700'}`}>{margin}%</span>
                        </td>
                        <td className="py-2.5 px-4">
                          <button onClick={() => setShowStock(p)} className={`font-bold text-sm hover:underline ${outOfStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-green-700'}`}>
                            {p.stock || 0} {p.unit}
                          </button>
                        </td>
                        <td className="py-2.5 px-4">
                          {outOfStock ? <span className="badge badge-red">Out of Stock</span> :
                           lowStock ? <span className="badge badge-yellow">Low Stock</span> :
                           <span className="badge badge-green">In Stock</span>}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(p)} className="btn-ghost btn-icon btn-sm text-blue-600" title="Edit"><Edit2 size={13}/></button>
                            <button onClick={() => setShowStock(p)} className="btn-ghost btn-icon btn-sm text-green-600" title="Adjust Stock"><Package size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              <span>{filtered.length} products</span>
              <span className="font-semibold text-gray-700">Showing stock value: {formatKES(totalValue)}</span>
            </div>
          </>
        )}
      </div>
 
      {/* Add/Edit Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setShowAdd(false); setEditing(null) }} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" required placeholder="e.g. Unga Pembe 2kg" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
              </div>
              {[
                { k: 'sku', label: 'SKU *', ph: 'UNG-2KG', req: true },
                { k: 'barcode', label: 'Barcode', ph: '4712345678' },
                { k: 'buyingPrice', label: 'Buying Price (KES) *', ph: '120', type: 'number', req: true },
                { k: 'sellingPrice', label: 'Selling Price (KES) *', ph: '150', type: 'number', req: true },
                { k: 'stock', label: 'Opening Stock', ph: '0', type: 'number' },
                { k: 'lowStockAt', label: 'Reorder Point', ph: '10', type: 'number' },
              ].map(({ k, label, ph, type, req }) => (
                <div key={k}>
                  <label className="label">{label}</label>
                  <input className="input" placeholder={ph} type={type || 'text'} required={req}
                    value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>
                  {k === 'sellingPrice' && form.buyingPrice && form.sellingPrice && (
                    <p className={`text-xs mt-0.5 ${Number(form.sellingPrice) > Number(form.buyingPrice) ? 'text-green-600' : 'text-red-600'}`}>
                      Margin: {form.sellingPrice > 0 ? Math.round(((form.sellingPrice - form.buyingPrice) / form.sellingPrice) * 100) : 0}% · Profit: {formatKES(form.sellingPrice - form.buyingPrice)}
                    </p>
                  )}
                </div>
              ))}
              <div>
                <label className="label">Category</label>
                <select className="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Unit</label>
                <select className="select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'dozen', 'pair', 'bag', 'tin', 'roll', 'set'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">VAT Rate</label>
                <select className="select" value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))}>
                  <option value="16">16% (Standard)</option>
                  <option value="0">0% (Exempt)</option>
                  <option value="8">8% (Reduced)</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={() => { setShowAdd(false); setEditing(null) }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update Product' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
 
      {/* Stock Adjustment Modal */}
      {showStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Stock Adjustment</h2>
              <button onClick={() => setShowStock(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900">{showStock.name}</p>
              <p className="text-sm text-gray-600">Current: <span className="font-bold text-blue-700">{showStock.stock || 0} {showStock.unit}</span></p>
            </div>
            <form onSubmit={adjustStock} className="space-y-3">
              <div>
                <label className="label">Type *</label>
                <select className="select" value={stockAdj.type} onChange={e => setStockAdj(s => ({ ...s, type: e.target.value }))}>
                  <option value="ADJUSTMENT_IN">Stock In (Received)</option>
                  <option value="ADJUSTMENT_OUT">Stock Out (Loss)</option>
                  <option value="OPENING_STOCK">Set Opening Stock</option>
                  <option value="RETURN_IN">Customer Return</option>
                  <option value="DAMAGE">Damage / Expired</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input className="input" type="number" min="1" required autoFocus placeholder="Enter quantity"
                  value={stockAdj.qty} onChange={e => setStockAdj(s => ({ ...s, qty: e.target.value }))}/>
                {stockAdj.qty && (
                  <p className="text-xs text-gray-500 mt-1">New stock: <span className="font-bold text-blue-700">
                    {stockAdj.type === 'OPENING_STOCK' ? Number(stockAdj.qty) :
                     ['ADJUSTMENT_IN', 'RETURN_IN'].includes(stockAdj.type) ? (showStock.stock || 0) + Number(stockAdj.qty) :
                     Math.max(0, (showStock.stock || 0) - Number(stockAdj.qty))} {showStock.unit}
                  </span></p>
                )}
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Reason for adjustment..." value={stockAdj.notes} onChange={e => setStockAdj(s => ({ ...s, notes: e.target.value }))}/>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowStock(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Adjust Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState({ isOpen: false })
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ supplierId: '', notes: '', expectedDate: '', items: [] })
 
  useEffect(() => {
    load()
    api.get('/inventory/suppliers').then(r => setSuppliers(r.data || [])).catch(() => {})
    api.get('/inventory/products?limit=200').then(r => setProducts(r.data || [])).catch(() => {})
  }, [])
 
  const load = async () => {
    setLoading(true)
    try {
      const url = '/inventory/purchase-orders' + (filterStatus ? '?status=' + filterStatus : '')
      const r = await api.get(url)
      setOrders(r.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
 
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', productName: '', qty: 1, unitCost: '', taxRate: 0 }] }))
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))
  const updateItem = (i, key, val) => {
    setForm(f => {
      const items = [...f.items]
      items[i] = { ...items[i], [key]: val }
      if (key === 'productId') {
        const prod = products.find(p => p.id === val)
        if (prod) items[i].productName = prod.name
        if (prod && !items[i].unitCost) items[i].unitCost = prod.buyingPrice
      }
      return { ...f, items }
    })
  }
 
  const createPO = async (e) => {
    e.preventDefault()
    if (!form.supplierId) return toast.error('Select a supplier')
    if (form.items.length === 0) return toast.error('Add at least one item')
    if (form.items.some(i => !i.productId || !i.unitCost)) return toast.error('Fill all item details')
 
    setModal({ isOpen: true, type: 'loading', title: 'Creating purchase order...', message: 'Please wait' })
    try {
      await api.post('/inventory/purchase-orders', form)
      setModal({ isOpen: true, type: 'success', title: 'Purchase Order Created!', message: 'PO created successfully.', confirmText: 'OK', onConfirm: () => { setModal({ isOpen: false }); setShowCreate(false); setForm({ supplierId: '', notes: '', expectedDate: '', items: [] }); load() }, onCancel: () => setModal({ isOpen: false }) })
    } catch (err) {
      setModal({ isOpen: true, type: 'error', title: 'Failed', message: err.error || 'Could not create PO', confirmText: 'OK', onConfirm: () => setModal({ isOpen: false }), onCancel: () => setModal({ isOpen: false }) })
    }
  }
 
  const receivePO = async (order) => {
    setModal({ isOpen: true, type: 'warning', title: 'Receive Stock?', message: 'This will add all items to stock and mark the PO as received. This cannot be undone.', confirmText: 'Yes, Receive', cancelText: 'Cancel',
      onConfirm: async () => {
        setModal({ isOpen: true, type: 'loading', title: 'Receiving stock...', message: 'Updating inventory' })
        try {
          await api.patch('/inventory/purchase-orders/' + order.id + '/receive')
          setModal({ isOpen: true, type: 'success', title: 'Stock Received!', message: 'All items added to inventory.', autoClose: 2000, confirmText: 'OK', onConfirm: () => { setModal({ isOpen: false }); load(); setSelected(null) }, onCancel: () => setModal({ isOpen: false }) })
        } catch (err) {
          setModal({ isOpen: true, type: 'error', title: 'Failed', message: err.error || 'Could not receive stock', confirmText: 'OK', onConfirm: () => setModal({ isOpen: false }), onCancel: () => setModal({ isOpen: false }) })
        }
      },
      onCancel: () => setModal({ isOpen: false })
    })
  }
 
  const subtotal = form.items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.unitCost || 0), 0)
 
  const STATUS_COLORS = { DRAFT: 'badge-gray', ORDERED: 'badge-blue', PARTIAL: 'badge-yellow', RECEIVED: 'badge-green', CANCELLED: 'badge-red' }
 
  return (
    <div className="space-y-4">
      <ValidationModal {...modal} />
 
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select className="select w-36" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setTimeout(load, 100) }}>
          <option value="">All Status</option>
          {['DRAFT','ORDERED','PARTIAL','RECEIVED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1"/>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus size={14}/>New Purchase Order</button>
      </div>
 
      <div className={"grid gap-4 " + (selected ? 'grid-cols-1 xl:grid-cols-3' : 'grid-cols-1')}>
        {/* Orders list */}
        <div className={"bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden " + (selected ? 'xl:col-span-2' : '')}>
          {loading ? (
            <div className="p-5 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <Truck size={36} className="mx-auto mb-2 opacity-20"/>
              <p className="text-sm">No purchase orders yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['PO #', 'Supplier', 'Date', 'Items', 'Total', 'Status', ''].map(h =>
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)} className={"cursor-pointer hover:bg-gray-50 transition-colors " + (selected?.id === o.id ? 'bg-blue-50' : '')}>
                    <td className="py-2.5 px-4"><span className="font-mono text-xs font-semibold text-blue-700">{o.poNumber}</span></td>
                    <td className="py-2.5 px-4 font-medium">{o.supplier?.name}</td>
                    <td className="py-2.5 px-4 text-gray-500">{formatDate(o.orderDate)}</td>
                    <td className="py-2.5 px-4">{o.items?.length || 0} items</td>
                    <td className="py-2.5 px-4 font-semibold">{formatKES(o.total)}</td>
                    <td className="py-2.5 px-4"><span className={"badge " + (STATUS_COLORS[o.status] || 'badge-gray')}>{o.status}</span></td>
                    <td className="py-2.5 px-4"><Eye size={14} className="text-gray-400"/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
 
        {/* PO Detail */}
        {selected && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">{selected.poNumber}</p>
                <p className="text-xs text-gray-500">{selected.supplier?.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <div className="space-y-1 text-xs mb-3">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className={"badge " + (STATUS_COLORS[selected.status] || 'badge-gray')}>{selected.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Order Date</span><span>{formatDate(selected.orderDate)}</span></div>
              {selected.expectedDate && <div className="flex justify-between"><span className="text-gray-500">Expected</span><span>{formatDate(selected.expectedDate)}</span></div>}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              {selected.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <div>
                    <p className="font-medium">{item.product?.name || item.productName}</p>
                    <p className="text-gray-400">{item.qty} {item.product?.unit} × {formatKES(item.unitCost)}</p>
                  </div>
                  <span className="font-semibold">{formatKES(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-3 pt-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatKES(selected.subtotal)}</span></div>
              {selected.taxAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{formatKES(selected.taxAmount)}</span></div>}
              <div className="flex justify-between font-bold text-sm"><span>Total</span><span className="text-blue-700">{formatKES(selected.total)}</span></div>
            </div>
            {selected.notes && <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 rounded-lg px-3 py-2">"{selected.notes}"</p>}
            {selected.status !== 'RECEIVED' && selected.status !== 'CANCELLED' && (
              <button onClick={() => receivePO(selected)} className="btn-success w-full mt-3 justify-center flex items-center gap-2 text-sm">
                <CheckCircle size={14}/>Mark as Received
              </button>
            )}
            {selected.status === 'RECEIVED' && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-3 py-2 mt-3 text-xs font-semibold">
                <CheckCircle size={14}/> Received {formatDate(selected.deliveredAt)}
              </div>
            )}
          </div>
        )}
      </div>
 
      {/* Create PO Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">New Purchase Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={createPO} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Supplier *</label>
                  <select className="select" required value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
                    <option value="">Select supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {suppliers.length === 0 && <p className="text-xs text-amber-600 mt-1">⚠ No suppliers yet — add one first</p>}
                </div>
                <div>
                  <label className="label">Expected Delivery</label>
                  <input type="date" className="input" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))}/>
                </div>
              </div>
 
              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Items *</label>
                  <button type="button" onClick={addItem} className="btn-ghost btn-sm text-blue-600 flex items-center gap-1"><Plus size={13}/>Add Item</button>
                </div>
                {form.items.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline flex items-center gap-2 mx-auto"><Plus size={14}/>Add first item</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.items.map((item, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl p-2">
                        <div className="col-span-4">
                          <select className="select text-xs py-1.5" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                            <option value="">Select product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="number" min="1" className="input text-xs py-1.5" placeholder="Qty" value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)}/>
                        </div>
                        <div className="col-span-3">
                          <input type="number" min="0" className="input text-xs py-1.5" placeholder="Unit Cost" value={item.unitCost} onChange={e => updateItem(i, 'unitCost', e.target.value)}/>
                        </div>
                        <div className="col-span-2 text-xs font-semibold text-gray-700 text-right">
                          {formatKES(Number(item.qty || 0) * Number(item.unitCost || 0))}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end text-sm font-bold text-gray-900 px-2">
                      Total: <span className="text-blue-700 ml-2">{formatKES(subtotal)}</span>
                    </div>
                  </div>
                )}
              </div>
 
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}/>
              </div>
 
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={form.items.length === 0}>Create Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// SUPPLIERS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', kraPin: '', contactName: '', paymentTerms: '30' })
 
  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/inventory/suppliers'); setSuppliers(r.data || []) } catch {}
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
 
  const save = async (e) => {
    e.preventDefault()
    try {
      if (editing) { await api.patch('/inventory/suppliers/' + editing.id, form); toast.success('Supplier updated') }
      else { await api.post('/inventory/suppliers', form); toast.success('Supplier added') }
      setShowAdd(false); setEditing(null)
      setForm({ name: '', phone: '', email: '', address: '', kraPin: '', contactName: '', paymentTerms: '30' })
      load()
    } catch (err) { toast.error(err.error || 'Failed') }
  }
 
  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', kraPin: s.kraPin || '', contactName: s.contactName || '', paymentTerms: s.paymentTerms || '30' })
    setShowAdd(true)
  }
 
  const filtered = suppliers.filter(s => !search || (s.name + s.phone + (s.email || '')).toLowerCase().includes(search.toLowerCase()))
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name:'',phone:'',email:'',address:'',kraPin:'',contactName:'',paymentTerms:'30' }); setShowAdd(true) }} className="btn-primary flex items-center gap-2"><Plus size={14}/>Add Supplier</button>
      </div>
 
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-5 space-y-2">{[...Array(4)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        : filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-20"/>
            <p className="text-sm">No suppliers yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['Supplier','Contact','Phone','Email','KRA PIN','Terms','Actions'].map(h =>
                <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              )}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-2.5 px-4">
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.code}</p>
                  </td>
                  <td className="py-2.5 px-4 text-gray-600">{s.contactName || '—'}</td>
                  <td className="py-2.5 px-4">{s.phone}</td>
                  <td className="py-2.5 px-4 text-gray-600">{s.email || '—'}</td>
                  <td className="py-2.5 px-4 font-mono text-xs">{s.kraPin || '—'}</td>
                  <td className="py-2.5 px-4">{s.paymentTerms || 30} days</td>
                  <td className="py-2.5 px-4">
                    <button onClick={() => openEdit(s)} className="btn-ghost btn-icon btn-sm text-blue-600"><Edit2 size={13}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
 
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Supplier' : 'Add Supplier'}</h2>
              <button onClick={() => { setShowAdd(false); setEditing(null) }} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="label">Supplier Name *</label><input className="input" required placeholder="Supplier Ltd" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></div>
              {[
                { k:'contactName', label:'Contact Person', ph:'John Kamau', span:false },
                { k:'phone', label:'Phone *', ph:'0712345678', req:true },
                { k:'email', label:'Email', ph:'supplier@co.ke', type:'email' },
                { k:'kraPin', label:'KRA PIN', ph:'P051234567A' },
                { k:'address', label:'Address', ph:'Nairobi, Kenya', span:true },
                { k:'paymentTerms', label:'Payment Terms (days)', ph:'30', type:'number' },
              ].map(({ k, label, ph, type, req, span }) => (
                <div key={k} className={span ? 'col-span-2' : ''}>
                  <label className="label">{label}</label>
                  <input className="input" placeholder={ph} type={type || 'text'} required={req} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>
                </div>
              ))}
              <div className="col-span-2 flex gap-3 mt-1">
                <button type="button" onClick={() => { setShowAdd(false); setEditing(null) }} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// STOCK MOVEMENTS PAGE
// ══════════════════════════════════════════════════════════════════════════════
function MovementsPage() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState({ type: '' })
 
  const load = async () => {
    setLoading(true)
    try {
      let url = '/inventory/stock/movements?page=' + page + '&limit=30'
      if (filter.type) url += '&type=' + filter.type
      const r = await api.get(url)
      setMovements(r.data || [])
      setTotal(r.total || 0)
    } catch {}
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [page, filter])
 
  const TYPES = { PURCHASE:'green', SALE:'red', ADJUSTMENT_IN:'blue', ADJUSTMENT_OUT:'orange', RETURN_IN:'green', RETURN_OUT:'red', DAMAGE:'red', OPENING_STOCK:'purple' }
 
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <select className="select w-44" value={filter.type} onChange={e => { setFilter(f => ({ ...f, type: e.target.value })); setPage(1) }}>
          <option value="">All Movement Types</option>
          {Object.keys(TYPES).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <div className="flex-1"/>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
      </div>
 
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-5 space-y-2">{[...Array(8)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        : movements.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <ArrowUpDown size={36} className="mx-auto mb-2 opacity-20"/>
            <p className="text-sm">No stock movements yet</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {['Date','Product','Type','Qty','Reason'].map(h =>
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                )}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map(m => {
                  const isIn = ['PURCHASE','RETURN_IN','ADJUSTMENT_IN','OPENING_STOCK'].includes(m.type)
                  return (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-gray-500">{formatDateTime(m.createdAt)}</td>
                      <td className="py-2.5 px-4">
                        <p className="font-medium text-gray-900">{m.product?.name}</p>
                        <p className="text-xs text-gray-400">{m.product?.sku}</p>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`badge badge-${TYPES[m.type] || 'gray'}`}>{m.type.replace(/_/g,' ')}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`font-bold ${isIn ? 'text-green-700' : 'text-red-700'}`}>
                          {isIn ? '+' : '-'}{Math.abs(m.qty)} {m.product?.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">{m.reason || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              <span>{total} total movements</span>
              <div className="flex items-center gap-2">
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
                <span>{page}</span>
                <button disabled={movements.length < 30} onClick={()=>setPage(p=>p+1)} className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// STOCK VALUATION PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ValuationPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'costValue', dir: 'desc' })
 
  useEffect(() => {
    api.get('/inventory/reports/valuation').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])
 
  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))
 
  const filtered = (data?.items || [])
    .filter(p => !search || (p.name + p.sku).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort.dir === 'desc' ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key])
 
  const SortIcon = ({ k }) => sort.key === k ? (sort.dir === 'desc' ? <ChevronDown size={12}/> : <ChevronUp size={12}/>) : null
 
  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
 
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Cost Value', value: formatKES(data?.totals?.costValue), desc: 'What you paid', color: 'border-blue-200 bg-blue-50' },
          { label: 'Total Retail Value', value: formatKES(data?.totals?.retailValue), desc: 'What you can sell for', color: 'border-green-200 bg-green-50' },
          { label: 'Potential Profit', value: formatKES(data?.totals?.potentialProfit), desc: 'If all stock sold', color: 'border-purple-200 bg-purple-50' },
        ].map(({ label, value, desc, color }) => (
          <div key={label} className={`rounded-xl border p-5 ${color}`}>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
            <p className="text-xs text-gray-500">{desc}</p>
          </div>
        ))}
      </div>
 
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>
 
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Product</th>
              <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600" onClick={() => toggleSort('stock')}>
                <span className="flex items-center justify-end gap-1">Stock <SortIcon k="stock"/></span>
              </th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Cost</th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600" onClick={() => toggleSort('costValue')}>
                <span className="flex items-center justify-end gap-1">Cost Value <SortIcon k="costValue"/></span>
              </th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600" onClick={() => toggleSort('potentialProfit')}>
                <span className="flex items-center justify-end gap-1">Profit <SortIcon k="potentialProfit"/></span>
              </th>
              <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-2.5 px-4">
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.sku}</p>
                </td>
                <td className="py-2.5 px-4 text-gray-600">{p.category}</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={`font-semibold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-green-700'}`}>{p.stock} {p.unit}</span>
                </td>
                <td className="py-2.5 px-4 text-right text-gray-600">{formatKES(p.buyingPrice)}</td>
                <td className="py-2.5 px-4 text-right font-medium">{formatKES(p.sellingPrice)}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-blue-700">{formatKES(p.costValue)}</td>
                <td className="py-2.5 px-4 text-right font-semibold text-green-700">{formatKES(p.potentialProfit)}</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.margin >= 20 ? 'bg-green-100 text-green-700' : p.margin >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.margin}%</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold">
              <td className="py-2.5 px-4" colSpan={5}>Total ({filtered.length} products, {data?.totals?.totalUnits || 0} units)</td>
              <td className="py-2.5 px-4 text-right text-blue-700">{formatKES(data?.totals?.costValue)}</td>
              <td className="py-2.5 px-4 text-right text-green-700">{formatKES(data?.totals?.potentialProfit)}</td>
              <td className="py-2.5 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function InventoryPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title">Inventory & Warehouse</h1>
        <p className="page-subtitle">Products, purchase orders, stock movements and valuation</p>
      </div>
      <InventoryNav/>
      <Routes>
        <Route index element={<OverviewPage/>}/>
        <Route path="products" element={<ProductsPage/>}/>
        <Route path="purchase-orders" element={<PurchaseOrdersPage/>}/>
        <Route path="suppliers" element={<SuppliersPage/>}/>
        <Route path="movements" element={<MovementsPage/>}/>
        <Route path="valuation" element={<ValuationPage/>}/>
      </Routes>
    </div>
  )
}
