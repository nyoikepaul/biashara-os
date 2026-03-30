const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { stkPush } = require('../integrations/mpesa/mpesa');
const { sendSMS, sendWhatsApp, templates } = require('../integrations/africastalking/notifications');
const prisma = new PrismaClient();

router.get('/students', async (req, res) => {
  const { search } = req.query;
  const where = { tenantId: req.tenant.id, isActive: true };
  if (search) where.name = { contains: search, mode: 'insensitive' };
  const students = await prisma.student.findMany({ where, orderBy: { name: 'asc' } });
  res.json({ success: true, data: students });
});

router.post('/students', async (req, res) => {
  try {
    const s = await prisma.student.create({ data: { ...req.body, tenantId: req.tenant.id, dob: new Date(req.body.dob), year: Number(req.body.year||new Date().getFullYear()) } });
    await sendSMS({ tenantId: req.tenant.id, to: s.guardianPhone, message: `Dear ${s.guardianName}, ${s.name} (Adm: ${s.admNo}) registered at ${req.tenant.name}. BiasharaOS`, module: 'school' }).catch(()=>{});
    res.json({ success: true, data: s });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

router.get('/fee-structure', async (req, res) => {
  const structures = await prisma.feeStructure.findMany({ where: { tenantId: req.tenant.id }, orderBy: [{ year: 'desc' }, { term: 'asc' }] });
  res.json({ success: true, data: structures });
});

router.post('/fee-structure', async (req, res) => {
  const { class: cls, term, year, tuition, lunch=0, activity=0, boarding=0 } = req.body;
  const total = Number(tuition)+Number(lunch)+Number(activity)+Number(boarding);
  const s = await prisma.feeStructure.create({ data: { tenantId: req.tenant.id, class: cls, term: Number(term), year: Number(year), tuition: Number(tuition), lunch: Number(lunch), activity: Number(activity), boarding: Number(boarding), total } });
  res.json({ success: true, data: s });
});

router.post('/payments', async (req, res) => {
  try {
    const { studentId, term, year, amount, mpesaRef } = req.body;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    const feeStr = await prisma.feeStructure.findFirst({ where: { tenantId: req.tenant.id, class: student.class, term: Number(term), year: Number(year) } });
    const prev = await prisma.feePayment.aggregate({ where: { studentId, term: Number(term), year: Number(year) }, _sum: { amount: true } });
    const totalPaid = (prev._sum.amount||0) + Number(amount);
    const balance = Math.max(0, (feeStr?.total||0) - totalPaid);
    const receiptNo = 'FEE-' + student.admNo + '-' + term + year + '-' + Date.now().toString().slice(-5);
    const payment = await prisma.feePayment.create({ data: { studentId, term: Number(term), year: Number(year), amount: Number(amount), mpesaRef, receiptNo, balance } });
    await sendSMS({ tenantId: req.tenant.id, to: student.guardianPhone, message: templates.feeReceipt(student.guardianName.split(' ')[0], student.name.split(' ')[0], amount, mpesaRef||receiptNo, balance), module: 'school' }).catch(()=>{});
    res.json({ success: true, data: { payment, balance, receiptNo } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/request-payment', async (req, res) => {
  try {
    const { studentId, term, year, amount } = req.body;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!req.tenant.mpesaShortcode) return res.status(400).json({ success: false, error: 'M-Pesa not configured' });
    const result = await stkPush({ phone: student.guardianPhone, amount: Number(amount), accountRef: student.admNo, description: 'Fees Term '+term+'/'+year, shortcode: req.tenant.mpesaShortcode, passkey: req.tenant.mpesaPasskey });
    res.json({ success: result.success, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/reports/collection', async (req, res) => {
  const { term, year } = req.query; const tenantId = req.tenant.id;
  const t = parseInt(term), y = parseInt(year);
  const [defaulters, summary] = await Promise.all([
    prisma.$queryRaw`SELECT s.name, s."admNo", s."guardianPhone", s.class, COALESCE(SUM(fp.amount),0) as paid, fs.total as expected, (fs.total-COALESCE(SUM(fp.amount),0)) as balance FROM "Student" s JOIN "FeeStructure" fs ON fs.class=s.class AND fs.term=${t} AND fs.year=${y} AND fs."tenantId"=${tenantId} LEFT JOIN "FeePayment" fp ON fp."studentId"=s.id AND fp.term=${t} AND fp.year=${y} WHERE s."tenantId"=${tenantId} AND s."isActive"=true GROUP BY s.id,s.name,s."admNo",s."guardianPhone",s.class,fs.total HAVING (fs.total-COALESCE(SUM(fp.amount),0))>0 ORDER BY balance DESC`,
    prisma.$queryRaw`SELECT COUNT(DISTINCT s.id) as students, COALESCE(SUM(fp.amount),0) as collected, COALESCE(SUM(fs.total),0) as expected FROM "Student" s JOIN "FeeStructure" fs ON fs.class=s.class AND fs.term=${t} AND fs.year=${y} AND fs."tenantId"=${tenantId} LEFT JOIN "FeePayment" fp ON fp."studentId"=s.id AND fp.term=${t} AND fp.year=${y} WHERE s."tenantId"=${tenantId} AND s."isActive"=true`
  ]);
  res.json({ success: true, data: { summary: summary[0], defaulters } });
});

router.post('/notify-defaulters', async (req, res) => {
  const { term, year } = req.body; const tenantId = req.tenant.id;
  const t = parseInt(term), y = parseInt(year);
  const defaulters = await prisma.$queryRaw`SELECT s.name, s."guardianPhone", s."guardianName", (fs.total-COALESCE(SUM(fp.amount),0)) as balance FROM "Student" s JOIN "FeeStructure" fs ON fs.class=s.class AND fs.term=${t} AND fs.year=${y} AND fs."tenantId"=${tenantId} LEFT JOIN "FeePayment" fp ON fp."studentId"=s.id AND fp.term=${t} AND fp.year=${y} WHERE s."tenantId"=${tenantId} AND s."isActive"=true GROUP BY s.id,s.name,s."guardianPhone",s."guardianName",fs.total HAVING (fs.total-COALESCE(SUM(fp.amount),0))>0`;
  let sent = 0;
  for (const d of defaulters) { await sendSMS({ tenantId, to: d.guardianPhone, message: templates.feeBalance(d.guardianName.split(' ')[0], d.name.split(' ')[0], Number(d.balance), term, year), module: 'school' }).catch(()=>{}); sent++; }
  res.json({ success: true, data: { notified: sent } });
});

module.exports = router;
