require('dotenv').config();

// Fix BigInt for Prisma
BigInt.prototype.toJSON = function () { return Number(this); };

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

const app = express();

// ====================== MIDDLEWARE (in correct order) ======================
app.use(helmet());
app.use(morgan('dev'));

// CORS - Single clean configuration for your Vercel frontend
app.use(cors({
  origin: 'https://frontend-three-peach-18.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500
}));

// Trust proxy
app.set('trust proxy', 1);

// ====================== ROUTES ======================
app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/mpesa', require('./routes/mpesa'));

// Protected routes
app.use('/api/inventory', authenticate, require('./routes/inventory'));
app.use('/api/rentals', authenticate, require('./routes/rentals'));
app.use('/api/schools', authenticate, require('./routes/schools'));
app.use('/api/finance', authenticate, require('./routes/finance'));
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BiasharaOS', timestamp: new Date().toISOString() });
});

// Error handler must be last
app.use(errorHandler);

// ====================== CRON JOBS ======================
cron.schedule('0 9 25 * *', () => {
  logger.info('Running rent reminders');
  require('./modules/rentals/rentReminders').sendRentReminders();
});

cron.schedule('0 8 1 * *', () => {
  logger.info('Running fee reminders');
  require('./modules/schools/feeReminders').sendFeeReminders();
});

// ====================== START SERVER ======================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`BiasharaOS API running on http://localhost:${PORT}`);
});
