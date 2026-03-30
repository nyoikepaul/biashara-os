const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { sendSMS, templates } = require('../integrations/africastalking/notifications');
const prisma = new PrismaClient();
router.get('/', async (req, res) => {
  const invoices = await prisma.invoice.findMany({ where: { tenantId: req.tenant.id }, orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: invoices });
});
router.post('/', async (req, res) => {
  try {
    const { clientName, clientEmail, clientPhone, items, dueDate } = req.body;
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const vat = subtotal * 0.16, total = subtotal + vat;
    const invoiceNo = 'INV-' + Date.now().toString().slice(-8);
    const invoice = await prisma.invoice.create({ data: { tenantId: req.tenant.id, invoiceNo, clientName, clientEmail, clientPhone, items, subtotal, vat, total, dueDate: new Date(dueDate) } });
    if (clientPhone) await sendSMS({ tenantId: req.tenant.id, to: clientPhone, message: templates.invoiceDue(clientName, invoiceNo, total, new Date(dueDate).toLocaleDateString('en-KE')), module: 'invoice' }).catch(()=>{});
    res.json({ success: true, data: invoice });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
router.patch('/:id/mark-paid', async (req, res) => {
  const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'PAID' } });
  res.json({ success: true, data: invoice });
});
module.exports = router;
