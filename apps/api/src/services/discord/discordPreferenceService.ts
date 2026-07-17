import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { DiscordLink } from '../../database/models/DiscordLink';
import { DiscordNotificationPreferences } from '../../database/models/DiscordNotificationPreferences';
import { ExternalAccountLink } from '../../database/models/ExternalAccountLink';
import {
  DISCORD_CATEGORY_DEFAULTS,
  type DiscordNotificationCategory,
} from '../../constants/discordNotifications';
import type { IQuietHours } from '../../database/models/DiscordNotificationPreferences';

function prefId(): string {
  return `DNP-${uuidv4().slice(0, 12).toUpperCase()}`;
}

function linkId(): string {
  return `DLK-${uuidv4().slice(0, 12).toUpperCase()}`;
}

export async function linkDiscordAccount(input: {
  gulfosUserId: string;
  discordUserId: string;
  dmChannelId?: string;
  displayName?: string;
}) {
  await ExternalAccountLink.findOneAndUpdate(
    { platform: 'discord', externalUserId: input.discordUserId },
    {
      linkId: `LNK-${uuidv4().slice(0, 12).toUpperCase()}`,
      platform: 'discord',
      externalUserId: input.discordUserId,
      gulfosUserId: new Types.ObjectId(input.gulfosUserId),
      linkedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  const doc = await DiscordLink.findOneAndUpdate(
    { gulfosUserId: new Types.ObjectId(input.gulfosUserId) },
    {
      linkId: linkId(),
      gulfosUserId: new Types.ObjectId(input.gulfosUserId),
      discordUserId: input.discordUserId,
      dmChannelId: input.dmChannelId,
      displayName: input.displayName,
      notificationsEnabled: true,
      dmAvailable: Boolean(input.dmChannelId),
      linkedAt: new Date(),
      unlinkedAt: null,
    },
    { upsert: true, new: true }
  );

  return formatLink(doc);
}

export async function unlinkDiscordAccount(gulfosUserId: string) {
  const doc = await DiscordLink.findOne({ gulfosUserId: new Types.ObjectId(gulfosUserId) });
  if (!doc) return null;
  doc.notificationsEnabled = false;
  doc.unlinkedAt = new Date();
  await doc.save();
  return formatLink(doc);
}

export async function getDiscordLink(gulfosUserId: string) {
  const doc = await DiscordLink.findOne({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    unlinkedAt: null,
  });
  return doc ? formatLink(doc) : null;
}

export async function getPreferences(gulfosUserId: string, externalCharacterId: string) {
  let doc = await DiscordNotificationPreferences.findOne({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    externalCharacterId,
  });

  if (!doc) {
    doc = await DiscordNotificationPreferences.create({
      prefId: prefId(),
      gulfosUserId: new Types.ObjectId(gulfosUserId),
      externalCharacterId,
      categories: { ...DISCORD_CATEGORY_DEFAULTS },
    });
  }

  return formatPrefs(doc);
}

export async function updatePreferences(
  gulfosUserId: string,
  externalCharacterId: string,
  updates: {
    discordEnabled?: boolean;
    categories?: Partial<Record<DiscordNotificationCategory, boolean>>;
    quietHours?: Partial<IQuietHours>;
  }
) {
  const doc = await DiscordNotificationPreferences.findOne({
    gulfosUserId: new Types.ObjectId(gulfosUserId),
    externalCharacterId,
  });

  const mergedCategories = {
    ...DISCORD_CATEGORY_DEFAULTS,
    ...(doc?.categories ?? {}),
    ...(updates.categories ?? {}),
  };

  const updated = await DiscordNotificationPreferences.findOneAndUpdate(
    { gulfosUserId: new Types.ObjectId(gulfosUserId), externalCharacterId },
    {
      $set: {
        ...(updates.discordEnabled !== undefined ? { discordEnabled: updates.discordEnabled } : {}),
        categories: mergedCategories,
        ...(updates.quietHours ? { quietHours: { ...(doc?.quietHours ?? {}), ...updates.quietHours } } : {}),
      },
      $setOnInsert: {
        prefId: prefId(),
        gulfosUserId: new Types.ObjectId(gulfosUserId),
        externalCharacterId,
      },
    },
    { upsert: true, new: true }
  );

  return formatPrefs(updated!);
}

function formatLink(doc: InstanceType<typeof DiscordLink>) {
  return {
    linkId: doc.linkId,
    gulfosUserId: doc.gulfosUserId.toString(),
    discordUserId: doc.discordUserId,
    dmChannelId: doc.dmChannelId,
    notificationsEnabled: doc.notificationsEnabled,
    dmAvailable: doc.dmAvailable,
    displayName: doc.displayName,
    linkedAt: doc.linkedAt,
  };
}

function formatPrefs(doc: InstanceType<typeof DiscordNotificationPreferences>) {
  return {
    prefId: doc.prefId,
    gulfosUserId: doc.gulfosUserId.toString(),
    externalCharacterId: doc.externalCharacterId,
    discordEnabled: doc.discordEnabled,
    categories: { ...DISCORD_CATEGORY_DEFAULTS, ...doc.categories },
    quietHours: doc.quietHours,
  };
}
