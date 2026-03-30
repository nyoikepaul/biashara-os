const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { stkPush } = require('../integrations/mpesa/mpesa');
const { sendSMS, sendWhatsApp, templates } = require('../integrations/africastalking/notifications');
const prisma = new PrismaClient();

router.get('/properties', async (req, res) => {
  const props = await prisma.property.findMany({ where: { tenantId: req.tenant.id }, include: { units: { include: { leases: { where: { status: 'ACTIVE' }, take: 1 } } } } });
  res.json({ success: true, data: props });
});
router.post('/properties', async (req, res) => {
  const p = await prisma.property.create({ data: { ...req.body, tenantId: req.tenant.id } });
  res.json({ success: true, data: p });
});
router.post('/properties/:propertyId/units', async (req, res) => {
  const u = await prisma.unit.create({ data: { ...req.body, propertyId: req.params.propertyId, rentAmount: Number(req.body.rentAmount), depositAmount: Number(req.body.depositAmount||0) } });
  res.json({ success: true, data: u });
});

router.post('/leases', async (req, res) => {
  try {
    const { unitId, tenantName, tenantPhone, tenantIdNo, startDate, rentAmount, depositPaid } = req.body;
    const lease = await prisma.$transaction(async (tx) => {
      const l = await tx.lease.create({ data: { unitId, tenantName, tenantPhone, tenantIdNo, startDate: new Date(startDate), rentAmount: Number(rentAmount), depositPaid: Number(depositPaid||0) } });
      await tx.unit.update({ where: { id: unitId }, data: { isOccupied: true } });
      return l;
    });
    await sendSMS({ tenantId: req.tenant.id, to: tenantPhone, message: `Dear ${tenantName}, welcome! Rent: KES ${Number(rentAmount).toLocaleString()}/month. Pay via M-Pesa: ${process.env.MPESA_SHORTCODE||'N/A'}. ${req.tenant.name}`, module: 'rent' }).catch(()=>{});
    res.json({ success: true, data: lease });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

router.post('/payments', async (req, res) => {
  try {
    const { leaseId, amount, mpesaRef, month, year } = req.body;
    const lease = await prisma.lease.findUnique({ where: { id: leaseId }, include: { unit: { include: { property: true } } } });
    if (!lease) return res.status(404).json({ success: false, error: 'Lease not found' });
    const isLate = new Date() > new Date(year, month-1, 5);
    const payment = await prisma.rentPayment.create({ data: { leaseId, amount: Number(amount), mpesaRef, month: Number(month), year: Number(year), isLate } });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    await sendSMS({ tenantId: req.tenant.id, to: lease.tenantPhone, message: templates.rentReceipt(lease.tenantName.split(' ')[0], amount, months[month-1]+' '+year, mpesaRef||'MANUAL'), module: 'rent' }).catch(()=>{});
    res.json({ success: true, data: payment });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/request-payment', async (req, res) => {
  try {
    const { leaseId, month, year } = req.body;
    const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
    if (!req.tenant.mpesaShortcode) return res.status(400).json({ success: false, error: 'M-Pesa shortcode not configured on your account' });
    const result = await stkPush({ phone: lease.tenantPhone, amount: lease.rentAmount, accountRef: 'RENT-'+lease.tenantName.replace(/ /g,'').slice(0,8).toUpperCase(), description: 'Rent '+month+'/'+year, shortcode: req.tenant.mpesaShortcode, passkey: req.tenant.mpesaPasskey });
    res.json({ success: result.success, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/reports/occupancy', async (req, res) => {
  const tenantId = req.tenant.id; const now = new Date();
  const properties = await prisma.property.findMany({ where: { tenantId }, include: { units: { include: { leases: { where: { status: 'ACTIVE' }, include: { payments: { where: { month: now.getMonth()+1, year: now.getFullYear() } } } } } } } });
  const stats = properties.reduce((a, p) => { a.total += p.units.length; a.occupied += p.units.filter(u => u.isOccupied).length; p.units.forEach(u => { const l = u.leases[0]; if (l) { a.expectedRevenue += l.rentAmount; a.collectedRevenue += l.payments.reduce((s, p) => s+p.amount, 0); } }); return a; }, { total:0, occupied:0, expectedRevenue:0, collectedRevenue:0 });
  const defaulters = await prisma.$queryRaw`SELECT l."tenantName", l."tenantPhone", u."unitNo", p.name as property_name, l."rentAmount", COALESCE(SUM(rp.amount),0) as paid FROM "Lease" l JOIN "Unit" u ON u.id=l."unitId" JOIN "Property" p ON p.id=u."propertyId" LEFT JOIN "RentPayment" rp ON rp."leaseId"=l.id AND rp.month=${now.getMonth()+1} AND rp.year=${now.getFullYear()} WHERE p."tenantId"=${tenantId} AND l.status='ACTIVE' GROUP BY l.id,l."tenantName",l."tenantPhone",u."unitNo",p.name,l."rentAmount" HAVING COALESCE(SUM(rp.amount),0) < l."rentAmount"`;
  res.json({ success: true, data: { ...stats, occupancyRate: stats.total>0 ? Math.round(stats.occupied/stats.total*100) : 0, collectionRate: stats.expectedRevenue>0 ? Math.round(stats.collectedRevenue/stats.expectedRevenue*100) : 0, defaulters } });
});

module.exports = router;
