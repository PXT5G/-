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
import businessRoutes from './api/routes/business';
import realEstateRoutes from './api/routes/realEstate';
import vehicleRoutes from './api/routes/vehicles';
import aviationRoutes from './api/routes/aviation';
import marineRoutes from './api/routes/marine';
import economyRoutes from './api/routes/economy';
import exchangeRoutes from './api/routes/exchange';
import phoneRoutes from './api/routes/phone';
import contactsRoutes from './api/routes/contacts';
import messagesRoutes from './api/routes/messages';
import mailRoutes from './api/routes/mail';
import simRoutes from './api/routes/sim';
import bankRoutes from './api/routes/bank';
import identityRoutes from './api/routes/identity';
import assistantRoutes from './api/routes/assistant';
import automationRoutes from './api/routes/automation';
import shortcutsRoutes from './api/routes/shortcuts';
import focusRoutes from './api/routes/focus';
import intelligenceRoutes from './api/routes/intelligence';
import personalizationRoutes from './api/routes/personalization';
import securityRoutes from './api/routes/security';
import privacyRoutes from './api/routes/privacy';
import cloudRoutes from './api/routes/cloud';
import findMyRoutes from './api/routes/findMy';
import updatesRoutes from './api/routes/updates';
import developerRoutes from './api/routes/developer';
import analyticsRoutes from './api/routes/analytics';
import diagnosticsRoutes from './api/routes/diagnostics';
import enterpriseRoutes from './api/routes/enterprise';
import internalRoutes from './api/routes/internal';
import discordInternalRoutes from './api/routes/discordInternal';
import discordRoutes from './api/routes/discord';
import { idempotencyMiddleware } from './api/middleware/idempotency';
import { withPhonePresenceGuard } from './api/middleware/phoneRouteGuard';
import { collectSystemHealth } from './services/healthService';

const app = express();
const httpServer = createServer(app);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(idempotencyMiddleware);
app.use(globalRateLimiter);

app.get('/health', async (_req, res) => {
  try {
    const report = await collectSystemHealth();
    const statusCode = report.status === 'down' ? 503 : 200;
    res.status(statusCode).json({ success: true, data: report });
  } catch {
    res.status(503).json({
      success: false,
      data: { status: 'down', timestamp: new Date().toISOString() },
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/apps', ...withPhonePresenceGuard(appRoutes));
app.use('/api/notifications', ...withPhonePresenceGuard(notificationRoutes));
app.use('/api/settings', ...withPhonePresenceGuard(settingsRoutes));
app.use('/api/filesystem', ...withPhonePresenceGuard(filesystemRoutes));
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/device', ...withPhonePresenceGuard(deviceRoutes));
app.use('/api/system', ...withPhonePresenceGuard(systemRoutes));
app.use('/api/world', worldRoutes);
app.use('/api/communication', ...withPhonePresenceGuard(communicationRoutes));
app.use('/api/system-apps', ...withPhonePresenceGuard(systemAppsRoutes));
app.use('/api/police', policeRoutes);
app.use('/api/poetry', poetryRoutes);
app.use('/api/browser', ...withPhonePresenceGuard(browserRoutes));
app.use('/api/chat', ...withPhonePresenceGuard(chatRoutes));
app.use('/api/justice', justiceRoutes);
app.use('/api/ems', emsRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/real-estate', realEstateRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/aviation', aviationRoutes);
app.use('/api/marine', marineRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/phone', ...withPhonePresenceGuard(phoneRoutes));
app.use('/api/contacts', ...withPhonePresenceGuard(contactsRoutes));
app.use('/api/messages', ...withPhonePresenceGuard(messagesRoutes));
app.use('/api/mail', ...withPhonePresenceGuard(mailRoutes));
app.use('/api/sim', ...withPhonePresenceGuard(simRoutes));
app.use('/api/bank', ...withPhonePresenceGuard(bankRoutes));
app.use('/api/identity', ...withPhonePresenceGuard(identityRoutes));
app.use('/api/assistant', ...withPhonePresenceGuard(assistantRoutes));
app.use('/api/automation', ...withPhonePresenceGuard(automationRoutes));
app.use('/api/shortcuts', ...withPhonePresenceGuard(shortcutsRoutes));
app.use('/api/focus', ...withPhonePresenceGuard(focusRoutes));
app.use('/api/intelligence', ...withPhonePresenceGuard(intelligenceRoutes));
app.use('/api/personalization', ...withPhonePresenceGuard(personalizationRoutes));
app.use('/api/security', ...withPhonePresenceGuard(securityRoutes));
app.use('/api/privacy', ...withPhonePresenceGuard(privacyRoutes));
app.use('/api/cloud', ...withPhonePresenceGuard(cloudRoutes));
app.use('/api/find-my', ...withPhonePresenceGuard(findMyRoutes));
app.use('/api/updates', ...withPhonePresenceGuard(updatesRoutes));
app.use('/api/developer', ...withPhonePresenceGuard(developerRoutes));
app.use('/api/analytics', ...withPhonePresenceGuard(analyticsRoutes));
app.use('/api/diagnostics', ...withPhonePresenceGuard(diagnosticsRoutes));
app.use('/api/enterprise', ...withPhonePresenceGuard(enterpriseRoutes));
app.use('/api/internal', internalRoutes);
app.use('/api/internal/discord', discordInternalRoutes);
app.use('/api/discord', discordRoutes);

app.use(errorHandler);

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    const { ensureDatabaseIndexes } = await import('./database/ensureIndexes');
    await ensureDatabaseIndexes();
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

    const { registerDefaultNotificationProviders } = await import('./services/notificationProviders/defaultProviders');
    registerDefaultNotificationProviders();

    const { recordServiceHeartbeat } = await import('./services/serviceRegistryService');
    recordServiceHeartbeat({ serviceId: 'api', status: 'healthy', version: '1.0.0' });

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
