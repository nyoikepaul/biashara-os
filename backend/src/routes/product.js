const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get all products for the tenant
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.query; // In prod, get this from JWT
    const products = await prisma.product.findMany({
      where: { tenantId: tenantId },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add a new product (The logic behind your Blue Button)
router.post('/', async (req, res) => {
  try {
    const { name, price, stock, tenantId } = req.body;
    const newProduct = await prisma.product.create({
      data: {
        id: crypto.randomUUID(),
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        tenantId
      }
    });
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: 'Invalid product data' });
  }
});

module.exports = router;
