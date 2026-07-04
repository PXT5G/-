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
import deviceRoutes from './api/routes/device';
import systemRoutes from './api/routes/system';
import worldRoutes from './api/routes/world';
import communicationRoutes from './api/routes/communication';
import systemAppsRoutes from './api/routes/systemApps';
import policeRoutes from './api/routes/police';
import poetryRoutes from './api/routes/poetry';
import browserRoutes from './api/routes/browser';
import chatRoutes from './api/routes/chat';
import justiceRoutes from './api/routes/justice';
import emsRoutes from './api/routes/ems';

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
app.use('/api/device', deviceRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/world', worldRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/system-apps', systemAppsRoutes);
app.use('/api/police', policeRoutes);
app.use('/api/poetry', poetryRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/justice', justiceRoutes);
app.use('/api/ems', emsRoutes);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    initializeSocket(httpServer);

    // Auto-seed store catalog if empty
    const { StoreListing } = await import('./database/models/StoreListing');
    const count = await StoreListing.countDocuments();
    if (count === 0) {
      const { seedGulfStore } = await import('./services/storeSeedService');
      const result = await seedGulfStore();
      console.log('[GULFOS API] Store seeded:', result);
    }

    const { startBackgroundServiceManager } = await import('./services/backgroundServiceManager');
    const { registerJobHandler } = await import('./services/jobService');
    const { recoverCrashedJobs } = await import('./services/jobService');

    registerJobHandler('cache-cleanup', async () => {
      const { growCachesForAll } = await import('./services/cacheGrowthService');
      const grown = await growCachesForAll();
      return { grown };
    });

    registerJobHandler('diagnostics-collect', async (job) => {
      const { collectDiagnostics } = await import('./services/diagnosticsService');
      const report = await collectDiagnostics(job.userId.toString());
      return { collectedAt: report.collectedAt };
    });

    await recoverCrashedJobs();

    const { seedMapDatabase } = await import('./services/mapDatabaseService');
    const { seedCellTowers } = await import('./services/cellTowerService');
    const mapStats = await seedMapDatabase();
    const towerCount = await seedCellTowers();
    console.log('[GULFOS API] World map seeded:', mapStats, 'towers:', towerCount);

    startBackgroundServiceManager();
    console.log('[GULFOS API] Core OS services started');

    httpServer.listen(env.PORT, () => {
      console.log(`[GULFOS API] Running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('[GULFOS API] Failed to start:', error);
    process.exit(1);
  }
}

bootstrap();

export default app;
