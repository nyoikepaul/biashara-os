const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  try {
    const { businessName, email, phone, password, kraPin, plan = 'STARTER' } = req.body;
    const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0,30) + '-' + Date.now().toString().slice(-5);
    const hashed = await bcrypt.hash(password, 12);
    const tenant = await prisma.tenant.create({ data: { name: businessName, slug, email, phone, kraPin, plan, users: { create: { name: businessName, email, phone, password: hashed, role: 'OWNER' } } }, include: { users: true } });
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
    const token = jwt.sign({ userId: user.id, tenantId: user.tenantId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, tenant: { id: user.tenant.id, name: user.tenant.name, plan: user.tenant.plan }, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
