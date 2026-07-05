import mongoose from 'mongoose';

type IndexSpec = Record<string, 1 | -1>;

/** Ensures compound indexes for production query performance — Phase 5.6 */
export async function ensureDatabaseIndexes(): Promise<{ ensured: number }> {
  if (mongoose.connection.readyState !== 1) return { ensured: 0 };

  const specs: Array<{ model: string; indexes: IndexSpec[] }> = [
    { model: 'InstalledPackage', indexes: [{ userId: 1, bundleId: 1 }, { userId: 1, updatedAt: -1 }] },
    { model: 'Message', indexes: [{ senderId: 1, createdAt: -1 }, { conversationId: 1, createdAt: -1 }] },
    { model: 'MailMessage', indexes: [{ userId: 1, folder: 1, receivedAt: -1 }] },
    { model: 'Shortcut', indexes: [{ userId: 1, name: 1 }, { userId: 1, lastRunAt: -1 }] },
    { model: 'AssistantConversation', indexes: [{ userId: 1, lastMessageAt: -1 }] },
    { model: 'SecurityEvent', indexes: [{ userId: 1, createdAt: -1 }] },
    { model: 'CloudBackup', indexes: [{ userId: 1, state: 1, completedAt: -1 }] },
    { model: 'ThemeProfile', indexes: [{ userId: 1, isActive: 1 }] },
    { model: 'AuditLog', indexes: [{ userId: 1, createdAt: -1 }] },
    { model: 'NotificationQueue', indexes: [{ userId: 1, status: 1, scheduledAt: 1 }] },
    { model: 'CharacterSession', indexes: [{ platform: 1, externalUserId: 1, status: 1 }, { phoneId: 1 }] },
    { model: 'CharacterPhone', indexes: [{ platform: 1, externalCharacterId: 1, status: 1 }] },
    { model: 'SimCard', indexes: [{ phoneId: 1, slot: 1 }] },
    { model: 'Contact', indexes: [{ phoneId: 1, displayName: 1 }] },
    { model: 'PhoneCall', indexes: [{ phoneId: 1, startedAt: -1 }] },
  ];

  let ensured = 0;
  for (const { model, indexes } of specs) {
    try {
      const m = mongoose.model(model);
      for (const index of indexes) {
        await m.collection.createIndex(index);
        ensured += 1;
      }
    } catch {
      /* model may not be registered yet */
    }
  }

  console.log(`[Database] Ensured ${ensured} production indexes`);
  return { ensured };
}
