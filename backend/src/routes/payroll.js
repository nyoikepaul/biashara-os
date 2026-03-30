const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { calculatePayslip, generateP9 } = require('../modules/payroll/payrollEngine');
const { b2cPayment } = require('../integrations/mpesa/mpesa');
const { sendSMS, templates } = require('../integrations/africastalking/notifications');
const prisma = new PrismaClient();

router.get('/employees', async (req, res) => {
  const employees = await prisma.employee.findMany({ where: { tenantId: req.tenant.id, isActive: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, data: employees });
});

router.post('/employees', async (req, res) => {
  try {
    const emp = await prisma.employee.create({ data: { ...req.body, tenantId: req.tenant.id, basicSalary: Number(req.body.basicSalary), joinDate: new Date(req.body.joinDate || new Date()) } });
    res.json({ success: true, data: emp });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

router.post('/run', async (req, res) => {
  try {
    const { month, year } = req.body;
    const tenantId = req.tenant.id;
    const employees = await prisma.employee.findMany({ where: { tenantId, isActive: true } });
    if (employees.length === 0) return res.status(400).json({ success: false, error: 'No active employees' });
    const payslipData = employees.map(emp => ({ employee: emp, calc: calculatePayslip({ basicSalary: emp.basicSalary, allowances: emp.allowances || {} }) }));
    const totals = payslipData.reduce((a, { calc }) => ({ totalGross: a.totalGross+calc.grossSalary, totalPaye: a.totalPaye+calc.paye, totalNhif: a.totalNhif+calc.nhif, totalNssf: a.totalNssf+calc.nssf, totalNet: a.totalNet+calc.netSalary }), { totalGross:0, totalPaye:0, totalNhif:0, totalNssf:0, totalNet:0 });
    const payroll = await prisma.payroll.upsert({ where: { tenantId_month_year: { tenantId, month, year } }, create: { tenantId, month, year, ...totals, status: 'DRAFT' }, update: { ...totals, status: 'DRAFT' } });
    await prisma.payslip.deleteMany({ where: { payrollId: payroll.id } });
    await prisma.payslip.createMany({ data: payslipData.map(({ employee, calc }) => ({ payrollId: payroll.id, employeeId: employee.id, basicSalary: calc.basicSalary, allowances: calc.allowances, grossSalary: calc.grossSalary, paye: calc.paye, nhif: calc.nhif, nssf: calc.nssf, otherDeductions: 0, netSalary: calc.netSalary })) });
    res.json({ success: true, data: { payroll, employeeCount: employees.length, totals, summary: payslipData.map(({ employee, calc }) => ({ name: employee.name, gross: calc.grossSalary, paye: calc.paye, net: calc.netSalary })) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/disburse', async (req, res) => {
  try {
    const { payrollId } = req.body;
    const payroll = await prisma.payroll.findUnique({ where: { id: payrollId }, include: { payslips: { include: { employee: true } } } });
    if (!payroll) return res.status(404).json({ success: false, error: 'Payroll not found' });
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const results = [];
    for (const payslip of payroll.payslips) {
      const phone = payslip.employee.mpesaPhone || payslip.employee.phone;
      if (!phone) { results.push({ employee: payslip.employee.name, status: 'skipped' }); continue; }
      const mpesa = await b2cPayment({ phone, amount: payslip.netSalary, remarks: `Salary ${months[payroll.month-1]} ${payroll.year}` });
      if (mpesa.success) {
        await prisma.payslip.update({ where: { id: payslip.id }, data: { mpesaRef: mpesa.conversationId } });
        await sendSMS({ tenantId: payroll.tenantId, to: phone, message: templates.payslip(payslip.employee.name.split(' ')[0], payslip.netSalary, months[payroll.month-1], payroll.year, mpesa.conversationId||'B2C'), module: 'payroll' }).catch(()=>{});
      }
      results.push({ employee: payslip.employee.name, status: mpesa.success ? 'sent' : 'failed' });
    }
    await prisma.payroll.update({ where: { id: payrollId }, data: { status: 'PAID', processedAt: new Date() } });
    res.json({ success: true, data: { results, totalDisbursed: payroll.totalNet } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get('/:id/p9/:employeeId', async (req, res) => {
  const payslips = await prisma.payslip.findMany({ where: { payroll: { tenantId: req.tenant.id }, employeeId: req.params.employeeId } });
  const employee = await prisma.employee.findUnique({ where: { id: req.params.employeeId } });
  res.json({ success: true, data: generateP9(payslips, employee) });
});

module.exports = router;
