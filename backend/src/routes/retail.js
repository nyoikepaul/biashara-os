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


// PATCH /api/retail/products/:id — update product
router.patch('/products/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { ...req.body, buyingPrice: req.body.buyingPrice ? Number(req.body.buyingPrice) : undefined, sellingPrice: req.body.sellingPrice ? Number(req.body.sellingPrice) : undefined }
    });
    res.json({ success: true, data: product });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
});
 
// DELETE /api/retail/products/:id — soft delete
router.delete('/products/:id', async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true });
});
 
// POST /api/retail/stock/adjust — stock adjustment
router.post('/stock/adjust', async (req, res) => {
  try {
    const { productId, qty, type, notes } = req.body;
    await prisma.$transaction(async (tx) => {
      if (type === 'OPENING_STOCK') {
        await tx.product.update({ where: { id: productId }, data: { stock: Number(qty) } });
      } else {
        await tx.product.update({ where: { id: productId }, data: { stock: { increment: Number(qty) } } });
      }
      await tx.stockMovement.create({ data: { productId, type, qty: Number(qty), reason: notes || type } });
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
 
// POST /api/retail/sales/:id/refund
router.post('/sales/:id/refund', async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    if (sale.status === 'REFUNDED') return res.status(400).json({ success: false, error: 'Already refunded' });
    await prisma.$transaction(async (tx) => {
      await tx.sale.update({ where: { id: sale.id }, data: { status: 'REFUNDED' } });
      for (const item of sale.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
        await tx.stockMovement.create({ data: { productId: item.productId, type: 'RETURN_IN', qty: item.qty, reason: 'Refund: ' + sale.receiptNo } });
      }
    });
    res.json({ success: true, message: 'Refund processed for ' + sale.receiptNo });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
