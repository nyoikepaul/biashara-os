const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { stkPush } = require('../integrations/mpesa/mpesa');
const { submitInvoice } = require('../integrations/etims/etims');
const { sendSMS, templates } = require('../integrations/africastalking/notifications');
const prisma = new PrismaClient();

router.get('/products', async (req, res) => {
  const { search, category } = req.query;
  const where = { tenantId: req.tenant.id, isActive: true };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  if (category) where.category = category;
  const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' } });
  res.json({ success: true, data: products });
});

router.post('/products', async (req, res) => {
  try {
    const p = await prisma.product.create({ data: { ...req.body, tenantId: req.tenant.id, buyingPrice: Number(req.body.buyingPrice), sellingPrice: Number(req.body.sellingPrice), stock: Number(req.body.stock) } });
    res.json({ success: true, data: p });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

router.post('/sales', async (req, res) => {
  try {
    const { items, customerPhone, customerName, paymentMethod, discount = 0 } = req.body;
    const tenant = req.tenant;
    const products = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) }, tenantId: tenant.id } });
    const productMap = Object.fromEntries(products.map(p => [p.id, p]));
    for (const item of items) {
      if (!productMap[item.productId]) return res.status(400).json({ success: false, error: 'Product not found' });
      if (productMap[item.productId].stock < item.qty) return res.status(400).json({ success: false, error: 'Insufficient stock for ' + productMap[item.productId].name });
    }
    const saleItems = items.map(i => ({ ...i, unitPrice: productMap[i.productId].sellingPrice, vatRate: productMap[i.productId].vatRate, subtotal: productMap[i.productId].sellingPrice * i.qty }));
    const subtotal = saleItems.reduce((s, i) => s + i.subtotal, 0);
    const vatAmount = saleItems.reduce((s, i) => s + (i.subtotal * i.vatRate / (100 + i.vatRate)), 0);
    const total = subtotal - Number(discount);
    const receiptNo = 'RCP-' + Date.now().toString().slice(-8);
    const sale = await prisma.$transaction(async (tx) => {
      const s = await tx.sale.create({ data: { tenantId: tenant.id, receiptNo, customerPhone, customerName, subtotal, vatAmount, discount: Number(discount), total, paymentMethod, items: { create: saleItems.map(i => ({ productId: i.productId, qty: i.qty, unitPrice: i.unitPrice, vatRate: i.vatRate, subtotal: i.subtotal })) } }, include: { items: true } });
      for (const item of saleItems) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.qty } } });
        await tx.stockMovement.create({ data: { productId: item.productId, type: 'SALE', qty: -item.qty, reason: 'Sale ' + receiptNo } });
      }
      return s;
    });
    let qrCode = null;
    if (tenant.kraPin) {
      const etims = await submitInvoice({ tenant, sale: { ...sale, paymentMethod }, items: saleItems.map(i => ({ ...i, name: productMap[i.productId].name, sku: productMap[i.productId].sku })) });
      qrCode = etims.qrCode;
      if (etims.success) await prisma.sale.update({ where: { id: sale.id }, data: { etimsInvoiceNo: etims.invoiceNo, etimsQrCode: etims.qrCode } });
    }
    if (customerPhone) await sendSMS({ tenantId: tenant.id, to: customerPhone, message: templates.saleReceipt(customerName||'Customer', total, receiptNo, saleItems.length), module: 'retail' }).catch(()=>{});
    res.json({ success: true, data: { sale, receiptNo, qrCode } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, error: err.message }); }
});

router.get('/sales', async (req, res) => {
  const { from, to, page = 1, limit = 50 } = req.query;
  const where = { tenantId: req.tenant.id };
  if (from && to) where.createdAt = { gte: new Date(from), lte: new Date(to) };
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({ where, include: { items: { include: { product: true } } }, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page)-1)*parseInt(limit) }),
    prisma.sale.count({ where })
  ]);
  res.json({ success: true, data: sales, total });
});

router.get('/reports/summary', async (req, res) => {
  const tenantId = req.tenant.id;
  const today = new Date(); today.setHours(0,0,0,0);
  const [todaySales, monthSales] = await Promise.all([
    prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } }, _sum: { total: true }, _count: true })
  ]);
  const lowStock = await prisma.$queryRaw`SELECT name, sku, stock, "lowStockAt" FROM "Product" WHERE "tenantId"=${tenantId} AND stock <= "lowStockAt" AND "isActive"=true`;
  res.json({ success: true, data: { today: { revenue: todaySales._sum.total||0, transactions: todaySales._count }, month: { revenue: monthSales._sum.total||0, transactions: monthSales._count }, lowStock } });
});

module.exports = router;
