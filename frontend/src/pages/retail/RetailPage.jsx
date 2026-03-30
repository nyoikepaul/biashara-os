import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { formatKES } from '../../lib/utils'
import toast from 'react-hot-toast'
import { Plus, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react'

export default function RetailPage() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [summary, setSummary] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [receipt, setReceipt] = useState(null)
  const [newProduct, setNewProduct] = useState({ name:'', sku:'', category:'', buyingPrice:'', sellingPrice:'', stock:'', unit:'pcs' })

  useEffect(() => {
    api.get('/retail/products').then(r => setProducts(r.data)).catch(()=>{})
    api.get('/retail/reports/summary').then(r => setSummary(r.data)).catch(()=>{})
  }, [])

  const addToCart = (product) => {
    if (product.stock === 0) return
    setCart(c => {
      const ex = c.find(i => i.productId === product.id)
      if (ex) return c.map(i => i.productId===product.id ? {...i, qty:i.qty+1} : i)
      return [...c, { productId:product.id, name:product.name, unitPrice:product.sellingPrice, qty:1, stock:product.stock }]
    })
  }

  const updateQty = (productId, delta) => setCart(c => c.map(i => i.productId===productId ? {...i, qty:Math.max(0,i.qty+delta)} : i).filter(i => i.qty>0))

  const cartTotal = cart.reduce((s,i) => s+i.unitPrice*i.qty, 0)

  const checkout = async () => {
    if (cart.length===0) return toast.error('Cart is empty')
    setProcessing(true)
    try {
      const res = await api.post('/retail/sales', { items: cart.map(i=>({productId:i.productId,qty:i.qty})), customerPhone, customerName, paymentMethod })
      setReceipt(res.data)
      setCart([])
      toast.success('Sale complete! Receipt: ' + res.data.receiptNo)
      api.get('/retail/reports/summary').then(r => setSummary(r.data)).catch(()=>{})
    } catch (err) { toast.error(err.error || 'Sale failed') }
    finally { setProcessing(false) }
  }

  const addProduct = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/retail/products', { ...newProduct, buyingPrice:Number(newProduct.buyingPrice), sellingPrice:Number(newProduct.sellingPrice), stock:Number(newProduct.stock) })
      setProducts(p => [...p, res.data])
      setShowAdd(false)
      setNewProduct({ name:'', sku:'', category:'', buyingPrice:'', sellingPrice:'', stock:'', unit:'pcs' })
      toast.success('Product added')
    } catch (err) { toast.error(err.error || 'Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Retail & POS</h1>
          <p className="text-gray-500 text-sm">M-Pesa STK Push · KRA eTIMS invoicing</p>
        </div>
        <button onClick={()=>setShowAdd(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add Product</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{label:"Today's Revenue",value:formatKES(summary.today?.revenue)},{label:"Today's Sales",value:summary.today?.transactions},{label:'Month Revenue',value:formatKES(summary.month?.revenue)},{label:'Low Stock Items',value:summary.lowStock?.length||0}].map(({label,value})=>(
            <div key={label} className="card"><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-sm text-gray-500">{label}</p></div>
          ))}
        </div>
      )}

      {receipt && (
        <div className="card border-green-200 bg-green-50">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-600"/>
            <div>
              <p className="font-semibold text-green-900">Sale Complete — Receipt #{receipt.receiptNo}</p>
              {receipt.qrCode && <img src={receipt.qrCode} alt="KRA QR" className="mt-2 w-24 h-24"/>}
            </div>
            <button onClick={()=>setReceipt(null)} className="ml-auto text-green-600 text-sm underline">Dismiss</button>
          </div>
        </div>
      )}

      {summary?.lowStock?.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle size={18}/>
            <p className="font-medium text-sm">Low Stock: {summary.lowStock.map(p=>p.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold text-gray-900 mb-3">Products ({products.length})</h3>
          {products.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No products yet. Add your first product.</p> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map(p => (
                <button key={p.id} onClick={()=>addToCart(p)} disabled={p.stock===0}
                  className="text-left border rounded-xl p-3 transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed">
                  <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                  <p className="text-blue-600 font-semibold text-sm mt-0.5">{formatKES(p.sellingPrice)}</p>
                  <p className={`text-xs mt-1 ${p.stock<=p.lowStockAt?'text-red-500':'text-gray-400'}`}>Stock: {p.stock} {p.unit}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ShoppingCart size={18}/>Cart {cart.length>0 && <span className="badge-blue">{cart.length}</span>}
          </h3>
          {cart.length===0 ? <p className="text-gray-400 text-sm text-center py-8">Click products to add</p> : (
            <>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatKES(item.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>updateQty(item.productId,-1)} className="w-7 h-7 rounded-lg bg-gray-100 text-sm font-bold hover:bg-gray-200">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                      <button onClick={()=>updateQty(item.productId,1)} className="w-7 h-7 rounded-lg bg-gray-100 text-sm font-bold hover:bg-gray-200">+</button>
                    </div>
                    <span className="text-sm font-semibold min-w-[56px] text-right">{formatKES(item.unitPrice*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-3">
                <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span>{formatKES(cartTotal)}</span></div>
                <input className="input" placeholder="Customer phone (optional)" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/>
                <input className="input" placeholder="Customer name (optional)" value={customerName} onChange={e=>setCustomerName(e.target.value)}/>
                <select className="input" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value)}>
                  {['CASH','MPESA','CARD','BANK_TRANSFER'].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
                <button onClick={checkout} disabled={processing} className="btn-primary w-full">
                  {processing ? 'Processing...' : 'Checkout — '+formatKES(cartTotal)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Add Product</h2>
            <form onSubmit={addProduct} className="grid grid-cols-2 gap-3">
              {[{k:'name',label:'Product Name',ph:'Unga 2kg',span:2},{k:'sku',label:'SKU',ph:'UNG-2KG'},{k:'category',label:'Category',ph:'Groceries'},{k:'buyingPrice',label:'Buying Price',ph:'120',type:'number'},{k:'sellingPrice',label:'Selling Price',ph:'150',type:'number'},{k:'stock',label:'Opening Stock',ph:'100',type:'number'},{k:'unit',label:'Unit',ph:'pcs'}].map(({k,label,ph,span,type})=>(
                <div key={k} className={span===2?'col-span-2':''}>
                  <label className="label">{label}</label>
                  <input className="input" required placeholder={ph} type={type||'text'} value={newProduct[k]} onChange={e=>setNewProduct(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div className="col-span-2 flex gap-3 mt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
