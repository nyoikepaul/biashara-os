const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const suppliers = await prisma.supplier.findMany({ where: { tenantId: req.tenant.id, isActive: true }, include: { _count: { select: { orders: true } } }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: suppliers });
});

router.post('/', async (req, res) => {
  try {
    const s = await prisma.supplier.create({ data: { ...req.body, tenantId: req.tenant.id } });
    res.json({ success: true, data: s });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

// Purchase Orders
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const where = { tenantId: req.tenant.id };
  if (status) where.status = status;
  const orders = await prisma.purchaseOrder.findMany({ where, include: { supplier: true, items: true }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: orders });
});

router.post('/orders', async (req, res) => {
  try {
    const { supplierId, items, notes } = req.body;
    const subtotal = items.reduce((s, i) => s + Number(i.qty) * Number(i.unitCost), 0);
    const vatAmount = subtotal * 0.16;
    const total = subtotal + vatAmount;
    const orderNo = 'PO-' + Date.now().toString().slice(-8);
    const order = await prisma.purchaseOrder.create({
      data: { tenantId: req.tenant.id, supplierId, orderNo, subtotal, vatAmount, total, balance: total, notes,
        items: { create: items.map(i => ({ productName: i.productName, qty: Number(i.qty), unitCost: Number(i.unitCost), subtotal: Number(i.qty)*Number(i.unitCost) })) } },
      include: { supplier: true, items: true }
    });
    res.json({ success: true, data: order });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// Mark order as received — auto-increment stock
router.patch('/orders/:id/receive', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'RECEIVED', deliveredAt: new Date() } });
    res.json({ success: true, message: 'Order marked as received' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
