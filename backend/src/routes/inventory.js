const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
// ─── WAREHOUSES ───────────────────────────────────────────────────────────────
router.get('/warehouses', async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: warehouses });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.post('/warehouses', async (req, res) => {
  try {
    const { name, location, isDefault } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    const wh = await prisma.warehouse.create({
      data: { tenantId: req.tenantId, name, location: location || '', isDefault: isDefault || false }
    });
    res.json({ success: true, data: wh });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.patch('/warehouses/:id', async (req, res) => {
  try {
    const wh = await prisma.warehouse.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: wh });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const { search, category, lowStock, page = 1, limit = 50 } = req.query;
    const where = { tenantId: req.tenantId };
    if (category) where.category = category;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } }
    ];
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);
    const result = lowStock === 'true'
      ? products.filter(p => (p.stock || 0) <= (p.lowStockAt || 10))
      : products;
    res.json({ success: true, data: result, total });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.post('/products', async (req, res) => {
  try {
    const product = await prisma.product.create({
      data: {
        ...req.body,
        tenantId: req.tenantId,
        buyingPrice: Number(req.body.buyingPrice || 0),
        sellingPrice: Number(req.body.sellingPrice || 0),
        vatRate: Number(req.body.vatRate || 16),
        stock: Number(req.body.stock || 0),
        lowStockAt: Number(req.body.lowStockAt || 10)
      }
    });
    res.json({ success: true, data: product });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
router.patch('/products/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.buyingPrice) data.buyingPrice = Number(data.buyingPrice);
    if (data.sellingPrice) data.sellingPrice = Number(data.sellingPrice);
    if (data.stock !== undefined) data.stock = Number(data.stock);
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: product });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
router.delete('/products/:id', async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ success: true });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
// ─── STOCK ADJUSTMENTS ────────────────────────────────────────────────────────
router.post('/stock/adjust', async (req, res) => {
  try {
    const { productId, qty, type, notes, cost } = req.body;
    if (!productId || qty === undefined) return res.status(400).json({ success: false, error: 'productId and qty required' });
    const quantity = Number(qty);
    const isIn = ['PURCHASE', 'RETURN_IN', 'ADJUSTMENT_IN', 'OPENING_STOCK'].includes(type);
 
    await prisma.$transaction(async (tx) => {
      if (type === 'OPENING_STOCK') {
        await tx.product.update({ where: { id: productId }, data: { stock: Math.abs(quantity) } });
      } else {
        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: isIn ? Math.abs(quantity) : -Math.abs(quantity) } }
        });
      }
      await tx.stockMovement.create({
        data: { productId, type, qty: quantity, reason: notes || type }
      });
    });
 
    const updated = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true, name: true } });
    res.json({ success: true, message: 'Stock adjusted', newStock: updated.stock, productName: updated.name });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
