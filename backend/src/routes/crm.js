const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

router.get('/customers', (req, res) => {
  // Required for free ngrok tunnels to work with fetch()
  res.setHeader('ngrok-skip-browser-warning', 'true');
  
  res.json([
    { id: 1, name: "Nairobi Supplies Ltd", email: "info@nairobisupplies.co.ke", status: "Active", phone: "+254 700 000000" },
    { id: 2, name: "Mombasa Millers", email: "sales@mombasamillers.com", status: "Lead", phone: "+254 711 111111" }
  ]);
});


router.get('/reports/sales', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const tenantId = req.tenantId;
    const since = new Date(Date.now() - parseInt(days) * 86400000);

    const [byPaymentMethod, topProducts] = await Promise.all([
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: { tenantId, createdAt: { gte: since }, status: 'COMPLETED' },
        _sum: { total: true }, _count: true
      }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: { sale: { tenantId, createdAt: { gte: since }, status: 'COMPLETED' } },
        _sum: { subtotal: true, qty: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 10
      })
    ]);

    const productIds = topProducts.map(p => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true }
    });
    const productMap = Object.fromEntries(productDetails.map(p => [p.id, p]));
    const topProductsMapped = topProducts.map(p => ({
      ...productMap[p.productId],
      revenue: p._sum.subtotal || 0,
      qty_sold: p._sum.qty || 0
    }));

    res.json({ success: true, data: { daily: [], byPaymentMethod, topProducts: topProductsMapped } });
  } catch (err) {
    console.error('CRM reports error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
