const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const crm = require('../controllers/crmController');
const mpesa = require('../controllers/mpesaController');

router.post('/inventory', inv.addStock);
router.post('/crm', crm.createLead);
router.post('/mpesa/callback', mpesa.handleCallback);

module.exports = router;