// ─── STOCK MOVEMENTS ─────────────────────────────────────────────────────────
router.get('/stock/movements', async (req, res) => {
  try {
    const { productId, type, page = 1, limit = 50 } = req.query;
    const where = { product: { tenantId: req.tenantId } };
    if (productId) where.productId = productId;
    if (type) where.type = type;
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { product: { select: { name: true, sku: true, unit: true } } },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.stockMovement.count({ where })
    ]);
    res.json({ success: true, data: movements, total });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
// ─── SUPPLIERS ────────────────────────────────────────────────────────────────
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: suppliers });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.post('/suppliers', async (req, res) => {
  try {
    const count = await prisma.supplier.count({ where: { tenantId: req.tenantId } });
    const supplier = await prisma.supplier.create({
      data: {
        ...req.body,
        tenantId: req.tenantId,
        code: 'SUP-' + String(count + 1).padStart(4, '0')
      }
    });
    res.json({ success: true, data: supplier });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
router.patch('/suppliers/:id', async (req, res) => {
  try {
    const s = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: s });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────
router.get('/purchase-orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = { tenantId: req.tenantId };
    if (status) where.status = status;
    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true, phone: true } },
          items: { include: { product: { select: { name: true, sku: true, unit: true } } } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit)
      }),
      prisma.purchaseOrder.count({ where })
    ]);
    res.json({ success: true, data: orders, total });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.post('/purchase-orders', async (req, res) => {
  try {
    const { supplierId, items, notes, expectedDate } = req.body;
    if (!supplierId || !items?.length) return res.status(400).json({ success: false, error: 'Supplier and items required' });
 
    const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitCost), 0);
    const taxAmount = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitCost) * (Number(i.taxRate || 0) / 100), 0);
    const total = subtotal + taxAmount;
 
    const count = await prisma.purchaseOrder.count({ where: { tenantId: req.tenantId } });
    const poNumber = 'PO-' + String(count + 1).padStart(5, '0');
 
    const order = await prisma.purchaseOrder.create({
      data: {
        tenantId: req.tenantId,
        supplierId,
        poNumber,
        status: 'DRAFT',
        subtotal,
        taxAmount,
        total,
        balance: total,
        amountPaid: 0,
        notes: notes || '',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        orderDate: new Date(),
        items: {
          create: items.map(i => ({
            productId: i.productId,
            productName: i.productName || '',
            qty: Number(i.qty),
            unitCost: Number(i.unitCost),
            taxRate: Number(i.taxRate || 0),
            subtotal: Number(i.qty) * Number(i.unitCost),
            receivedQty: 0
          }))
        }
      },
      include: {
        supplier: true,
        items: { include: { product: { select: { name: true, sku: true } } } }
      }
    });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.patch('/purchase-orders/:id/receive', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } } }
    });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.status === 'RECEIVED') return res.status(400).json({ success: false, error: 'Already received' });
 
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty }, buyingPrice: item.unitCost }
        });
        await tx.stockMovement.create({
          data: { productId: item.productId, type: 'PURCHASE', qty: item.qty, reason: 'PO: ' + order.poNumber }
        });
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: item.qty }
        });
      }
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: 'RECEIVED', deliveredAt: new Date() }
      });
    });
 
    res.json({ success: true, message: 'Stock received for ' + order.poNumber });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
router.patch('/purchase-orders/:id', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json({ success: true, data: order });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
// ─── STOCK VALUATION ─────────────────────────────────────────────────────────
router.get('/reports/valuation', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { name: 'asc' }
    });
    const items = products.map(p => ({
      id: p.id, sku: p.sku, name: p.name, category: p.category,
      unit: p.unit, stock: p.stock || 0,
      buyingPrice: p.buyingPrice, sellingPrice: p.sellingPrice,
      costValue: (p.stock || 0) * p.buyingPrice,
      retailValue: (p.stock || 0) * p.sellingPrice,
      potentialProfit: (p.stock || 0) * (p.sellingPrice - p.buyingPrice),
      margin: p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.buyingPrice) / p.sellingPrice) * 100) : 0
    }));
    const totals = items.reduce((a, i) => ({
      costValue: a.costValue + i.costValue,
      retailValue: a.retailValue + i.retailValue,
      potentialProfit: a.potentialProfit + i.potentialProfit,
      totalUnits: a.totalUnits + i.stock
    }), { costValue: 0, retailValue: 0, potentialProfit: 0, totalUnits: 0 });
 
    res.json({ success: true, data: { items, totals } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const [products, suppliers, pendingPOs, recentMovements] = await Promise.all([
      prisma.product.findMany({ where: { tenantId }, select: { stock: true, buyingPrice: true, lowStockAt: true, name: true, sku: true } }),
      prisma.supplier.count({ where: { tenantId } }),
      prisma.purchaseOrder.count({ where: { tenantId, status: { in: ['DRAFT', 'ORDERED'] } } }),
      prisma.stockMovement.findMany({
        where: { product: { tenantId } },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);
    const totalProducts = products.length;
    const totalStockValue = products.reduce((s, p) => s + (p.stock || 0) * p.buyingPrice, 0);
    const lowStockItems = products.filter(p => (p.stock || 0) <= (p.lowStockAt || 10));
    const outOfStock = products.filter(p => (p.stock || 0) === 0);
 
    res.json({ success: true, data: { totalProducts, totalStockValue, lowStockItems, outOfStockCount: outOfStock.length, suppliers, pendingPOs, recentMovements } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
module.exports = router;
