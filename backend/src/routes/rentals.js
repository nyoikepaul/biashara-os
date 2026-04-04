const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
 
// ─── PROPERTIES ──────────────────────────────────────────────────────────────
router.get('/properties', async (req,res) => {
  try {
    const props = await prisma.property.findMany({
      where: { tenantId: req.tenantId },
      include: { units: { include: { leases: { where: { status:'ACTIVE' }, take:1 } } } },
      orderBy: { name:'asc' }
    });
    const withStats = props.map(p => ({
      ...p,
      totalUnits: p.units.length,
      occupiedUnits: p.units.filter(u => u.isOccupied).length,
      vacantUnits: p.units.filter(u => !u.isOccupied).length,
      monthlyRent: p.units.filter(u=>u.isOccupied).reduce((s,u)=>s+(u.rentAmount||0),0)
    }));
    res.json({ success:true, data: withStats });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/properties', async (req,res) => {
  try {
    const prop = await prisma.property.create({ data:{...req.body, tenantId:req.tenantId} });
    res.json({ success:true, data:prop });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── UNITS ────────────────────────────────────────────────────────────────────
router.get('/properties/:id/units', async (req,res) => {
  try {
    const units = await prisma.unit.findMany({
      where: { propertyId:req.params.id },
      include: { leases: { where:{status:'ACTIVE'}, take:1 } },
      orderBy: { unitNo:'asc' }
    });
    res.json({ success:true, data:units });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/units', async (req,res) => {
  try {
    const unit = await prisma.unit.create({ data:{...req.body, rentAmount:Number(req.body.rentAmount), depositAmount:Number(req.body.depositAmount||0)} });
    res.json({ success:true, data:unit });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
router.patch('/units/:id', async (req,res) => {
  try {
    const unit = await prisma.unit.update({ where:{id:req.params.id}, data:req.body });
    res.json({ success:true, data:unit });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── LEASES ───────────────────────────────────────────────────────────────────
router.get('/leases', async (req,res) => {
  try {
    const {status, page=1, limit=50} = req.query;
    const where = { unit: { property: { tenantId: req.tenantId } } };
    if (status) where.status = status;
    const leases = await prisma.lease.findMany({
      where, include:{ unit:{ include:{ property:{ select:{name:true} } } }, payments:{ orderBy:{paidAt:'desc'}, take:3 } },
      orderBy:{ createdAt:'desc' }, take:parseInt(limit), skip:(parseInt(page)-1)*parseInt(limit)
    });
    res.json({ success:true, data:leases });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/leases', async (req,res) => {
  try {
    const lease = await prisma.$transaction(async (tx) => {
      const l = await tx.lease.create({ data:{
        ...req.body,
        rentAmount: Number(req.body.rentAmount),
        depositPaid: Number(req.body.depositPaid||0),
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
      }});
      await tx.unit.update({ where:{id:req.body.unitId}, data:{isOccupied:true} });
      return l;
    });
    res.json({ success:true, data:lease });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
router.patch('/leases/:id/terminate', async (req,res) => {
  try {
    const lease = await prisma.$transaction(async (tx) => {
      const l = await tx.lease.update({ where:{id:req.params.id}, data:{status:'TERMINATED', endDate:new Date()} });
      await tx.unit.update({ where:{id:l.unitId}, data:{isOccupied:false} });
      return l;
    });
    res.json({ success:true, data:lease });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── RENT PAYMENTS ────────────────────────────────────────────────────────────
router.get('/payments', async (req,res) => {
  try {
    const {leaseId, month, year, page=1, limit=50} = req.query;
    const where = { lease:{ unit:{ property:{ tenantId:req.tenantId } } } };
    if (leaseId) where.leaseId = leaseId;
    if (month)   where.month = parseInt(month);
    if (year)    where.year  = parseInt(year);
    const [payments, total] = await Promise.all([
      prisma.rentPayment.findMany({ where, include:{ lease:{ include:{ unit:{ include:{ property:{select:{name:true}} } } } } }, orderBy:{paidAt:'desc'}, take:parseInt(limit), skip:(parseInt(page)-1)*parseInt(limit) }),
      prisma.rentPayment.count({ where })
    ]);
    res.json({ success:true, data:payments, total });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
router.post('/payments', async (req,res) => {
  try {
    const { leaseId, amount, month, year, mpesaRef, paymentMethod='CASH' } = req.body;
    const lease = await prisma.lease.findUnique({ where:{id:leaseId}, include:{unit:{include:{property:true}}} });
    if (!lease) return res.status(404).json({success:false,error:'Lease not found'});
 
    const isLate = new Date().getDate() > 5; // Late after 5th of month
    const payment = await prisma.rentPayment.create({ data:{
      leaseId, amount:Number(amount), month:parseInt(month), year:parseInt(year),
      mpesaRef, isLate, smsSent:false, paidAt:new Date()
    }});
 
    // Send SMS confirmation
    try {
      const AT = require('africastalking')({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
      const phone = lease.tenantPhone?.replace(/^0/,'+254');
      if (phone) {
        await AT.SMS.send({ to:[phone], message:'Dear '+lease.tenantName+', rent payment of KES '+Number(amount).toLocaleString()+' for '+lease.unit.unitNo+' ('+lease.unit.property.name+') received. Ref: '+(mpesaRef||'MANUAL')+'. Thank you! - BiasharaOS' });
        await prisma.rentPayment.update({ where:{id:payment.id}, data:{smsSent:true} });
      }
    } catch(smsErr){ console.log('SMS failed:', smsErr.message); }
 
    res.json({ success:true, data:payment });
  } catch(e){ res.status(400).json({success:false,error:e.message}); }
});
 
// ─── DEFAULTERS LIST ──────────────────────────────────────────────────────────
router.get('/defaulters', async (req,res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth()+1;
    const currentYear  = now.getFullYear();
 
    const activeLeases = await prisma.lease.findMany({
      where: { status:'ACTIVE', unit:{ property:{ tenantId:req.tenantId } } },
      include: { unit:{ include:{ property:{select:{name:true}} } }, payments:{ where:{ month:currentMonth, year:currentYear } } }
    });
 
    const defaulters = activeLeases
      .filter(l => l.payments.length === 0)
      .map(l => ({
        leaseId:     l.id,
        tenantName:  l.tenantName,
        tenantPhone: l.tenantPhone,
        unitNo:      l.unit.unitNo,
        property:    l.unit.property.name,
        rentAmount:  l.rentAmount,
        monthsOwed:  1,
      }));
 
    res.json({ success:true, data:defaulters, count:defaulters.length, totalOwed:defaulters.reduce((s,d)=>s+d.rentAmount,0) });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── SEND BULK REMINDERS ──────────────────────────────────────────────────────
router.post('/send-reminders', async (req,res) => {
  try {
    const defaulters = await (async()=>{
      const r = await fetch('http://localhost:'+process.env.PORT+'/api/rentals/defaulters', { headers:{'Authorization':req.headers.authorization} });
      const j = await r.json(); return j.data||[];
    })().catch(()=>[]);
 
    let sent=0, failed=0;
    const AT = require('africastalking')({ apiKey:process.env.AT_API_KEY, username:process.env.AT_USERNAME });
    for (const d of defaulters) {
      try {
        const phone = d.tenantPhone?.replace(/^0/,'+254');
        if (phone) {
          await AT.SMS.send({ to:[phone], message:'Dear '+d.tenantName+', your rent of KES '+Number(d.rentAmount).toLocaleString()+' for '+d.unitNo+' ('+d.property+') is overdue. Please pay immediately to avoid penalties. BiasharaOS' });
          sent++;
        }
      } catch{ failed++; }
    }
    res.json({ success:true, sent, failed, total:defaulters.length });
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
router.get('/stats', async (req,res) => {
  try {
    const tenantId = req.tenantId;
    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [properties, leases, payments, defaulters] = await Promise.all([
      prisma.property.findMany({ where:{tenantId}, include:{units:true} }),
      prisma.lease.count({ where:{ status:'ACTIVE', unit:{ property:{ tenantId } } } }),
      prisma.rentPayment.aggregate({ where:{ paidAt:{gte:mStart}, lease:{ unit:{ property:{ tenantId } } } }, _sum:{amount:true}, _count:true }),
      prisma.lease.count({ where:{ status:'ACTIVE', unit:{ property:{ tenantId } }, payments:{ none:{ month:now.getMonth()+1, year:now.getFullYear() } } } }).catch(()=>0)
    ]);
    const totalUnits    = properties.reduce((s,p)=>s+p.units.length, 0);
    const occupiedUnits = properties.reduce((s,p)=>s+p.units.filter(u=>u.isOccupied).length, 0);
    res.json({ success:true, data:{
      properties: properties.length, totalUnits, occupiedUnits,
      vacantUnits: totalUnits-occupiedUnits, occupancyRate: totalUnits>0?Math.round(occupiedUnits/totalUnits*100):0,
      activeLeases: leases, monthlyCollection: payments._sum.amount||0,
      paymentsCount: payments._count||0, defaulters
    }});
  } catch(e){ res.status(500).json({success:false,error:e.message}); }
});
 
module.exports = router;
