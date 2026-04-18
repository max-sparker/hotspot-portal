import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import userRoutes from './routes/user.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: config.NODE_ENV === 'development' ? '*' : config.API_BASE_URL,
    credentials: true,
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(requestLogger);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/user', userRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (должен быть последним)
  app.use(errorHandler);

  return app;
};
