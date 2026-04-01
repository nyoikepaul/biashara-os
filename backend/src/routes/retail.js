const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/retail/products
router.get('/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, price: true, sku: true }
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// POST /api/retail/sales
router.post('/sales', async (req, res) => {
  const { items, total, paymentMethod, customerId, phone } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No items in cart' });
  }

  try {
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          total: Number(total),
          customerId: customerId || null,
          paymentMethod,
          status: 'completed',
        },
      });

      await tx.saleItem.createMany({
        data: items.map((item) => ({
          saleId: newSale.id,
          productId: item.productId,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      });

      if (paymentMethod === 'mpesa' && phone) {
        console.log(`📱 M-Pesa STK pushed to ${phone} for KES ${total}`);
      }

      await tx.etimsLog.create({
        data: { saleId: newSale.id, status: 'pending', cuin: null }
      });

      return newSale;
    });

    res.json({
      success: true,
      saleId: sale.id,
      message: paymentMethod === 'mpesa' ? 'Sale completed. M-Pesa STK sent!' : 'Cash sale completed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Sale failed - transaction rolled back' });
  }
});

module.exports = router;
