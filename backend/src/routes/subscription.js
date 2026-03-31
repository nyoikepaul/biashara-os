const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { stkPush } = require('../integrations/mpesa/mpesa');
const prisma = new PrismaClient();

const PLANS = {
  STARTER:    { price: 2500, name: 'Starter',    modules: ['retail'] },
  BUSINESS:   { price: 5500, name: 'Business',   modules: ['retail','payroll','rentals'] },
  ENTERPRISE: { price: 12000, name: 'Enterprise', modules: ['retail','payroll','rentals','schools'] }
};

router.get('/status', async (req, res) => {
  const tenantId = req.tenant.id;
  let sub = await prisma.subscription.findUnique({ where: { tenantId } });
  if (!sub) {
    const trialEnd = new Date(req.tenant.createdAt);
    trialEnd.setDate(trialEnd.getDate() + 14);
    sub = await prisma.subscription.create({
      data: { tenantId, plan: req.tenant.plan, status: 'TRIAL', trialEndsAt: trialEnd, currentPeriodStart: req.tenant.createdAt, currentPeriodEnd: trialEnd }
    });
  }
  const daysLeft = Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd) - new Date()) / 86400000));
  const plan = PLANS[sub.plan];
  res.json({ success: true, data: { ...sub, daysLeft, planDetails: plan, isExpired: daysLeft === 0 && sub.status !== 'ACTIVE' } });
});

router.post('/pay', async (req, res) => {
  try {
    const { plan, phone } = req.body;
    const planInfo = PLANS[plan];
    if (!planInfo) return res.status(400).json({ success: false, error: 'Invalid plan' });
    if (!req.tenant.mpesaShortcode) return res.status(400).json({ success: false, error: 'M-Pesa not configured. Contact support.' });
    const result = await stkPush({ phone, amount: planInfo.price, accountRef: 'BIASHARA-' + req.tenant.id.slice(0,8).toUpperCase(), description: `BiasharaOS ${planInfo.name} Plan`, shortcode: req.tenant.mpesaShortcode, passkey: req.tenant.mpesaPasskey });
    if (result.success) {
      const now = new Date();
      const end = new Date(now); end.setMonth(end.getMonth()+1);
      await prisma.subscription.upsert({
        where: { tenantId: req.tenant.id },
        create: { tenantId: req.tenant.id, plan, status: 'ACTIVE', trialEndsAt: now, currentPeriodStart: now, currentPeriodEnd: end },
        update: { plan, status: 'ACTIVE', currentPeriodStart: now, currentPeriodEnd: end }
      });
      await prisma.tenant.update({ where: { id: req.tenant.id }, data: { plan } });
    }
    res.json({ success: result.success, checkoutId: result.checkoutRequestId });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
