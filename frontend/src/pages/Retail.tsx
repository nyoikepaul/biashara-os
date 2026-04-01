import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Product { id: string; name: string; price: number; sku?: string; }
interface CartItem { productId: string; name: string; price: number; quantity: number; discount: number; }

export default function Retail() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { 
      const res = await axios.get(`${API_URL}/api/retail/products`); 
      return res.data; 
    }
  });

  const filteredProducts = products.filter((p: Product) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exist = prev.find(i => i.productId === product.id);
      if (exist) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, discount: 0 }];
    });
    toast.success(`Added ${product.name}`);
  };

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCart(prev => prev.map(i => i.productId === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.productId !== id));

  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity * (1 - i.discount/100)), 0);

  const completeSale = useMutation({
    mutationFn: async (method: 'cash' | 'mpesa') => {
      const payload = {
        items: cart,
        total: subtotal,
        paymentMethod: method,
        phone: method === 'mpesa' ? customerPhone : undefined,
      };
      const res = await axios.post(`${API_URL}/api/retail/sales`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`✅ Sale #${data.saleId} completed!`);
      setCart([]);
      setCustomerPhone('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Sale failed')
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Retail &amp; POS</h1>
          <div className="px-4 py-1 bg-green-100 text-green-700 rounded-2xl text-sm font-medium">Session OPEN</div>
        </div>

        <div className="p-6">
          <input
            type="text"
            placeholder="🔍 Search products or scan barcode..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xl px-6 py-5 text-lg border-2 border-gray-200 rounded-3xl focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex-1 px-6 pb-6 overflow-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <div key={i} className="h-52 bg-gray-100 rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredProducts.map((p: Product) => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white border border-gray-200 rounded-3xl p-4 hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer active:scale-95"
                >
                  <div className="h-40 bg-gray-100 rounded-2xl flex items-center justify-center text-6xl mb-4">📦</div>
                  <p className="font-semibold text-lg leading-tight">{p.name}</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">KES {p.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-96 bg-white border-l flex flex-col shadow-2xl">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold">Cart ({cart.length})</h2>
          {customerPhone && <p className="text-sm text-green-600">📱 {customerPhone} (M-Pesa ready)</p>}
        </div>

        <div className="flex-1 p-6 space-y-4 overflow-auto">
          {cart.map(item => (
            <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-4 rounded-3xl">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">KES {item.price} × {item.quantity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center border rounded-2xl hover:bg-gray-100">-</button>
                <span className="w-8 text-center font-mono">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center border rounded-2xl hover:bg-gray-100">+</button>
                <button onClick={() => removeItem(item.productId)} className="ml-2 text-red-500 text-xl">🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t mt-auto">
          <div className="flex justify-between text-xl font-semibold mb-4">
            <span>Total</span>
            <span>KES {subtotal.toLocaleString()}</span>
          </div>

          <input
            type="tel"
            placeholder="M-Pesa phone (254...)"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="w-full px-4 py-3 border rounded-2xl mb-4 text-lg"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => completeSale.mutate('cash')}
              disabled={cart.length === 0}
              className="py-7 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xl font-bold rounded-3xl"
            >
              CASH
            </button>
            <button
              onClick={() => completeSale.mutate('mpesa')}
              disabled={cart.length === 0 || !customerPhone}
              className="py-7 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xl font-bold rounded-3xl"
            >
              M-PESA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
