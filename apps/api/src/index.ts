import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './config/env';
import { connectDatabase } from './database/connection';
import { initializeSocket } from './services/socketService';
import { globalRateLimiter } from './api/middleware/rateLimit';
import { errorHandler } from './api/middleware/errorHandler';
import authRoutes from './api/routes/auth';
import appRoutes from './api/routes/apps';
import notificationRoutes from './api/routes/notifications';
import settingsRoutes from './api/routes/settings';
import filesystemRoutes from './api/routes/filesystem';
import adminRoutes from './api/routes/admin';
import storeRoutes from './api/routes/store';
import identityRoutes from './api/routes/identity';
import bankRoutes from './api/routes/bank';
import simRoutes from './api/routes/sim';
import contactsRoutes from './api/routes/contacts';
import policeRoutes from './api/routes/police';
import platformRoutes from './api/routes/platform';
import justiceRoutes from './api/routes/justice';
import controlPanelRoutes from './api/routes/controlPanel';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(globalRateLimiter);

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/filesystem', filesystemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/sim', simRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/justice', justiceRoutes);
app.use('/api/control-panel', controlPanelRoutes);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    initializeSocket(httpServer);

    // Auto-seed store catalog if empty
    const { StoreListing } = await import('./database/models/StoreListing');
    const count = await StoreListing.countDocuments();
    if (count === 0) {
      const { seedBananaStore } = await import('./services/storeSeedService');
      const result = await seedBananaStore();
      console.log('[BananaOS API] Store seeded:', result);
    }

    httpServer.listen(env.PORT, () => {
      console.log(`[BananaOS API] Running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('[BananaOS API] Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
