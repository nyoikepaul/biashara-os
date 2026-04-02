const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { stkPush } = require('../integrations/mpesa/mpesa');
const { sendSMS } = require('../integrations/africastalking/notifications');
const prisma = new PrismaClient();

// GET all customers
router.get('/', async (req, res) => {
  const { search } = req.query;
  const where = { tenantId: req.tenant.id, isActive: true };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  const customers = await prisma.customer.findMany({ where, orderBy: { name: 'asc' },
    include: { _count: { select: { creditSales: true } } } });
  res.json({ success: true, data: customers });
});

// POST create customer
router.post('/', async (req, res) => {
  try {
    const c = await prisma.customer.create({ data: { ...req.body, tenantId: req.tenant.id } });
    res.json({ success: true, data: c });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Phone already registered' });
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET customer statement
router.get('/:id/statement', async (req, res) => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      creditSales: {
        include: { payments: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
  const totalOwed = customer.creditSales.filter(c => c.status !== 'PAID').reduce((s, c) => s + c.balance, 0);
  res.json({ success: true, data: { customer, totalOwed } });
});

// ── CREDIT SALES (Mkopo) ──────────────────────────────────────────────────────

// GET all credit sales
router.get('/credit/all', async (req, res) => {
  const { status } = req.query;
  const where = { tenantId: req.tenant.id };
  if (status) where.status = status;
  const credits = await prisma.creditSale.findMany({
    where, include: { customer: true, payments: true },
    orderBy: { createdAt: 'desc' }
  });
  const totalOutstanding = credits.filter(c => c.status !== 'PAID').reduce((s, c) => s + c.balance, 0);
  res.json({ success: true, data: credits, totalOutstanding });
});

// POST create credit sale
router.post('/credit', async (req, res) => {
  try {
    const { customerId, amount, dueDate, notes, saleId } = req.body;
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    if (customer.creditBalance + amount > customer.creditLimit && customer.creditLimit > 0) {
      return res.status(400).json({ success: false, error: `Credit limit exceeded. Available: KES ${(customer.creditLimit - customer.creditBalance).toLocaleString()}` });
    }
    const credit = await prisma.$transaction(async (tx) => {
      const c = await tx.creditSale.create({
        data: { tenantId: req.tenant.id, customerId, saleId, amount: Number(amount), balance: Number(amount), dueDate: dueDate ? new Date(dueDate) : null, notes }
      });
      await tx.customer.update({ where: { id: customerId }, data: { creditBalance: { increment: Number(amount) } } });
      return c;
    });
    // SMS notification
    await sendSMS({ tenantId: req.tenant.id, to: customer.phone,
      message: `Dear ${customer.name}, mkopo wa KES ${Number(amount).toLocaleString()} umerekodiwa. Lipa kabla ya ${dueDate ? new Date(dueDate).toLocaleDateString('en-KE') : 'haraka iwezekanavyo'}. BiasharaOS`,
      module: 'credit' }).catch(() => {});
    res.json({ success: true, data: credit });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST record credit payment
router.post('/credit/:id/pay', async (req, res) => {
  try {
    const { amount, mpesaRef } = req.body;
    const credit = await prisma.creditSale.findUnique({ where: { id: req.params.id }, include: { customer: true } });
    if (!credit) return res.status(404).json({ success: false, error: 'Credit sale not found' });
    const paid = Number(amount);
    const newBalance = Math.max(0, credit.balance - paid);
    const newAmountPaid = credit.amountPaid + paid;
    const status = newBalance === 0 ? 'PAID' : newAmountPaid > 0 ? 'PARTIAL' : 'PENDING';
    const [updatedCredit] = await prisma.$transaction([
      prisma.creditSale.update({ where: { id: req.params.id }, data: { amountPaid: newAmountPaid, balance: newBalance, status } }),
      prisma.creditPayment.create({ data: { creditSaleId: req.params.id, amount: paid, mpesaRef } }),
      prisma.customer.update({ where: { id: credit.customerId }, data: { creditBalance: { decrement: paid } } })
    ]);
    await sendSMS({ tenantId: req.tenant.id, to: credit.customer.phone,
      message: `Dear ${credit.customer.name}, malipo ya KES ${paid.toLocaleString()} yamepokelewa. Mkopo uliobaki: KES ${newBalance.toLocaleString()}. Asante! BiasharaOS`,
      module: 'credit' }).catch(() => {});
    res.json({ success: true, data: updatedCredit });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST STK push for credit payment
router.post('/credit/:id/stk', async (req, res) => {
  const credit = await prisma.creditSale.findUnique({ where: { id: req.params.id }, include: { customer: true } });
  if (!req.tenant.mpesaShortcode) return res.status(400).json({ success: false, error: 'M-Pesa not configured' });
  const result = await stkPush({ phone: credit.customer.phone, amount: credit.balance, accountRef: 'MKOPO-' + credit.customer.name.slice(0,8).toUpperCase().replace(/ /g,''), description: 'Credit Payment', shortcode: req.tenant.mpesaShortcode, passkey: req.tenant.mpesaPasskey });
  res.json({ success: result.success, data: result });
});

// GET credit summary
router.get('/credit/summary', async (req, res) => {
  const tenantId = req.tenant.id;
  const [total, overdue, thisMonth] = await Promise.all([
    prisma.creditSale.aggregate({ where: { tenantId, status: { in: ['PENDING','PARTIAL','OVERDUE'] } }, _sum: { balance: true }, _count: true }),
    prisma.creditSale.aggregate({ where: { tenantId, status: { in: ['PENDING','PARTIAL'] }, dueDate: { lt: new Date() } }, _sum: { balance: true }, _count: true }),
    prisma.creditPayment.aggregate({ where: { creditSale: { tenantId }, paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }, _sum: { amount: true } })
  ]);
  res.json({ success: true, data: { totalOutstanding: total._sum.balance || 0, totalDebtors: total._count, overdueAmount: overdue._sum.balance || 0, overdueCount: overdue._count, collectedThisMonth: thisMonth._sum.amount || 0 } });
});


router.get('/reports/sales', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const tenantId = req.tenantId;
    const since = new Date(Date.now() - parseInt(days) * 86400000);
 
    const [daily, topProducts, byPaymentMethod] = await Promise.all([
      prisma.$queryRaw`
        SELECT DATE("createdAt") as date,
               COUNT(*)::int as orders,
               COALESCE(SUM(total), 0)::float as revenue
        FROM "Sale"
        WHERE "tenantId" = ${tenantId}
          AND "createdAt" >= ${since}
          AND status = 'COMPLETED'
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT p.name, p.sku,
               COALESCE(SUM(si.qty), 0)::int as qty_sold,
               COALESCE(SUM(si.subtotal), 0)::float as revenue
        FROM "SaleItem" si
        JOIN "Product" p ON p.id = si."productId"
        JOIN "Sale" s ON s.id = si."saleId"
        WHERE s."tenantId" = ${tenantId}
          AND s."createdAt" >= ${since}
          AND s.status = 'COMPLETED'
        GROUP BY p.id, p.name, p.sku
        ORDER BY revenue DESC
        LIMIT 10
      `,
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: { tenantId, createdAt: { gte: since }, status: 'COMPLETED' },
        _sum: { total: true },
        _count: true
      })
    ]);
 
    res.json({ success: true, data: { daily, topProducts, byPaymentMethod } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
