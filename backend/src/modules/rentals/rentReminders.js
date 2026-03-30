const { PrismaClient } = require('@prisma/client');
const { sendSMS, templates } = require('../../integrations/africastalking/notifications');
const logger = require('../../config/logger');
const prisma = new PrismaClient();
async function sendRentReminders() {
  try {
    const now = new Date(), month = now.getMonth()+1, year = now.getFullYear();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const due = `1st ${months[month-1]} ${year}`;
    const leases = await prisma.lease.findMany({ where: { status: 'ACTIVE' }, include: { unit: { include: { property: true } }, payments: { where: { month, year } } } });
    let sent = 0;
    for (const lease of leases) {
      if (lease.payments.length > 0) continue;
      await sendSMS({ tenantId: lease.unit.property.tenantId, to: lease.tenantPhone, message: templates.rentReminder(lease.tenantName.split(' ')[0], `${lease.unit.property.name} - ${lease.unit.unitNo}`, lease.rentAmount, due), module: 'rent' });
      sent++;
    }
    logger.info(`Rent reminders: ${sent} sent`);
  } catch (err) { logger.error('Rent reminder error:', err.message); }
}
module.exports = { sendRentReminders };
