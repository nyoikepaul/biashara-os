const express = require('express');
const router = express.Router();
const { parseStkCallback } = require('../integrations/mpesa/mpesa');
const logger = require('../config/logger');
router.post('/callback/stk', (req, res) => {
  try { const r = parseStkCallback(req.body); logger.info('STK callback:', r); } catch {}
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});
router.post('/callback/b2c/result', (req, res) => { logger.info('B2C result'); res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); });
router.post('/callback/b2c/timeout', (req, res) => { res.json({ ResultCode: 0, ResultDesc: 'Accepted' }); });
module.exports = router;
