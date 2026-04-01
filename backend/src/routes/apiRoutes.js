const express = require('express');
const router = express.Router();
const inv = require('../controllers/inventoryController');
const crm = require('../controllers/crmController');

router.post('/inventory', inv.addStock);
router.post('/crm', crm.createLead);

module.exports = router;
