#!/bin/bash

# Define paths (adjust if your frontend folder is named differently)
PROJECT_ROOT="$HOME/biashara-os"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
POS_FILE="$FRONTEND_DIR/src/pages/Retail.tsx"

echo "🛒 Upgrading Retail & POS UI to Expert Mode..."

# Ensure the frontend directory exists before writing
mkdir -p "$(dirname "$POS_FILE")"

# 1. Scaffold the High-Density, Dynamic POS Component
cat << 'REACT_EOF' > "$POS_FILE"
import React, { useState } from 'react';

export default function RetailPOS() {
  const [cart, setCart] = useState([]);
  
  // Mock inventory for now - will be replaced with API fetch
  const products = [
    { id: 1, name: 'Maize Meal 2kg', price: 200, stock: 50 },
    { id: 2, name: 'Cooking Oil 1L', price: 350, stock: 30 },
    { id: 3, name: 'Sugar 1kg', price: 150, stock: 100 },
  ];

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Products Grid (Odoo Style - High Density) */}
      <div className="w-2/3 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Retail & POS</h2>
        <div className="grid grid-cols-3 gap-4">
          {products.map(product => (
            <button 
              key={product.id} 
              onClick={() => handleAddToCart(product)}
              className="p-4 bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <div className="font-medium text-gray-800">{product.name}</div>
              <div className="text-sm text-gray-500 mt-1">KES {product.price.toFixed(2)}</div>
              <div className="text-xs text-green-600 mt-2">{product.stock} in stock</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Checkout (Zoho/Surge Style - Robust Ledger) */}
      <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-100">
          <h3 className="text-lg font-medium text-gray-700">Current Order</h3>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Cart is empty</div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-3 text-sm">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <div className="text-gray-500">KES {item.price} x {item.qty}</div>
                </div>
                <div className="font-medium">KES {(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-lg font-bold mb-4">
            <span>Total</span>
            <span>KES {totalAmount.toFixed(2)}</span>
          </div>
          <button 
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-medium transition-colors"
            onClick={() => alert('Proceeding to M-Pesa / eTIMS generation...')}
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}
REACT_EOF

echo "✅ Dynamic POS logic created."

# 2. Push to GitHub to trigger Vercel deployment
echo "🚀 Staging and pushing to GitHub..."
cd "$PROJECT_ROOT" || exit
git add .
git commit -m "feat(retail): implement hybrid POS logic and high-density UI"
git push origin main

echo "🎉 Done! Vercel is building the new UI."
echo "🔗 Check it live in a minute: https://frontend-three-peach-18.vercel.app/retail"
