#!/bin/bash

# Define paths
PROJECT_ROOT="$HOME/biashara-os"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🛰️  Wiring up Real-time Inventory Engine..."

# 1. Create the Backend Product Controller
cat << 'NODE_EOF' > "$BACKEND_DIR/src/routes/product.js"
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all products for the tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query; // In prod, get this from JWT
    const products = await prisma.product.findMany({
      where: { tenantId: tenantId },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add a new product (The logic behind your Blue Button)
router.post('/', async (req, res) => {
  try {
    const { name, price, stock, tenantId } = req.body;
    const newProduct = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        tenantId
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: 'Invalid product data' });
  }
});

module.exports = router;
NODE_EOF

# 2. Update Frontend for Expert-Density UI & Live Data
cat << 'REACT_EOF' > "$FRONTEND_DIR/src/pages/Retail.tsx"
import React, { useState, useEffect } from 'react';

export default function RetailPOS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Retrieve our Tenant ID (simulating session storage for Biashara HQ)
  const tenantId = "bafb1120-53a4-4ba5-b794-003cc0e0394f"; 

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/products?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    setCart(curr => {
      const exists = curr.find(i => i.id === product.id);
      if (exists) return curr.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i);
      return [...curr, { ...product, qty: 1 }];
    });
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden">
      {/* Left Side: Product Grid */}
      <div className="flex-1 flex flex-col p-6 space-y-4">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800 uppercase">Retail Terminal</h1>
            <p className="text-xs text-slate-500 font-medium">Session: Active • Terminal 01</p>
          </div>
          <input 
            type="text" 
            placeholder="Search items (F1)..." 
            className="w-64 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="group relative bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left"
            >
              <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 text-[10px] font-bold rounded text-slate-600">
                {product.stock} units
              </span>
              <div className="text-sm font-semibold text-slate-800">{product.name}</div>
              <div className="text-xs font-bold text-blue-600 mt-1">KES {product.price}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Side: Ledger (Zoho-inspired) */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Current Receipt</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm items-start">
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{item.name}</div>
                <div className="text-[11px] text-slate-400">{item.qty} x {item.price}</div>
              </div>
              <div className="font-mono font-bold">{(item.qty * item.price).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
          <div className="flex justify-between items-center text-xl font-black">
            <span>TOTAL</span>
            <span className="text-blue-700">KES {cart.reduce((a, b) => a + (b.price * b.qty), 0).toFixed(2)}</span>
          </div>
          <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200">
            VALIDATE PAYMENT
          </button>
        </div>
      </div>
    </div>
  );
}
REACT_EOF

echo "🚀 Pushing Real-Time Engine to GitHub..."
git add .
git commit -m "feat(retail): implement live inventory sync and high-density UI layout"
git push origin main
