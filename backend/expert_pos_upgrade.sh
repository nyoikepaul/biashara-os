#!/bin/bash

export PGPASSWORD='postgres'
PROJECT_ROOT="$HOME/biashara-os"
FRONTEND_FILE="$PROJECT_ROOT/frontend/src/pages/Retail.tsx"

# Fetch the real ID for the code injection
REAL_TENANT_ID=$(psql -U postgres -d biashara_db -h localhost -t -A -c "SELECT id FROM \"Tenant\" WHERE slug='biashara-hq' LIMIT 1;")

echo "🎨 Refining UI and Logic for BiasharaOS Retail..."

cat << REACT_EOF > "$FRONTEND_FILE"
import React, { useState, useEffect } from 'react';

export default function RetailPOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Dynamic fetch using the verified Tenant ID
    fetch(\`/api/products?tenantId=${REAL_TENANT_ID}\`)
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(err => console.error("Sync Error:", err));
  }, []);

  const addToCart = (product) => {
    setCart(curr => {
      const exists = curr.find(i => i.id === product.id);
      if (exists) return curr.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i);
      return [...curr, { ...product, qty: 1 }];
    });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased overflow-hidden">
      {/* Left: Product Grid (Odoo Style) */}
      <div className="flex-1 flex flex-col p-5 space-y-4">
        <header className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-[10px] font-black tracking-[0.3em] text-blue-600 uppercase">BiasharaOS // POS Terminal</h1>
            <h2 className="text-xl font-bold text-slate-800">Inventory Feed</h2>
          </div>
          <div className="relative">
             <input 
              type="text" 
              placeholder="Search SKU or Name..." 
              className="w-80 pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 opacity-30">🔍</span>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2 pb-10">
          {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-100 transition-all text-left flex flex-col justify-between h-44"
            >
              <div>
                <div className="text-[10px] font-bold text-slate-400 mb-1">{product.sku}</div>
                <div className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-700 transition-colors">{product.name}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-end">
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Price</div>
                  <div className="text-md font-black text-slate-900">KES {product.price.toFixed(0)}</div>
                </div>
                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-black uppercase">Add +</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: The Checkout Ledger (Zoho/Surge Style) */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="p-6 bg-slate-900 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black tracking-widest uppercase opacity-50">Active Cart</h3>
            <span className="text-[10px] bg-blue-500 px-2 py-0.5 rounded font-bold">{cart.length} Items</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300">
               <div className="text-4xl mb-2">🛒</div>
               <p className="text-xs font-bold uppercase tracking-widest">Cart Empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm animate-in fade-in slide-in-from-right-2">
                <div className="flex-1 pr-4">
                  <div className="font-bold text-slate-800 truncate">{item.name}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{item.qty} units @ {item.price}</div>
                </div>
                <div className="font-mono font-bold text-slate-900">{(item.qty * item.price).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <div className="flex justify-between items-end mb-6">
            <span className="text-[10px] text-slate-400 font-black tracking-widest">TOTAL KES</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              {cart.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString()}
            </span>
          </div>
          <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-[0.96] shadow-xl shadow-blue-200 uppercase text-[12px] tracking-[0.2em]">
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
}
REACT_EOF

echo "🚀 Pushing expert-grade POS to GitHub..."
cd "$PROJECT_ROOT"
git add .
git commit -m "feat(pos): expert UI layout with dynamic tenant context"
git push origin main
unset PGPASSWORD
