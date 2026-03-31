const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Stock Valuation
router.get('/stock-valuation', async (req, res) => {
  const tenantId = req.tenant.id;
  const products = await prisma.product.findMany({ where: { tenantId, isActive: true } });
  const items = products.map(p => ({
    name: p.name, sku: p.sku, category: p.category,
    stock: p.stock, buyingPrice: p.buyingPrice, sellingPrice: p.sellingPrice,
    costValue: p.stock * p.buyingPrice,
    retailValue: p.stock * p.sellingPrice,
    potentialProfit: p.stock * (p.sellingPrice - p.buyingPrice)
  }));
  const totals = items.reduce((a, i) => ({ costValue: a.costValue+i.costValue, retailValue: a.retailValue+i.retailValue, potentialProfit: a.potentialProfit+i.potentialProfit }), { costValue:0, retailValue:0, potentialProfit:0 });
  res.json({ success: true, data: { items, totals, productCount: items.length } });
});

// Sales Analytics
router.get('/sales-analytics', async (req, res) => {
  const { days = 30 } = req.query;
  const tenantId = req.tenant.id;
  const since = new Date(Date.now() - parseInt(days) * 86400000);

  const [dailySales, topProducts, paymentMix, hourlyPattern] = await Promise.all([
    prisma.$queryRaw`SELECT DATE("createdAt") as date, COUNT(*) as transactions, SUM(total) as revenue FROM "Sale" WHERE "tenantId"=${tenantId} AND "createdAt">=${since} GROUP BY DATE("createdAt") ORDER BY date`,
    prisma.$queryRaw`SELECT p.name, p.category, SUM(si.qty) as qty_sold, SUM(si.subtotal) as revenue FROM "SaleItem" si JOIN "Product" p ON p.id=si."productId" JOIN "Sale" s ON s.id=si."saleId" WHERE s."tenantId"=${tenantId} AND s."createdAt">=${since} GROUP BY p.id,p.name,p.category ORDER BY revenue DESC LIMIT 10`,
    prisma.sale.groupBy({ by: ['paymentMethod'], where: { tenantId, createdAt: { gte: since } }, _sum: { total: true }, _count: true }),
    prisma.$queryRaw`SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as transactions, SUM(total) as revenue FROM "Sale" WHERE "tenantId"=${tenantId} AND "createdAt">=${since} GROUP BY hour ORDER BY hour`
  ]);

  res.json({ success: true, data: { dailySales, topProducts, paymentMix, hourlyPattern } });
});

// Attendance summary
router.get('/attendance', async (req, res) => {
  const { month, year } = req.query;
  const tenantId = req.tenant.id;
  const m = parseInt(month)-1, y = parseInt(year);
  const start = new Date(y, m, 1), end = new Date(y, m+1, 0);
  const records = await prisma.attendance.findMany({
    where: { tenantId, date: { gte: start, lte: end } },
    include: { employee: true },
    orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }]
  });
  res.json({ success: true, data: records });
});

// POST clock in/out
router.post('/attendance/clock', async (req, res) => {
  try {
    const { employeeId, action } = req.body;
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } });
    if (action === 'in') {
      const record = existing
        ? await prisma.attendance.update({ where: { id: existing.id }, data: { clockIn: new Date(), status: 'PRESENT' } })
        : await prisma.attendance.create({ data: { tenantId: req.tenant.id, employeeId, date: today, clockIn: new Date(), status: 'PRESENT' } });
      res.json({ success: true, data: record });
    } else {
      if (!existing) return res.status(400).json({ success: false, error: 'No clock-in record found' });
      const record = await prisma.attendance.update({ where: { id: existing.id }, data: { clockOut: new Date() } });
      res.json({ success: true, data: record });
    }
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
