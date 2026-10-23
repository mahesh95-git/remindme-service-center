import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startReminderScheduler } from './jobs/dailyReminderJob.js';

// Route modules
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import customersRoutes from './modules/customers/routes.js';
import vehiclesRoutes from './modules/vehicles/routes.js';
import serviceHistoryRoutes from './modules/serviceHistory/routes.js';
import remindersRoutes from './modules/reminders/routes.js';
import bookingsRoutes from './modules/bookings/routes.js';
import invoicesRoutes from './modules/invoices/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import settingsRoutes from './modules/settings/routes.js';
import servicesRoutes from './modules/services/routes.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost frontend development and requests with no origin (like mobile/curl)
      if (!origin || origin.startsWith('http://localhost') || origin === ENV.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', orm: 'prisma', timestamp: new Date().toISOString() });
});

// Mount module routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/vehicles/:id/service-history', serviceHistoryRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/services', servicesRoutes);

// Central error handler
app.use(errorHandler);

// Start server and background jobs
const server = app.listen(ENV.PORT, () => {
  logger.info(`Car Service Reminder API server running on port ${ENV.PORT}`);
  logger.info(`Environment: ${ENV.NODE_ENV}`);
  logger.info(`Database ORM: Prisma`);

  // Start cron scheduler for vehicle reminders
  startReminderScheduler();
});

export default app;
