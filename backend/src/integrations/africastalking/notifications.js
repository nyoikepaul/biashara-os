const AfricasTalking = require('africastalking');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const logger = require('../../config/logger');
const prisma = new PrismaClient();
const at = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME });
const smsService = at.SMS;

async function sendSMS({ tenantId, to, message, module: mod = 'general' }) {
  try {
    const phones = Array.isArray(to) ? to : [to];
    const normalized = phones.map(p => p.replace(/^0/, '+254').replace(/^\+254/, '+254').replace(/^254/, '+254'));
    const res = await smsService.send({ to: normalized, message, from: process.env.AT_SENDER_ID || 'BiasharaOS' });
    const recipient = res.SMSMessageData.Recipients[0];
    if (tenantId) {
      await prisma.smsLog.create({ data: { tenantId, to: normalized.join(','), message, module: mod, status: recipient?.status || 'queued', messageId: recipient?.messageId, cost: recipient?.cost } }).catch(() => {});
    }
    logger.info(`SMS to ${normalized}: ${recipient?.status}`);
    return { success: true };
  } catch (err) {
    logger.error('SMS error:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendWhatsApp({ to, bodyText }) {
  try {
    if (!process.env.WA_ACCESS_TOKEN || process.env.WA_ACCESS_TOKEN === 'your_access_token') return { success: false };
    const phone = to.replace(/^0/, '254').replace(/^\+/, '');
    await axios.post(`https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
      { messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: bodyText } },
      { headers: { Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}` } });
    return { success: true };
  } catch (err) {
    logger.error('WhatsApp error:', err.response?.data || err.message);
    return { success: false };
  }
}

const templates = {
  payslip: (name, net, month, year, ref) => `Dear ${name}, your salary for ${month}/${year} of KES ${Number(net).toLocaleString()} has been processed. Ref: ${ref}. BiasharaOS`,
  rentReminder: (name, unit, amount, due) => `Dear ${name}, rent for ${unit} of KES ${Number(amount).toLocaleString()} is due on ${due}. Pay via M-Pesa: ${process.env.MPESA_SHORTCODE}. BiasharaOS`,
  rentReceipt: (name, amount, month, ref) => `Dear ${name}, rent of KES ${Number(amount).toLocaleString()} for ${month} received. Ref: ${ref}. Thank you! BiasharaOS`,
  feeBalance: (guardian, student, balance, term, year) => `Dear ${guardian}, ${student}'s fee balance Term ${term}/${year} is KES ${Number(balance).toLocaleString()}. Pay via M-Pesa: ${process.env.MPESA_SHORTCODE}. BiasharaOS`,
  feeReceipt: (guardian, student, amount, ref, balance) => `Dear ${guardian}, KES ${Number(amount).toLocaleString()} for ${student} received. Ref: ${ref}. Balance: KES ${Number(balance).toLocaleString()}. BiasharaOS`,
  saleReceipt: (name, total, receiptNo, items) => `Thank you ${name}! Receipt: ${receiptNo}. Total: KES ${Number(total).toLocaleString()} (${items} item(s)). BiasharaOS`,
  invoiceDue: (client, invoiceNo, amount, due) => `Dear ${client}, Invoice ${invoiceNo} for KES ${Number(amount).toLocaleString()} is due on ${due}. BiasharaOS`
};

module.exports = { sendSMS, sendWhatsApp, templates };
