const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
router.get('/', async (req, res) => {
  const tenantId = req.tenant.id;
  const now = new Date(), monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [sales, rent, fees, sms, payroll] = await Promise.all([
    prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: monthStart } }, _sum: { total: true }, _count: true }),
    prisma.rentPayment.aggregate({ where: { lease: { unit: { property: { tenantId } } }, year: now.getFullYear(), month: now.getMonth()+1 }, _sum: { amount: true }, _count: true }),
    prisma.feePayment.aggregate({ where: { student: { tenantId }, year: now.getFullYear() }, _sum: { amount: true }, _count: true }),
    prisma.smsLog.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
    prisma.payroll.findFirst({ where: { tenantId, month: now.getMonth()+1, year: now.getFullYear() } })
  ]);
  const total = (sales._sum.total||0) + (rent._sum.amount||0) + (fees._sum.amount||0);
  res.json({ success: true, data: { revenue: { total, sales: sales._sum.total||0, rent: rent._sum.amount||0, fees: fees._sum.amount||0 }, transactions: { sales: sales._count, rent: rent._count, fees: fees._count }, payroll: payroll ? { status: payroll.status, netTotal: payroll.totalNet } : null, smsThisMonth: sms } });
});
module.exports = router;
