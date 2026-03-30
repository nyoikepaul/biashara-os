const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { tenant: true } });
    if (!user || !user.isActive) return res.status(401).json({ success: false, error: 'Invalid session' });
    req.user = user; req.tenant = user.tenant; next();
  } catch { return res.status(401).json({ success: false, error: 'Invalid token' }); }
}
module.exports = { authenticate };
