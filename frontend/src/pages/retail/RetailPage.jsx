import { useAuthStore } from '../../lib/store'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Package, BarChart2, Settings, Plus, Minus, X, Search,
  Trash2, CreditCard, Smartphone, Banknote, Receipt, RefreshCw,
  ChevronDown, Filter, Tag, AlertTriangle, CheckCircle, Loader2,
  ArrowLeft, Printer, Eye, RotateCcw, TrendingUp, Clock, Users,
  Scan, Save, MoreHorizontal, Edit2, Archive, Star
} from 'lucide-react'
import api from '../../lib/api'
import { formatKES, formatDate, formatDateTime, timeAgo, badgeClass, debounce } from '../../lib/utils'
import { ValidationModal } from '../../components/ui/ValidationModal'
import toast from 'react-hot-toast'
 
// ── Shared sub-nav ────────────────────────────────────────────────────────────
function RetailNav() {
  const links = [
    { to: '/retail',          label: 'Point of Sale',    icon: ShoppingCart, end: true },
    { to: '/retail/products', label: 'Products',         icon: Package },
    { to: '/retail/sales',    label: 'Sales History',    icon: Receipt },
    { to: '/retail/reports',  label: 'Reports',          icon: BarChart2 },
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
// POS TERMINAL
// ══════════════════════════════════════════════════════════════════════════════
function POSTerminal() {
  const [products, setProducts]         = useState([])
  const [categories, setCategories]     = useState([])
  const [cart, setCart]                 = useState([])
  const [search, setSearch]             = useState('')
  const [activeCategory, setActiveCat]  = useState('All')
  const [loading, setLoading]           = useState(true)
  const [processing, setProcessing]     = useState(false)
  const [customer, setCustomer]         = useState(null)
  const [customers, setCustomers]       = useState([])
  const [showCustomer, setShowCustomer] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [paymentMethod, setPaymentMethod]   = useState('CASH')
  const [discount, setDiscount]         = useState({ type: 'amount', value: '' })
  const [showDiscount, setShowDiscount] = useState(false)
  const [heldOrders, setHeldOrders]     = useState([])
  const [showHeld, setShowHeld]         = useState(false)
  const [receipt, setReceipt]           = useState(null)
  const [modal, setModal]               = useState({ isOpen: false })
  const [note, setNote]                 = useState('')
  const searchRef = useRef(null)
 
  useEffect(() => {
    loadProducts()
    loadCustomers()
    const saved = localStorage.getItem('pos_held_orders')
    if (saved) setHeldOrders(JSON.parse(saved))
  }, [])
 
  useEffect(() => {
    searchRef.current?.focus()
  }, [])
 
  const loadProducts = async () => {
    setLoading(true)
    try {
      const r = await api.get('/retail/products')
      const prods = r.data || []
      setProducts(prods)
      const cats = ['All', ...new Set(prods.map(p => p.category).filter(Boolean))]
      setCategories(cats)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }
 
  const loadCustomers = async () => {
    try { const r = await api.get('/customers'); setCustomers(r.data || []) } catch {}
  }
 
  // ── Cart operations ──────────────────────────────────────────────────────
  const addToCart = (product) => {
    if ((product.stock ?? 0) <= 0) { toast.error('Out of stock: ' + product.name); return }
    setCart(c => {
      const existing = c.find(i => i.productId === product.id)
      if (existing) {
        if (existing.qty >= (product.stock ?? 999)) { toast.error('Max stock reached'); return c }
        return c.map(i => i.productId === product.id ? { ...i, qty: i.qty + 1, subtotal: (i.qty + 1) * i.unitPrice } : i)
      }
      return [...c, {
        productId: product.id, name: product.name, sku: product.sku,
        unitPrice: product.sellingPrice, qty: 1, vatRate: product.vatRate || 16,
        subtotal: product.sellingPrice, stock: product.stock, unit: product.unit || 'pcs',
        discount: 0
      }]
    })
  }
 
  const updateQty = (productId, qty) => {
    if (qty <= 0) { removeFromCart(productId); return }
    setCart(c => c.map(i => i.productId === productId ? { ...i, qty, subtotal: qty * i.unitPrice * (1 - i.discount/100) } : i))
  }
 
  const updateItemDiscount = (productId, discPct) => {
    setCart(c => c.map(i => i.productId === productId ? { ...i, discount: Number(discPct), subtotal: i.qty * i.unitPrice * (1 - Number(discPct)/100) } : i))
  }
 
  const removeFromCart = (productId) => setCart(c => c.filter(i => i.productId !== productId))
  const clearCart = () => { setCart([]); setCustomer(null); setDiscount({ type:'amount', value:'' }); setNote('') }
 
  // ── Totals ────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const globalDisc = discount.value
    ? discount.type === 'percent' ? subtotal * Number(discount.value) / 100 : Math.min(Number(discount.value), subtotal)
    : 0
  const afterDisc = subtotal - globalDisc
  const vatAmount = cart.reduce((s, i) => s + (i.subtotal * (i.vatRate / (100 + i.vatRate))), 0)
  const total = afterDisc
 
  // ── Hold / Recall ─────────────────────────────────────────────────────────
  const holdOrder = () => {
    if (cart.length === 0) return
    const held = [...heldOrders, { id: Date.now(), cart, customer, note, createdAt: new Date().toISOString() }]
    setHeldOrders(held)
    localStorage.setItem('pos_held_orders', JSON.stringify(held))
    clearCart()
    toast.success('Order held successfully')
  }
 
  const recallOrder = (order) => {
    setCart(order.cart)
    setCustomer(order.customer)
    setNote(order.note)
    const updated = heldOrders.filter(h => h.id !== order.id)
    setHeldOrders(updated)
    localStorage.setItem('pos_held_orders', JSON.stringify(updated))
    setShowHeld(false)
    toast.success('Order recalled')
  }
 
  // ── Checkout ──────────────────────────────────────────────────────────────
  const checkout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    if (paymentMethod === 'MPESA' && !customer?.phone && !customer) {
      toast.error('Enter customer phone for M-Pesa payment')
      return
    }
    setProcessing(true)
    setModal({ isOpen: true, type: 'loading', title: 'Processing sale...', message: 'Recording transaction and updating stock' })
    try {
      const res = await api.post('/retail/sales', {
        items: cart.map(i => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice, discount: i.discount || 0 })),
        customerId: customer?.id,
        customerPhone: customer?.phone,
        customerName: customer?.name,
        paymentMethod,
        discount: globalDisc,
        note
      })
      setModal({ isOpen: false })
      setReceipt(res.data)
      clearCart()
      loadProducts()
      toast.success('Sale complete! Receipt #' + res.data.receiptNo)
    } catch (err) {
      setModal({ isOpen: false })
      setModal({ isOpen: true, type: 'error', title: 'Sale Failed', message: err.error || 'Could not process the sale. Please try again.', confirmText: 'OK', onConfirm: () => setModal({ isOpen: false }), onCancel: () => setModal({ isOpen: false }) })
    } finally { setProcessing(false) }
  }
 
  // ── Filter products ───────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase()) || (p.barcode || '').includes(search)
    return matchCat && matchSearch && p.isActive !== false
  })
 
  const lowStockProducts = products.filter(p => (p.stock ?? 0) <= (p.lowStockAt || 10))
 
  if (receipt) return <ReceiptView receipt={receipt} onClose={() => setReceipt(null)} onNewSale={() => setReceipt(null)} />
 
  return (
    <>
      <ValidationModal {...modal} />
 
      <div className="flex gap-4 h-[calc(100vh-140px)]">
        {/* ── Left: Product Grid ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Search + filters */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input ref={searchRef} className="input pl-9 py-2" placeholder="Search product, SKU or scan barcode..."
                value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button onClick={loadProducts} className="btn-secondary btn-icon" title="Refresh"><RefreshCw size={14}/></button>
            {heldOrders.length > 0 && (
              <button onClick={() => setShowHeld(true)} className="btn-secondary relative flex items-center gap-1.5">
                <Save size={14}/>Held
                <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">{heldOrders.length}</span>
              </button>
            )}
          </div>
 
          {/* Low stock alert */}
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-xs">
              <AlertTriangle size={13} className="text-amber-500 flex-shrink-0"/>
              <span className="text-amber-700 font-medium">Low stock: {lowStockProducts.slice(0,3).map(p => p.name).join(', ')}{lowStockProducts.length > 3 ? ' +' + (lowStockProducts.length-3) + ' more' : ''}</span>
            </div>
          )}
 
          {/* Category tabs */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 flex-shrink-0">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap " +
                  (activeCategory === cat ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300')}>
                {cat}
              </button>
            ))}
          </div>
 
          {/* Product grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse"/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Package size={40} className="mb-2 opacity-30"/>
              <p className="text-sm font-medium">{search ? 'No products match "' + search + '"' : 'No products in this category'}</p>
              {search && <button onClick={() => setSearch('')} className="mt-2 text-blue-600 text-xs hover:underline">Clear search</button>}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-2">
                {filtered.map(product => {
                  const outOfStock = (product.stock ?? 0) <= 0
                  const lowStock = !outOfStock && (product.stock ?? 0) <= (product.lowStockAt || 10)
                  const inCart = cart.find(i => i.productId === product.id)
                  return (
                    <button key={product.id} onClick={() => addToCart(product)} disabled={outOfStock}
                      className={"relative text-left bg-white border rounded-xl p-3 transition-all hover:shadow-md group " +
                        (outOfStock ? 'opacity-50 cursor-not-allowed border-gray-200' :
                         inCart ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-blue-300')}>
                      {/* Stock badge */}
                      {outOfStock && <span className="absolute top-2 right-2 badge badge-red text-xs">Out</span>}
                      {lowStock && !outOfStock && <span className="absolute top-2 right-2 badge badge-yellow text-xs">{product.stock} left</span>}
                      {inCart && !outOfStock && <span className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{inCart.qty}</span>}
 
                      <div className="mb-2">
                        <div className="w-full h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                          <Package size={20} className={"text-gray-300 group-hover:text-blue-400 transition-colors " + (inCart ? 'text-blue-500' : '')}/>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 leading-tight line-clamp-2">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-sm font-bold text-blue-600">{formatKES(product.sellingPrice)}</p>
                        <p className="text-xs text-gray-400">{product.unit}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
 
        {/* ── Right: Cart ── */}
        <div className="w-80 xl:w-96 flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm flex-shrink-0">
          {/* Cart header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-blue-600"/>
              <span className="font-semibold text-gray-900 text-sm">Cart</span>
              {cart.length > 0 && <span className="badge badge-blue">{cart.reduce((s,i)=>s+i.qty,0)} items</span>}
            </div>
            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <>
                  <button onClick={holdOrder} className="btn-ghost btn-icon" title="Hold order"><Save size={14}/></button>
                  <button onClick={clearCart} className="btn-ghost btn-icon text-red-500 hover:bg-red-50" title="Clear cart"><Trash2 size={14}/></button>
                </>
              )}
            </div>
          </div>
 
          {/* Customer selection */}
          <div className="px-4 py-2 border-b border-gray-100">
            {customer ? (
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-blue-900">{customer.name}</p>
                  <p className="text-xs text-blue-600">{customer.phone}</p>
                </div>
                <button onClick={() => setCustomer(null)} className="text-blue-400 hover:text-blue-600"><X size={13}/></button>
              </div>
            ) : (
              <button onClick={() => setShowCustomer(true)}
                className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 border border-dashed border-gray-300 hover:border-blue-400 rounded-lg px-3 py-2 transition-all">
                <Users size={13}/> Add Customer (optional)
              </button>
            )}
          </div>
 
          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                <ShoppingCart size={32} className="mb-2 opacity-20"/>
                <p className="text-xs">Click products to add to cart</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.productId} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatKES(item.unitPrice)} each · {item.vatRate}% VAT</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X size={13}/></button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                        <button onClick={() => updateQty(item.productId, item.qty - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-l-lg transition-colors">
                          <Minus size={12}/>
                        </button>
                        <input type="number" min="1" max={item.stock}
                          className="w-10 text-center text-xs font-bold outline-none bg-transparent py-1"
                          value={item.qty} onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}/>
                        <button onClick={() => updateQty(item.productId, item.qty + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-r-lg transition-colors">
                          <Plus size={12}/>
                        </button>
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <Tag size={11} className="text-gray-400"/>
                        <input type="number" min="0" max="100" placeholder="Disc%"
                          className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400"
                          value={item.discount || ''} onChange={e => updateItemDiscount(item.productId, e.target.value)}/>
                      </div>
                      <span className="text-xs font-bold text-gray-900 min-w-[64px] text-right">{formatKES(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          {/* Cart footer */}
          {cart.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal ({cart.reduce((s,i)=>s+i.qty,0)} items)</span>
                  <span>{formatKES(subtotal)}</span>
                </div>
                {globalDisc > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatKES(globalDisc)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>VAT (16%)</span>
                  <span>{formatKES(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span className="text-blue-700">{formatKES(total)}</span>
                </div>
              </div>
 
              {/* Discount button */}
              <button onClick={() => setShowDiscount(!showDiscount)}
                className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-blue-600 transition-colors py-1">
                <span className="flex items-center gap-1"><Tag size={11}/>Apply order discount</span>
                <ChevronDown size={12} className={"transition-transform " + (showDiscount ? 'rotate-180' : '')}/>
              </button>
              {showDiscount && (
                <div className="flex gap-2">
                  <select className="select text-xs py-1.5" value={discount.type} onChange={e => setDiscount(d => ({ ...d, type: e.target.value }))}>
                    <option value="amount">KES</option>
                    <option value="percent">%</option>
                  </select>
                  <input type="number" min="0" className="input text-xs py-1.5 flex-1" placeholder={discount.type === 'percent' ? 'e.g. 10' : 'e.g. 500'}
                    value={discount.value} onChange={e => setDiscount(d => ({ ...d, value: e.target.value }))}/>
                </div>
              )}
 
              {/* Note */}
              <input className="input text-xs py-1.5" placeholder="Add order note (optional)"
                value={note} onChange={e => setNote(e.target.value)}/>
 
              {/* Payment method */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'CASH', icon: Banknote, label: 'Cash' },
                  { id: 'MPESA', icon: Smartphone, label: 'M-Pesa' },
                  { id: 'CARD', icon: CreditCard, label: 'Card' },
                  { id: 'CREDIT', icon: Tag, label: 'Credit' },
                ].map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setPaymentMethod(id)}
                    className={"flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-xs font-medium transition-all " +
                      (paymentMethod === id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300')}>
                    <Icon size={14}/>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
 
              {/* Checkout button */}
              <button onClick={checkout} disabled={processing || cart.length === 0}
                className="btn-primary w-full justify-center text-base py-3 font-bold shadow-lg shadow-blue-200">
                {processing ? <><Loader2 size={16} className="animate-spin"/>Processing...</> : <>Charge {formatKES(total)} →</>}
              </button>
            </div>
          )}
        </div>
      </div>
 
      {/* ── Customer search modal ── */}
      {showCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Select Customer</h3>
              <button onClick={() => setShowCustomer(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input pl-9" placeholder="Search by name or phone..." autoFocus
                value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}/>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {customers.filter(c => (c.name+c.phone).toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                <button key={c.id} onClick={() => { setCustomer(c); setShowCustomer(false); setCustomerSearch('') }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                    {c.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone} · {formatKES(c.totalRevenue || 0)} total</p>
                  </div>
                  {c.loyaltyPoints > 0 && <span className="ml-auto badge badge-yellow text-xs">{c.loyaltyPoints}pts</span>}
                </button>
              ))}
              {customers.filter(c => (c.name+c.phone).toLowerCase().includes(customerSearch.toLowerCase())).length === 0 && (
                <p className="text-center text-gray-400 py-4 text-sm">No customers found</p>
              )}
            </div>
            <button onClick={() => setShowCustomer(false)} className="btn-secondary w-full mt-3">Skip</button>
          </div>
        </div>
      )}
 
      {/* ── Held orders modal ── */}
      {showHeld && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Held Orders ({heldOrders.length})</h3>
              <button onClick={() => setShowHeld(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {heldOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{order.cart.length} items · {formatKES(order.cart.reduce((s,i)=>s+i.subtotal,0))}</p>
                    <p className="text-xs text-gray-500">{order.customer?.name || 'Walk-in'} · {timeAgo(order.createdAt)}</p>
                    {order.note && <p className="text-xs text-blue-600 italic">"{order.note}"</p>}
                  </div>
                  <button onClick={() => recallOrder(order)} className="btn-primary btn-sm">Recall</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// RECEIPT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ReceiptView({ receipt, onClose, onNewSale }) {
  // store imported at top
  const { tenant } = useAuthStore()
 
  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Receipt header */}
        <div className="bg-green-600 text-white px-6 py-5 text-center">
          <CheckCircle size={32} className="mx-auto mb-2 opacity-90"/>
          <p className="font-bold text-lg">Sale Complete!</p>
          <p className="text-green-200 text-sm mt-0.5">Receipt #{receipt.receiptNo}</p>
        </div>
 
        <div className="p-5 space-y-4">
          {/* Business info */}
          <div className="text-center border-b border-dashed border-gray-200 pb-4">
            <p className="font-bold text-gray-900">{tenant?.name || 'BiasharaOS'}</p>
            {tenant?.kraPin && <p className="text-xs text-gray-500">KRA PIN: {tenant.kraPin}</p>}
            <p className="text-xs text-gray-500">{formatDateTime(receipt.createdAt)}</p>
          </div>
 
          {/* Items */}
          <div className="space-y-2">
            {receipt.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-900">{item.product?.name || item.productName}</p>
                  <p className="text-xs text-gray-500">{item.qty} × {formatKES(item.unitPrice)}</p>
                </div>
                <p className="font-semibold">{formatKES(item.subtotal)}</p>
              </div>
            ))}
          </div>
 
          {/* Totals */}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatKES(receipt.subtotal)}</span></div>
            {receipt.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatKES(receipt.discount)}</span></div>}
            <div className="flex justify-between text-gray-600"><span>VAT (16%)</span><span>{formatKES(receipt.vatAmount)}</span></div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t border-gray-200">
              <span>TOTAL</span><span className="text-blue-700">{formatKES(receipt.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Payment Method</span><span className="font-medium">{receipt.paymentMethod}</span>
            </div>
          </div>
 
          {/* QR Code */}
          {receipt.qrCode && (
            <div className="text-center">
              <img src={receipt.qrCode} alt="KRA eTIMS QR" className="w-20 h-20 mx-auto border border-gray-200 rounded-lg p-1"/>
              <p className="text-xs text-gray-400 mt-1">KRA eTIMS Verified</p>
            </div>
          )}
 
          {/* M-Pesa ref */}
          {receipt.stkCheckoutId && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xs font-semibold text-green-800">M-Pesa STK Push Sent</p>
              <p className="text-xs text-green-600">Customer will receive payment prompt</p>
            </div>
          )}
 
          <div className="text-center text-xs text-gray-400 border-t border-dashed border-gray-200 pt-3">
            <p>Thank you for your business!</p>
            <p className="mt-0.5">Powered by BiasharaOS</p>
          </div>
        </div>
      </div>
 
      <div className="flex gap-3 mt-4">
        <button onClick={onClose} className="btn-secondary flex-1 justify-center"><Printer size={14}/>Print</button>
        <button onClick={onNewSale} className="btn-primary flex-1 justify-center">New Sale →</button>
      </div>
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════
function ProductsPage() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('All')
  const [showAdd, setShowAdd]     = useState(false)
  const [editing, setEditing]     = useState(null)
  const [showStock, setShowStock] = useState(null)
  const [stockAdj, setStockAdj]   = useState({ qty: '', type: 'ADJUSTMENT_IN', notes: '' })
  const [form, setForm] = useState({ name:'', sku:'', barcode:'', category:'General', unit:'pcs', buyingPrice:'', sellingPrice:'', vatRate:'16', stock:'0', lowStockAt:'10', description:'' })
 
  const CATEGORIES = ['General','Food & Beverages','Electronics','Clothing','Pharmacy','Hardware','Stationery','Agriculture','Beauty','Other']
 
  useEffect(() => { load() }, [])
 
  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/retail/products'); setProducts(r.data || []) } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }
 
  const save = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, buyingPrice: Number(form.buyingPrice), sellingPrice: Number(form.sellingPrice), vatRate: Number(form.vatRate), stock: Number(form.stock), lowStockAt: Number(form.lowStockAt) }
      if (editing) {
        await api.patch('/retail/products/' + editing.id, payload)
        toast.success('Product updated')
      } else {
        await api.post('/retail/products', payload)
        toast.success('Product added')
      }
      setShowAdd(false); setEditing(null)
      setForm({ name:'', sku:'', barcode:'', category:'General', unit:'pcs', buyingPrice:'', sellingPrice:'', vatRate:'16', stock:'0', lowStockAt:'10', description:'' })
      load()
    } catch (err) { toast.error(err.error || 'Failed') }
  }
 
  const adjustStock = async (e) => {
    e.preventDefault()
    if (!stockAdj.qty || !showStock) return
    try {
      await api.post('/retail/stock/adjust', { productId: showStock.id, qty: stockAdj.type.includes('OUT') ? -Math.abs(stockAdj.qty) : Math.abs(stockAdj.qty), type: stockAdj.type, notes: stockAdj.notes })
      toast.success('Stock adjusted')
      setShowStock(null)
      setStockAdj({ qty: '', type: 'ADJUSTMENT_IN', notes: '' })
      load()
    } catch (err) { toast.error(err.error || 'Failed to adjust stock') }
  }
 
  const openEdit = (p) => {
    setEditing(p)
    setForm({ name:p.name, sku:p.sku||'', barcode:p.barcode||'', category:p.category||'General', unit:p.unit||'pcs', buyingPrice:p.buyingPrice||'', sellingPrice:p.sellingPrice||'', vatRate:p.vatRate||16, stock:p.stock||0, lowStockAt:p.lowStockAt||10, description:p.description||'' })
    setShowAdd(true)
  }
 
  const categories = ['All', ...CATEGORIES]
  const filtered = products.filter(p => {
    const matchSearch = !search || (p.name+p.sku).toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'All' || p.category === filterCat
    return matchSearch && matchCat
  })
 
  const totalStockValue = products.reduce((s,p) => s + (p.buyingPrice * (p.stock||0)), 0)
  const lowStockCount = products.filter(p => (p.stock||0) <= (p.lowStockAt||10)).length
 
  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label:'Total Products', value: products.length, color:'text-blue-700 bg-blue-50' },
          { label:'Low Stock', value: lowStockCount, color:'text-red-700 bg-red-50' },
          { label:'Stock Value', value: formatKES(totalStockValue), color:'text-green-700 bg-green-50' },
          { label:'Categories', value: new Set(products.map(p=>p.category)).size, color:'text-purple-700 bg-purple-50' },
        ].map(({ label, value, color }) => (
          <div key={label} className={"rounded-xl p-4 border border-gray-100 " + color.split(' ')[1]}>
            <p className={"text-xl font-bold " + color.split(' ')[0]}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
 
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search products or SKU..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="select w-36" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
        <button onClick={() => { setEditing(null); setForm({name:'',sku:'',barcode:'',category:'General',unit:'pcs',buyingPrice:'',sellingPrice:'',vatRate:'16',stock:'0',lowStockAt:'10',description:''}); setShowAdd(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={14}/>Add Product
        </button>
      </div>
 
      {/* Products table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">{[...Array(5)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={36} className="mx-auto mb-2 opacity-20"/>
            <p className="text-sm">{search ? 'No products match your search' : 'No products yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table">
              <thead>
                <tr>
                  {['Product','SKU','Category','Buying Price','Selling Price','VAT','Stock','Status','Actions'].map(h =>
                    <th key={h}>{h}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const outOfStock = (p.stock||0) === 0
                  const lowStock = !outOfStock && (p.stock||0) <= (p.lowStockAt||10)
                  const margin = p.buyingPrice > 0 ? Math.round(((p.sellingPrice - p.buyingPrice)/p.sellingPrice)*100) : 0
                  return (
                    <tr key={p.id}>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">{p.name}</p>
                          {p.barcode && <p className="text-xs text-gray-400">{p.barcode}</p>}
                        </div>
                      </td>
                      <td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{p.sku}</span></td>
                      <td>{p.category}</td>
                      <td className="text-gray-600">{formatKES(p.buyingPrice)}</td>
                      <td>
                        <div>
                          <span className="font-semibold">{formatKES(p.sellingPrice)}</span>
                          <span className="text-xs text-green-600 ml-1">{margin}% margin</span>
                        </div>
                      </td>
                      <td>{p.vatRate}%</td>
                      <td>
                        <button onClick={() => setShowStock(p)} className={"font-bold hover:underline " + (outOfStock ? 'text-red-600' : lowStock ? 'text-amber-600' : 'text-green-700')}>
                          {p.stock||0} {p.unit}
                        </button>
                      </td>
                      <td>
                        {outOfStock ? <span className="badge badge-red">Out of Stock</span> :
                         lowStock ? <span className="badge badge-yellow">Low Stock</span> :
                         <span className="badge badge-green">In Stock</span>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(p)} className="btn-ghost btn-icon btn-sm text-blue-600"><Edit2 size={13}/></button>
                          <button onClick={() => setShowStock(p)} className="btn-ghost btn-icon btn-sm text-green-600"><Package size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing {filtered.length} of {products.length} products</span>
            <span className="font-semibold text-gray-700">Stock Value: {formatKES(totalStockValue)}</span>
          </div>
        )}
      </div>
 
      {/* Add/Edit Product Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => { setShowAdd(false); setEditing(null) }} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Product Name *</label>
                <input className="input" required placeholder="e.g. Unga Pembe 2kg" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              </div>
              <div>
                <label className="label">SKU *</label>
                <input className="input" required placeholder="UNG-2KG" value={form.sku} onChange={e=>setForm(f=>({...f,sku:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Barcode</label>
                <input className="input" placeholder="4712345678901" value={form.barcode} onChange={e=>setForm(f=>({...f,barcode:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="select" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Unit of Measure</label>
                <select className="select" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                  {['pcs','kg','g','litre','ml','box','dozen','pair','set','roll','bag','tin'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Buying Price (KES) *</label>
                <input className="input" type="number" required min="0" step="0.01" placeholder="0.00" value={form.buyingPrice} onChange={e=>setForm(f=>({...f,buyingPrice:e.target.value}))}/>
              </div>
              <div>
                <label className="label">Selling Price (KES) *</label>
                <input className="input" type="number" required min="0" step="0.01" placeholder="0.00" value={form.sellingPrice} onChange={e=>setForm(f=>({...f,sellingPrice:e.target.value}))}/>
                {form.buyingPrice && form.sellingPrice && (
                  <p className={"text-xs mt-1 " + (Number(form.sellingPrice)>Number(form.buyingPrice)?'text-green-600':'text-red-600')}>
                    Margin: {form.buyingPrice > 0 ? Math.round(((form.sellingPrice-form.buyingPrice)/form.sellingPrice)*100) : 0}%
                    · Profit: {formatKES(form.sellingPrice - form.buyingPrice)}
                  </p>
                )}
              </div>
              <div>
                <label className="label">VAT Rate %</label>
                <select className="select" value={form.vatRate} onChange={e=>setForm(f=>({...f,vatRate:e.target.value}))}>
                  <option value="16">16% (Standard)</option>
                  <option value="0">0% (Exempt)</option>
                  <option value="8">8% (Reduced)</option>
                </select>
              </div>
              <div>
                <label className="label">Opening Stock</label>
                <input className="input" type="number" min="0" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/>
              </div>
              <div className="col-span-2">
                <label className="label">Reorder Point (Low Stock Alert)</label>
                <input className="input" type="number" min="0" value={form.lowStockAt} onChange={e=>setForm(f=>({...f,lowStockAt:e.target.value}))}/>
                <p className="text-xs text-gray-400 mt-1">Alert when stock falls to or below this number</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Stock Adjustment</h2>
              <button onClick={() => setShowStock(null)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="font-semibold text-gray-900">{showStock.name}</p>
              <p className="text-sm text-gray-600">Current Stock: <span className="font-bold text-blue-700">{showStock.stock||0} {showStock.unit}</span></p>
            </div>
            <form onSubmit={adjustStock} className="space-y-3">
              <div>
                <label className="label">Adjustment Type</label>
                <select className="select" value={stockAdj.type} onChange={e=>setStockAdj(s=>({...s,type:e.target.value}))}>
                  <option value="ADJUSTMENT_IN">Stock In (Received)</option>
                  <option value="ADJUSTMENT_OUT">Stock Out (Loss/Damage)</option>
                  <option value="OPENING_STOCK">Opening Stock Reset</option>
                  <option value="DAMAGE">Damage/Expired</option>
                  <option value="RETURN_IN">Customer Return</option>
                </select>
              </div>
              <div>
                <label className="label">Quantity *</label>
                <input className="input" type="number" required min="1" placeholder="Enter quantity" autoFocus
                  value={stockAdj.qty} onChange={e=>setStockAdj(s=>({...s,qty:e.target.value}))}/>
                {stockAdj.qty && (
                  <p className="text-xs mt-1 text-gray-500">
                    New stock: <span className="font-bold text-blue-700">
                      {stockAdj.type.includes('OUT') || stockAdj.type === 'DAMAGE'
                        ? Math.max(0, (showStock.stock||0) - Number(stockAdj.qty))
                        : stockAdj.type === 'OPENING_STOCK'
                        ? Number(stockAdj.qty)
                        : (showStock.stock||0) + Number(stockAdj.qty)
                      } {showStock.unit}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className="label">Notes</label>
                <input className="input" placeholder="Reason for adjustment..." value={stockAdj.notes} onChange={e=>setStockAdj(s=>({...s,notes:e.target.value}))}/>
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
// SALES HISTORY
// ══════════════════════════════════════════════════════════════════════════════
function SalesHistory() {
  const [sales, setSales]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [page, setPage]         = useState(1)
  const [total, setTotal]       = useState(0)
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState({ from:'', to:'', method:'' })
  const [showRefund, setShowRefund] = useState(null)
  const LIMIT = 20
 
  useEffect(() => { load() }, [page, filter])
 
  const load = async () => {
    setLoading(true)
    try {
      let url = '/retail/sales?page='+page+'&limit='+LIMIT
      if (filter.from) url += '&from='+filter.from
      if (filter.to) url += '&to='+filter.to
      const r = await api.get(url)
      setSales(r.data || [])
      setTotal(r.total || 0)
    } catch { toast.error('Failed to load sales') }
    finally { setLoading(false) }
  }
 
  const initRefund = async (sale) => {
    if (!confirm('Process full refund for ' + sale.receiptNo + '?')) return
    try {
      await api.post('/retail/sales/' + sale.id + '/refund')
      toast.success('Refund processed for ' + sale.receiptNo)
      load()
      setSelected(null)
    } catch (err) { toast.error(err.error || 'Refund failed') }
  }
 
  const filtered = sales.filter(s =>
    !search || s.receiptNo?.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName?.toLowerCase().includes(search.toLowerCase())
  )
 
  const totalPages = Math.ceil(total / LIMIT)
  const dayRevenue = sales.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0)
 
  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Today's Sales", value: formatKES(dayRevenue), color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Transactions', value: total, color: 'bg-green-50 text-green-700' },
          { label: 'This Page', value: filtered.length + ' records', color: 'bg-gray-50 text-gray-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={"rounded-xl p-3 border border-gray-100 " + color.split(' ')[0]}>
            <p className={"font-bold text-lg " + color.split(' ')[1]}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>
 
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search receipt # or customer..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <input type="date" className="input w-36" value={filter.from} onChange={e=>setFilter(f=>({...f,from:e.target.value}))} title="From date"/>
        <input type="date" className="input w-36" value={filter.to} onChange={e=>setFilter(f=>({...f,to:e.target.value}))} title="To date"/>
        <select className="select w-32" value={filter.method} onChange={e=>setFilter(f=>({...f,method:e.target.value}))}>
          <option value="">All Methods</option>
          {['CASH','MPESA','CARD','CREDIT'].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={load} className="btn-secondary btn-icon"><RefreshCw size={14}/></button>
      </div>
 
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Sales list */}
        <div className={"xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden " + (selected ? '' : 'xl:col-span-3')}>
          {loading ? (
            <div className="p-4 space-y-2">{[...Array(8)].map((_,i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"/>)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Receipt size={36} className="mx-auto mb-2 opacity-20"/>
              <p className="text-sm">No sales found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table">
                  <thead><tr>
                    {['Receipt #','Customer','Items','Method','Total','Time','Status',''].map(h => <th key={h}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filtered.map(sale => (
                      <tr key={sale.id} onClick={() => setSelected(sale)} className={"cursor-pointer " + (selected?.id===sale.id ? 'bg-blue-50' : '')}>
                        <td><span className="font-mono text-xs font-semibold text-blue-700">{sale.receiptNo}</span></td>
                        <td>{sale.customerName || <span className="text-gray-400 italic">Walk-in</span>}</td>
                        <td>{sale.items?.length || 0}</td>
                        <td><span className={"badge " + (sale.paymentMethod==='MPESA'?'badge-green':sale.paymentMethod==='CASH'?'badge-gray':'badge-blue')}>{sale.paymentMethod}</span></td>
                        <td className="font-bold text-gray-900">{formatKES(sale.total)}</td>
                        <td className="text-gray-500">{timeAgo(sale.createdAt)}</td>
                        <td><span className={"badge " + (sale.status==='COMPLETED'?'badge-green':sale.status==='REFUNDED'?'badge-red':'badge-gray')}>{sale.status}</span></td>
                        <td><Eye size={14} className="text-gray-400"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-t border-gray-100">
                <span className="text-xs text-gray-500">{total} total records</span>
                <div className="flex items-center gap-2">
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary btn-sm disabled:opacity-40">← Prev</button>
                  <span className="text-xs text-gray-600">{page}/{totalPages}</span>
                  <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)} className="btn-secondary btn-sm disabled:opacity-40">Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
 
        {/* Sale detail */}
        {selected && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-sm">{selected.receiptNo}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{formatDateTime(selected.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{selected.customerName || 'Walk-in'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span>{selected.paymentMethod}</span></div>
              {selected.mpesaRef && <div className="flex justify-between"><span className="text-gray-500">M-Pesa Ref</span><span className="font-mono">{selected.mpesaRef}</span></div>}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
              {selected.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-700">{item.product?.name || 'Product'} ×{item.qty}</span>
                  <span className="font-semibold">{formatKES(item.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs">
              {selected.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatKES(selected.discount)}</span></div>}
              <div className="flex justify-between text-gray-600"><span>VAT</span><span>{formatKES(selected.vatAmount)}</span></div>
              <div className="flex justify-between font-bold text-sm"><span>Total</span><span className="text-blue-700">{formatKES(selected.total)}</span></div>
            </div>
            {selected.etimsQrCode && (
              <div className="text-center mt-3">
                <img src={selected.etimsQrCode} alt="eTIMS" className="w-16 h-16 mx-auto border border-gray-200 rounded p-1"/>
                <p className="text-xs text-gray-400 mt-1">KRA Verified</p>
              </div>
            )}
            {selected.status === 'COMPLETED' && (
              <button onClick={() => initRefund(selected)}
                className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-red-600 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors">
                <RotateCcw size={12}/>Process Refund
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// RETAIL REPORTS
// ══════════════════════════════════════════════════════════════════════════════
function RetailReports() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
 
  useEffect(() => {
    Promise.all([
      api.get('/retail/reports/summary'),
      api.get('/crm/reports/sales?days=30').catch(() => ({ data: null }))
    ]).then(([s, a]) => {
      setSummary(s.data)
      setAnalytics(a.data)
    }).finally(() => setLoading(false))
  }, [])
 
  if (loading) return <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/></div>
 
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Today's Revenue", value: formatKES(summary?.today?.revenue || 0), sub: (summary?.today?.transactions || 0) + ' transactions', color: 'bg-blue-50' },
          { label: "Month Revenue", value: formatKES(summary?.month?.revenue || 0), sub: (summary?.month?.transactions || 0) + ' transactions', color: 'bg-green-50' },
          { label: "Top Products", value: analytics?.topProducts?.length || 0, sub: 'Products sold this month', color: 'bg-purple-50' },
          { label: "Low Stock Items", value: summary?.lowStock?.length || 0, sub: 'Need reordering', color: 'bg-red-50' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={"rounded-xl p-4 border border-gray-100 " + color}>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{sub}</p>
          </div>
        ))}
      </div>
 
      {analytics?.topProducts?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Top Products (Last 30 days)</h3>
          <div className="space-y-3">
            {analytics.topProducts.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <span className="text-sm font-bold text-green-700 ml-2">{formatKES(p.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: (p.revenue / analytics.topProducts[0].revenue * 100) + '%' }}/>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{p.qty_sold} units sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {analytics?.byPaymentMethod?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Payment Methods</h3>
          <div className="space-y-2">
            {analytics.byPaymentMethod.map(m => {
              const total = analytics.byPaymentMethod.reduce((s,x) => s + (Number(x._sum?.total)||0), 0)
              const pct = total > 0 ? Math.round((Number(m._sum?.total)||0) / total * 100) : 0
              return (
                <div key={m.paymentMethod} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 w-20">{m.paymentMethod}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full " + (m.paymentMethod==='MPESA'?'bg-green-500':m.paymentMethod==='CASH'?'bg-blue-500':'bg-purple-500')} style={{ width: pct + '%' }}/>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-10 text-right">{pct}%</span>
                  <span className="text-xs text-gray-500 w-20 text-right">{formatKES(m._sum?.total)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
 
      {summary?.lowStock?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-red-700 text-sm mb-3 flex items-center gap-2"><AlertTriangle size={14}/>Low Stock Alert</h3>
          <div className="space-y-2">
            {summary.lowStock.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.sku} · Reorder at: {p.lowStockAt}</p>
                </div>
                <span className="text-sm font-bold text-red-700">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
 
// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function RetailPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="page-title">Retail & POS</h1>
        <p className="page-subtitle">Point of sale, product management, sales history and reports</p>
      </div>
      <RetailNav/>
      <Routes>
        <Route index element={<POSTerminal/>}/>
        <Route path="products" element={<ProductsPage/>}/>
        <Route path="sales" element={<SalesHistory/>}/>
        <Route path="reports" element={<RetailReports/>}/>
      </Routes>
    </div>
  )
}
