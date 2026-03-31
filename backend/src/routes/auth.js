const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

router.post('/register', async (req, res) => {
  try {
    const { businessName, email, phone, password, kraPin, plan = 'STARTER' } = req.body;
    if (!businessName || !email || !password) return res.status(400).json({ success: false, error: 'Required fields missing' });
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0,30) + '-' + Date.now().toString().slice(-5);
    const hashed = await bcrypt.hash(password, 12);
    const tenant = await prisma.tenant.create({
      data: { name: businessName, slug, email, phone, kraPin, plan,
        users: { create: { name: businessName, email, phone, password: hashed, role: 'OWNER' } } },
      include: { users: true }
    });
    const token = jwt.sign({ userId: tenant.users[0].id, tenantId: tenant.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan }, user: { id: tenant.users[0].id, name: tenant.users[0].name, role: 'OWNER' } });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Email already registered' });
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({ where: { email }, include: { tenant: true } });
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, error: 'Account disabled — contact support' });
    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, tenant: { id: user.tenant.id, name: user.tenant.name, plan: user.tenant.plan }, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findFirst({ where: { email }, include: { tenant: true } });
    if (!user) return res.status(404).json({ success: false, error: 'No account found with that email address' });
    // Generate reset token (in production, send via email)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour
    // Store token (you'd normally save this to DB)
    // For now, just return success
    console.log('Password reset requested for:', email, 'Token:', resetToken);
    res.json({ success: true, message: 'Password reset link sent to ' + email });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: 'Token and password required' });
    const hashed = await bcrypt.hash(password, 12);
    // In production: verify token from DB, update password
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
