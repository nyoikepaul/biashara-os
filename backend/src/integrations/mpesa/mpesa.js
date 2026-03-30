const axios = require('axios');
const logger = require('../../config/logger');
const BASE = process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

async function getToken() {
  const creds = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await axios.get(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${creds}` } });
  return res.data.access_token;
}

async function stkPush({ phone, amount, accountRef, description, shortcode, passkey }) {
  try {
    const token = await getToken();
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString('base64');
    const normalizedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');
    const res = await axios.post(`${BASE}/mpesa/stkpush/v1/processrequest`, {
      BusinessShortCode: shortcode, Password: password, Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline', Amount: Math.ceil(amount),
      PartyA: normalizedPhone, PartyB: shortcode, PhoneNumber: normalizedPhone,
      CallBackURL: `${process.env.API_URL}/api/mpesa/callback/stk`,
      AccountReference: accountRef, TransactionDesc: description
    }, { headers: { Authorization: `Bearer ${token}` } });
    return { success: true, checkoutRequestId: res.data.CheckoutRequestID };
  } catch (err) {
    logger.error('STK Push error:', err.response?.data || err.message);
    return { success: false, error: err.response?.data?.errorMessage || err.message };
  }
}

async function b2cPayment({ phone, amount, remarks }) {
  try {
    const token = await getToken();
    const normalizedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');
    const res = await axios.post(`${BASE}/mpesa/b2c/v3/paymentrequest`, {
      InitiatorName: process.env.MPESA_INITIATOR_NAME,
      SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
      CommandID: 'BusinessPayment', Amount: Math.ceil(amount),
      PartyA: process.env.MPESA_SHORTCODE, PartyB: normalizedPhone,
      Remarks: remarks || 'Salary Payment',
      QueueTimeOutURL: `${process.env.API_URL}/api/mpesa/callback/b2c/timeout`,
      ResultURL: `${process.env.API_URL}/api/mpesa/callback/b2c/result`,
      Occasion: 'Payroll'
    }, { headers: { Authorization: `Bearer ${token}` } });
    return { success: true, conversationId: res.data.ConversationID };
  } catch (err) {
    logger.error('B2C error:', err.response?.data || err.message);
    return { success: false, error: err.response?.data?.errorMessage || err.message };
  }
}

function parseStkCallback(body) {
  const { Body: { stkCallback } } = body;
  const success = stkCallback.ResultCode === 0;
  let mpesaRef = null, amount = null, phone = null;
  if (success) {
    const items = stkCallback.CallbackMetadata.Item;
    mpesaRef = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    amount = items.find(i => i.Name === 'Amount')?.Value;
    phone = items.find(i => i.Name === 'PhoneNumber')?.Value;
  }
  return { success, checkoutRequestId: stkCallback.CheckoutRequestID, mpesaRef, amount, phone };
}

module.exports = { stkPush, b2cPayment, parseStkCallback };
