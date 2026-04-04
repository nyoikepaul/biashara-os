const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
// ─── STUDENTS ─────────────────────────────────────────────────────────────────
router.get('/students', async (req,res) => {
  try {
    const {search, class:cls, stream, page=1, limit=50} = req.query;
    const where = { tenantId:req.tenantId, isActive:true };
    if (cls)    where.class  = cls;
    if (stream) where.stream = stream;
    if (search) where.OR = [
      { name:{ contains:search, mode:'insensitive' } },
      { admNo:{ contains:search, mode:'insensitive' } },
      { guardianPhone:{ contains:search } }
    ];
    const [students, total] = await Promise.all([
      prisma.student.findMany({ where, orderBy:{name:'asc'}, take:parseInt(limit), skip:(parseInt(page)-1)*parseInt(limit) }),
      prisma.student.count({ where })
    ]);
    res.json({ success:true, data:students, total });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/students', async (req,res) => {
  try {
    const count = await prisma.student.count({ where:{tenantId:req.tenantId} });
    const year  = new Date().getFullYear();
    const admNo = req.body.admNo || (year+'/'+String(count+1).padStart(4,'0'));
    const student = await prisma.student.create({ data:{
      ...req.body, tenantId:req.tenantId, admNo,
      dob: new Date(req.body.dob||'2010-01-01'),
      year: parseInt(req.body.year||year)
    }});
    res.json({ success:true, data:student });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
router.patch('/students/:id', async (req,res) => {
  try {
    const s = await prisma.student.update({ where:{id:req.params.id}, data:req.body });
    res.json({ success:true, data:s });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── FEE STRUCTURES ───────────────────────────────────────────────────────────
router.get('/fee-structures', async (req,res) => {
  try {
    const fs_ = await prisma.feeStructure.findMany({ where:{tenantId:req.tenantId}, orderBy:[{year:'desc'},{class:'asc'}] });
    res.json({ success:true, data:fs_ });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/fee-structures', async (req,res) => {
  try {
    const { class:cls, term, year, tuition, lunch=0, activity=0, boarding=0, transport=0, uniform=0, pta=0 } = req.body;
    const total = Number(tuition)+Number(lunch)+Number(activity)+Number(boarding)+Number(transport)+Number(uniform)+Number(pta);
    const fs_ = await prisma.feeStructure.create({ data:{
      tenantId:req.tenantId, class:cls, term:parseInt(term), year:parseInt(year),
      tuition:Number(tuition), lunch:Number(lunch), activity:Number(activity),
      boarding:Number(boarding), total
    }});
    res.json({ success:true, data:fs_ });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── FEE PAYMENTS ─────────────────────────────────────────────────────────────
router.get('/payments', async (req,res) => {
  try {
    const {studentId, term, year, page=1, limit=50} = req.query;
    const where = { student:{ tenantId:req.tenantId } };
    if (studentId) where.studentId = studentId;
    if (term)      where.term = parseInt(term);
    if (year)      where.year = parseInt(year);
    const [payments, total] = await Promise.all([
      prisma.feePayment.findMany({ where, include:{ student:{select:{name:true,admNo:true,class:true,guardianPhone:true}} }, orderBy:{paidAt:'desc'}, take:parseInt(limit), skip:(parseInt(page)-1)*parseInt(limit) }),
      prisma.feePayment.count({ where })
    ]);
    res.json({ success:true, data:payments, total });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/payments', async (req,res) => {
  try {
    const { studentId, term, year, amount, mpesaRef, paymentMode='CASH' } = req.body;
    const student = await prisma.student.findUnique({ where:{id:studentId} });
    if (!student) return res.status(404).json({success:false,error:'Student not found'});
 
    // Find fee structure to compute balance
    const feeStruct = await prisma.feeStructure.findFirst({ where:{ tenantId:req.tenantId, class:student.class, term:parseInt(term), year:parseInt(year) } });
    const totalFee  = feeStruct?.total || 0;
    const prevPaid  = await prisma.feePayment.aggregate({ where:{studentId, term:parseInt(term), year:parseInt(year)}, _sum:{amount:true} });
    const paid      = (prevPaid._sum.amount||0) + Number(amount);
    const balance   = Math.max(0, totalFee - paid);
 
    const count     = await prisma.feePayment.count({ where:{student:{tenantId:req.tenantId}} });
    const receiptNo = 'FEE-'+String(count+1).padStart(6,'0');
 
    const payment = await prisma.feePayment.create({ data:{
      studentId, term:parseInt(term), year:parseInt(year),
      amount:Number(amount), balance, mpesaRef, receiptNo, paidAt:new Date()
    }});
 
    // SMS to guardian
    try {
      const AT = require('africastalking')({ apiKey:process.env.AT_API_KEY, username:process.env.AT_USERNAME });
      const phone = student.guardianPhone?.replace(/^0/,'+254');
      if (phone) {
        const msg = 'Dear parent/guardian, fee payment of KES '+Number(amount).toLocaleString()+' received for '+student.name+' ('+student.class+'). Receipt: '+receiptNo+'. '+(balance>0?'Balance: KES '+balance.toLocaleString()+'.':' FULLY PAID.')+' BiasharaOS';
        await AT.SMS.send({ to:[phone], message:msg });
        await prisma.feePayment.update({ where:{id:payment.id}, data:{smsSent:true} });
      }
    } catch(smsErr){ console.log('SMS failed:', smsErr.message); }
 
    res.json({ success:true, data:{...payment, totalFee, totalPaid:paid, balance, receiptNo} });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── FEE DEFAULTERS ───────────────────────────────────────────────────────────
router.get('/defaulters', async (req,res) => {
  try {
    const { term, year } = req.query;
    const t = parseInt(term||1), y = parseInt(year||new Date().getFullYear());
    const tenantId = req.tenantId;
 
    const students = await prisma.student.findMany({ where:{ tenantId, isActive:true }, include:{ feePayments:{ where:{ term:t, year:y } } } });
    const feeStructures = await prisma.feeStructure.findMany({ where:{ tenantId, term:t, year:y } });
    const feeMap = Object.fromEntries(feeStructures.map(f=>[f.class,f.total]));
 
    const defaulters = students.map(s => {
      const totalFee = feeMap[s.class]||0;
      const paid     = s.feePayments.reduce((sum,p)=>sum+(p.amount||0),0);
      const balance  = totalFee - paid;
      return { ...s, totalFee, paid, balance, feePayments:undefined };
    }).filter(s=>s.balance>0).sort((a,b)=>b.balance-a.balance);
 
    res.json({ success:true, data:defaulters, count:defaulters.length, totalOwed:defaulters.reduce((s,d)=>s+d.balance,0) });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── SEND BULK FEE REMINDERS ──────────────────────────────────────────────────
router.post('/send-reminders', async (req,res) => {
  try {
    const { term, year } = req.body;
    const t=parseInt(term||1), yr=parseInt(year||new Date().getFullYear());
    const tenantId = req.tenantId;
    const students = await prisma.student.findMany({ where:{tenantId,isActive:true}, include:{feePayments:{where:{term:t,year:yr}}} });
    const feeStructures = await prisma.feeStructure.findMany({ where:{tenantId,term:t,year:yr} });
    const feeMap = Object.fromEntries(feeStructures.map(f=>[f.class,f.total]));
    const AT = require('africastalking')({ apiKey:process.env.AT_API_KEY, username:process.env.AT_USERNAME });
    let sent=0, failed=0;
    for (const s of students) {
      const totalFee = feeMap[s.class]||0;
      const paid     = s.feePayments.reduce((sum,p)=>sum+(p.amount||0),0);
      const balance  = totalFee - paid;
      if (balance <= 0) continue;
      try {
        const phone = s.guardianPhone?.replace(/^0/,'+254');
        if (phone) {
          await AT.SMS.send({ to:[phone], message:'Dear parent/guardian of '+s.name+' ('+s.class+'), fee balance of KES '+balance.toLocaleString()+' for Term '+t+' '+yr+' is outstanding. Please pay to avoid disruption. BiasharaOS' });
          sent++;
        }
      } catch { failed++; }
    }
    res.json({ success:true, sent, failed });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req,res) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const term = Math.ceil((now.getMonth()+1)/4); // Term 1=Jan-Apr, 2=May-Aug, 3=Sep-Dec
    const [students, payments, feeStructures] = await Promise.all([
      prisma.student.findMany({ where:{tenantId,isActive:true}, select:{class:true} }),
      prisma.feePayment.aggregate({ where:{paidAt:{gte:mStart},student:{tenantId}}, _sum:{amount:true}, _count:true }),
      prisma.feeStructure.findMany({ where:{tenantId,term,year:now.getFullYear()} })
    ]);
    const classes = [...new Set(students.map(s=>s.class))];
    const totalExpected = students.reduce((s,st) => {
      const fee = feeStructures.find(f=>f.class===st.class);
      return s + (fee?.total||0);
    }, 0);
    res.json({ success:true, data:{
      totalStudents: students.length, classes: classes.length,
      monthlyCollection: payments._sum.amount||0, paymentsCount: payments._count||0,
      totalExpected, currentTerm: term
    }});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
module.exports = router;
