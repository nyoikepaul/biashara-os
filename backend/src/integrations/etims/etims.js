const QRCode = require('qrcode');
const logger = require('../../config/logger');
async function submitInvoice({ tenant, sale, items }) {
  try {
    const invoiceNo = `${tenant.kraPin || 'TMP'}/${Date.now()}`;
    const qrData = `KRA|${tenant.kraPin || 'N/A'}|${invoiceNo}|${sale.total}|${new Date().toISOString().slice(0,10)}`;
    const qrCode = await QRCode.toDataURL(qrData);
    logger.info(`eTIMS QR generated for ${invoiceNo}`);
    return { success: true, invoiceNo, qrCode, etimsRef: `ETIMS-${Date.now()}` };
  } catch (err) {
    logger.error('eTIMS error:', err.message);
    return { success: false, invoiceNo: null, qrCode: null };
  }
}
module.exports = { submitInvoice };
