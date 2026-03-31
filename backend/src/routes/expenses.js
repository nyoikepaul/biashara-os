const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EXPENSE_CATEGORIES = ['Rent','Salaries','Utilities','Transport','Stock Purchase','Marketing','Equipment','Repairs','Insurance','Taxes','Entertainment','Miscellaneous'];

router.get('/categories', (req, res) => res.json({ success: true, data: EXPENSE_CATEGORIES }));

router.get('/', async (req, res) => {
  const { from, to, category, page = 1, limit = 50 } = req.query;
  const where = { tenantId: req.tenant.id };
  if (category) where.category = category;
  if (from && to) where.createdAt = { gte: new Date(from), lte: new Date(to) };
  const [expenses, total, summary] = await Promise.all([
    prisma.expense.findMany({ where, orderBy: { createdAt: 'desc' }, take: parseInt(limit), skip: (parseInt(page)-1)*parseInt(limit) }),
    prisma.expense.count({ where }),
    prisma.expense.groupBy({ by: ['category'], where: { tenantId: req.tenant.id, createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { amount: true }, orderBy: { _sum: { amount: 'desc' } } })
  ]);
  res.json({ success: true, data: expenses, total, categorySummary: summary });
});

router.post('/', async (req, res) => {
  try {
    const exp = await prisma.expense.create({ data: { ...req.body, tenantId: req.tenant.id, amount: Number(req.body.amount) } });
    res.json({ success: true, data: exp });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Monthly P&L
router.get('/reports/pnl', async (req, res) => {
  const { month, year } = req.query;
  const tenantId = req.tenant.id;
  const m = parseInt(month) - 1, y = parseInt(year);
  const start = new Date(y, m, 1), end = new Date(y, m + 1, 0, 23, 59, 59);

  const [salesRevenue, rentRevenue, feeRevenue, totalExpenses, payrollCost, creditCollected] = await Promise.all([
    prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: start, lte: end } }, _sum: { total: true } }),
    prisma.rentPayment.aggregate({ where: { lease: { unit: { property: { tenantId } } }, paidAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.feePayment.aggregate({ where: { student: { tenantId }, paidAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { tenantId, createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.payroll.findFirst({ where: { tenantId, month: parseInt(month), year: parseInt(year) } }),
    prisma.creditPayment.aggregate({ where: { creditSale: { tenantId }, paidAt: { gte: start, lte: end } }, _sum: { amount: true } })
  ]);

  const totalRevenue = (salesRevenue._sum.total||0) + (rentRevenue._sum.amount||0) + (feeRevenue._sum.amount||0);
  const totalCosts = (totalExpenses._sum.amount||0) + (payrollCost?.totalNet||0);
  const grossProfit = totalRevenue - (payrollCost?.totalNet||0);
  const netProfit = totalRevenue - totalCosts;

  res.json({ success: true, data: {
    revenue: { sales: salesRevenue._sum.total||0, rent: rentRevenue._sum.amount||0, fees: feeRevenue._sum.amount||0, credit: creditCollected._sum.amount||0, total: totalRevenue },
    costs: { expenses: totalExpenses._sum.amount||0, payroll: payrollCost?.totalNet||0, total: totalCosts },
    grossProfit, netProfit,
    profitMargin: totalRevenue > 0 ? parseFloat(((netProfit/totalRevenue)*100).toFixed(1)) : 0
  }});
});

// VAT Return summary
router.get('/reports/vat', async (req, res) => {
  const { month, year } = req.query;
  const tenantId = req.tenant.id;
  const m = parseInt(month) - 1, y = parseInt(year);
  const start = new Date(y, m, 1), end = new Date(y, m + 1, 0, 23, 59, 59);
  const sales = await prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: start, lte: end } }, _sum: { vatAmount: true, subtotal: true, total: true } });
  const outputVat = sales._sum.vatAmount || 0;
  res.json({ success: true, data: { period: `${month}/${year}`, taxableSales: sales._sum.subtotal||0, outputVat, vatPayable: outputVat, note: 'Input VAT requires purchase invoice records' } });
});

module.exports = router;
