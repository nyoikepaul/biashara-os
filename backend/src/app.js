const crmRoutes = require('./routes/crm');
require('dotenv').config();
// Fix BigInt serialization for Prisma (common in WSL + Postgres)
BigInt.prototype.toJSON = function() { return Number(this); };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const { sendRentReminders } = require('./modules/rentals/rentReminders');
const { sendFeeReminders } = require('./modules/schools/feeReminders');

const app = express();
const apiRoutes = require('./routes/apiRoutes');
app.set('trust proxy', 1 /* trust first proxy */);
app.use('/api', apiRoutes);
app.use(helmet());
app.use(cors({ origin: ['https://frontend-three-peach-18.vercel.app', 'http://localhost:5173'], methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 500 }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'BiasharaOS', timestamp: new Date() }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/crm', crmRoutes);
app.use('/api/mpesa', require('./routes/mpesa'));
app.use('/api/retail', authenticate, require('./routes/retail'));
app.use('/api/payroll', authenticate, require('./routes/payroll'));
app.use('/api/rentals', authenticate, require('./routes/rental'));
app.use('/api/schools', authenticate, require('./routes/school'));
app.use('/api/invoices', authenticate, require('./routes/invoice'));
app.use('/api/dashboard', authenticate, require('./routes/dashboard'));
app.use('/api/customers', authenticate, require('./routes/customers'));
app.use('/api/expenses', authenticate, require('./routes/expenses'));
app.use('/api/suppliers', authenticate, require('./routes/suppliers'));
app.use('/api/reports', authenticate, require('./routes/reports'));
app.use('/api/subscription', authenticate, require('./routes/subscription'));
app.use(errorHandler);

cron.schedule('0 9 25 * *', () => { logger.info('Running rent reminders'); sendRentReminders(); });
cron.schedule('0 8 1 * *', () => { logger.info('Running fee reminders'); sendFeeReminders(); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => logger.info('BiasharaOS API on http://localhost:' + PORT));
