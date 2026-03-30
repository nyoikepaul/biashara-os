const { PrismaClient } = require('@prisma/client');
const { sendSMS, templates } = require('../../integrations/africastalking/notifications');
const logger = require('../../config/logger');
const prisma = new PrismaClient();
async function sendFeeReminders() {
  try {
    const now = new Date(), year = now.getFullYear();
    const term = now.getMonth() < 4 ? 1 : now.getMonth() < 8 ? 2 : 3;
    const defaulters = await prisma.$queryRaw`
      SELECT s.id, s.name, s."admNo", s."guardianPhone", s."guardianName", s."tenantId",
             fs.total as expected, COALESCE(SUM(fp.amount),0) as paid,
             (fs.total - COALESCE(SUM(fp.amount),0)) as balance
      FROM "Student" s
      JOIN "FeeStructure" fs ON fs.class=s.class AND fs.term=${term} AND fs.year=${year} AND fs."tenantId"=s."tenantId"
      LEFT JOIN "FeePayment" fp ON fp."studentId"=s.id AND fp.term=${term} AND fp.year=${year}
      WHERE s."isActive"=true GROUP BY s.id, fs.total
      HAVING (fs.total - COALESCE(SUM(fp.amount),0)) > 0`;
    let sent = 0;
    for (const d of defaulters) {
      await sendSMS({ tenantId: d.tenantId, to: d.guardianPhone, message: templates.feeBalance(d.guardianName.split(' ')[0], d.name.split(' ')[0], Number(d.balance), term, year), module: 'school' });
      sent++;
    }
    logger.info(`Fee reminders: ${sent} sent`);
  } catch (err) { logger.error('Fee reminder error:', err.message); }
}
module.exports = { sendFeeReminders };
