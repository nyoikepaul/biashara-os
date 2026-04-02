const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// REGISTER - now includes required slug for Tenant
router.post('/register', async (req, res) => {
  try {
    const { businessName, name, email, phone, password, kraPin, county, plan = 'STARTER' } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });
    const tenantName = businessName || name || 'My Business';
    const tenantPhone = phone || '0700000000';
    const slug = tenantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0,30) + '-' + Date.now().toString().slice(-5);
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const hashed = await bcrypt.hash(password, 12);
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });
    const tenant = await prisma.tenant.create({
      data: { name: tenantName, slug, phone: tenantPhone, email, kraPin: kraPin || null, plan }
    });
    const user = await prisma.user.create({
      data: { tenantId: tenant.id, name: tenantName, email, phone: tenantPhone, password: hashed, role: 'OWNER' },
      select: { id: true, name: true, email: true, role: true, tenantId: true }
    });
    const token = jwt.sign({ userId: user.id, tenantId: tenant.id }, process.env.JWT_SECRET || 'biashara-secret', { expiresIn: '30d' });
    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role }, tenant: { id: tenant.id, name: tenant.name, plan: tenant.plan } });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Email already registered' });
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findFirst({ 
            where: { email },
            include: { tenant: true }
        });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role,
                tenantId: user.tenantId 
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
