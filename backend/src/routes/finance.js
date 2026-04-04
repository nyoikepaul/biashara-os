const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
// ─── CHART OF ACCOUNTS ───────────────────────────────────────────────────────
router.get('/accounts', async (req,res) => {
  try {
    const accounts = await prisma.account.findMany({ where:{tenantId:req.tenantId,isActive:true}, orderBy:{code:'asc'} });
    res.json({ success:true, data:accounts });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/accounts', async (req,res) => {
  try {
    const a = await prisma.account.create({ data:{...req.body, tenantId:req.tenantId, balance:Number(req.body.balance||0)} });
    res.json({ success:true, data:a });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── EXPENSES ─────────────────────────────────────────────────────────────────
router.get('/expenses', async (req,res) => {
  try {
    const {from, to, category, page=1, limit=50} = req.query;
    const where = { tenantId:req.tenantId };
    if (category) where.category = category;
    if (from&&to) where.createdAt = { gte:new Date(from), lte:new Date(to) };
    const [expenses, total, summary] = await Promise.all([
      prisma.expense.findMany({ where, orderBy:{createdAt:'desc'}, take:parseInt(limit), skip:(parseInt(page)-1)*parseInt(limit) }),
      prisma.expense.count({ where }),
      prisma.expense.groupBy({ by:['category'], where:{tenantId:req.tenantId}, _sum:{amount:true}, _count:true, orderBy:{_sum:{amount:'desc'}} })
    ]);
    res.json({ success:true, data:expenses, total, summary });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/expenses', async (req,res) => {
  try {
    const exp = await prisma.expense.create({ data:{...req.body, tenantId:req.tenantId, amount:Number(req.body.amount)} });
    res.json({ success:true, data:exp });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
router.patch('/expenses/:id', async (req,res) => {
  try {
    const e = await prisma.expense.update({ where:{id:req.params.id}, data:req.body });
    res.json({ success:true, data:e });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
router.delete('/expenses/:id', async (req,res) => {
  try {
    await prisma.expense.delete({ where:{id:req.params.id} });
    res.json({ success:true });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── P&L REPORT ───────────────────────────────────────────────────────────────
router.get('/reports/pnl', async (req,res) => {
  try {
    const {month, year} = req.query;
    const m = parseInt(month)-1, y = parseInt(year);
    const start = new Date(y,m,1), end = new Date(y,m+1,0,23,59,59);
    const tenantId = req.tenantId;
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 
    const [sales, expenses, payroll, rentPayments, feePayments] = await Promise.all([
      prisma.sale.aggregate({ where:{tenantId,createdAt:{gte:start,lte:end},status:'COMPLETED'}, _sum:{total:true,vatAmount:true}, _count:true }),
      prisma.expense.groupBy({ by:['category'], where:{tenantId,createdAt:{gte:start,lte:end}}, _sum:{amount:true}, _count:true }),
      prisma.payroll.findFirst({ where:{tenantId,month:parseInt(month),year:parseInt(year)} }),
      prisma.rentPayment.aggregate({ where:{paidAt:{gte:start,lte:end},lease:{unit:{property:{tenantId}}}}, _sum:{amount:true}, _count:true }).catch(()=>({_sum:{amount:0},_count:0})),
      prisma.feePayment.aggregate({ where:{paidAt:{gte:start,lte:end},student:{tenantId}}, _sum:{amount:true}, _count:true }).catch(()=>({_sum:{amount:0},_count:0})),
    ]);
 
    const revenue = {
      retail:  sales._sum.total||0,
      vat:     sales._sum.vatAmount||0,
      rent:    rentPayments._sum.amount||0,
      fees:    feePayments._sum.amount||0,
    };
    revenue.total = revenue.retail + revenue.rent + revenue.fees;
    revenue.netRevenue = revenue.retail - revenue.vat + revenue.rent + revenue.fees;
 
    const expBreakdown = {};
    let totalOpex = 0;
    for (const e of expenses) { expBreakdown[e.category] = e._sum.amount||0; totalOpex += e._sum.amount||0; }
    const payrollCost = payroll?.totalNet || 0;
    const totalCosts  = totalOpex + payrollCost;
    const grossProfit = revenue.netRevenue;
    const netProfit   = grossProfit - totalCosts;
 
    res.json({ success:true, data:{
      period: MONTHS[m]+' '+y,
      revenue, expenses:{ breakdown:expBreakdown, operations:totalOpex, payroll:payrollCost, total:totalCosts },
      grossProfit, netProfit,
      grossMargin: revenue.netRevenue>0 ? parseFloat((grossProfit/revenue.netRevenue*100).toFixed(1)) : 0,
      netMargin:   revenue.netRevenue>0 ? parseFloat((netProfit/revenue.netRevenue*100).toFixed(1)) : 0,
      transactions: { sales:sales._count||0, rent:rentPayments._count||0, fees:feePayments._count||0 }
    }});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── VAT RETURN (KRA) ─────────────────────────────────────────────────────────
router.get('/reports/vat', async (req,res) => {
  try {
    const {month, year} = req.query;
    const m=parseInt(month)-1, y=parseInt(year);
    const start=new Date(y,m,1), end=new Date(y,m+1,0,23,59,59);
    const tenantId = req.tenantId;
    const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 
    const [sales16, sales0, purchases] = await Promise.all([
      prisma.saleItem.aggregate({ where:{ vatRate:16, sale:{ tenantId, createdAt:{gte:start,lte:end}, status:'COMPLETED' } }, _sum:{subtotal:true,qty:true} }),
      prisma.saleItem.aggregate({ where:{ vatRate:0,  sale:{ tenantId, createdAt:{gte:start,lte:end}, status:'COMPLETED' } }, _sum:{subtotal:true} }),
      prisma.purchaseOrder.aggregate({ where:{ tenantId, createdAt:{gte:start,lte:end}, status:{not:'CANCELLED'} }, _sum:{taxAmount:true,subtotal:true} }).catch(()=>({_sum:{taxAmount:0,subtotal:0}}))
    ]);
 
    const taxableSales    = sales16._sum.subtotal||0;
    const outputVat       = parseFloat((taxableSales * 16/116).toFixed(2));
    const exemptSales     = sales0._sum.subtotal||0;
    const inputVat        = purchases._sum.taxAmount||0;
    const vatPayable      = Math.max(0, outputVat - inputVat);
    const vatRefund       = inputVat > outputVat ? inputVat - outputVat : 0;
 
    res.json({ success:true, data:{
      period: MONTHS[m]+' '+y,
      taxableSales, outputVat, exemptSales,
      purchases:{ subtotal:purchases._sum.subtotal||0, inputVat },
      vatPayable, vatRefund,
      filingDeadline: new Date(y, m+2, 20).toISOString().split('T')[0], // 20th of following month
      kraNote: 'File VAT return on iTax by 20th '+MONTHS[m+1]
    }});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── BALANCE SHEET (simplified) ───────────────────────────────────────────────
router.get('/reports/balance-sheet', async (req,res) => {
  try {
    const tenantId = req.tenantId;
    const accounts = await prisma.account.findMany({ where:{tenantId,isActive:true}, orderBy:{code:'asc'} });
 
    const group = (type) => accounts.filter(a=>a.type===type).reduce((s,a)=>s+(a.balance||0),0);
    const assets      = group('ASSET');
    const liabilities = group('LIABILITY');
    const equity      = group('EQUITY');
    const revenue     = group('REVENUE');
    const expenses_   = group('EXPENSE') + group('COST_OF_GOODS');
 
    res.json({ success:true, data:{
      assets:{ total:assets, accounts: accounts.filter(a=>a.type==='ASSET') },
      liabilities:{ total:liabilities, accounts: accounts.filter(a=>a.type==='LIABILITY') },
      equity:{ total:equity+revenue-expenses_, retainedEarnings:revenue-expenses_ },
      isBalanced: Math.abs(assets - (liabilities+equity+revenue-expenses_)) < 1
    }});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── TAXES ────────────────────────────────────────────────────────────────────
router.get('/taxes', async (req,res) => {
  try {
    const taxes = await prisma.tax.findMany({ where:{tenantId:req.tenantId,isActive:true} });
    res.json({ success:true, data:taxes });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
module.exports = router;
