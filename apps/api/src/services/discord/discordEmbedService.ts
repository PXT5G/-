import { v4 as uuidv4 } from 'uuid';
import {
  DISCORD_EMBED_COLORS,
  DISCORD_CATEGORY_BUTTONS,
  DISCORD_CATEGORY_PRIORITY,
  type DiscordNotificationCategory,
  type DiscordEmbedButton,
} from '../../constants/discordNotifications';
import type { NotificationDeliveryContext } from '../../constants/notificationProviders';

export interface DiscordEmbedBuildInput {
  context: NotificationDeliveryContext;
  category: DiscordNotificationCategory;
  characterName: string;
  phoneNumber?: string;
  appName: string;
  sanitizedTitle: string;
  sanitizedBody: string;
  groupedSummary?: { total: number; lines: string[] };
}

function priorityLevel(category: DiscordNotificationCategory, contextPriority: string): keyof typeof DISCORD_EMBED_COLORS {
  if (contextPriority === 'critical' || contextPriority === 'high' || contextPriority === 'low') {
    if (contextPriority === 'critical') return 'critical';
  }
  return DISCORD_CATEGORY_PRIORITY[category] ?? 'normal';
}

function priorityBadge(level: keyof typeof DISCORD_EMBED_COLORS): string {
  const labels = { critical: '🔴 Critical', high: '🟠 High', normal: '🔵 Normal', low: '⚪ Low' };
  return labels[level];
}

function mapButtonStyle(style: DiscordEmbedButton['style']): number {
  const map = { primary: 1, secondary: 2, success: 3, danger: 4 };
  return map[style];
}

function appIconUrl(appId: string, icon?: string): string | undefined {
  if (icon) return icon;
  return `https://cdn.gulfos.app/icons/${appId.replace(/\./g, '/')}.png`;
}

export function buildDiscordEmbed(input: DiscordEmbedBuildInput): Record<string, unknown> {
  const level = priorityLevel(input.category, input.context.priority);
  const color = DISCORD_EMBED_COLORS[level];
  const timestamp = new Date().toISOString();

  if (input.groupedSummary) {
    const description = [
      `**${input.groupedSummary.total} New Notifications**`,
      '',
      ...input.groupedSummary.lines.map((l) => `• ${l}`),
    ].join('\n');

    return {
      content: null,
      embeds: [
        {
          author: {
            name: 'GULFOS Phone',
            icon_url: appIconUrl('com.gulfos.system'),
          },
          title: `${input.groupedSummary.total} New Notifications`,
          description,
          color,
          footer: {
            text: `${input.characterName} • GULFOS Smart Notifications`,
          },
          timestamp,
        },
      ],
    };
  }

  const fields = [
    { name: 'Character', value: input.characterName, inline: true },
    { name: 'Priority', value: priorityBadge(level), inline: true },
  ];

  if (input.phoneNumber) {
    fields.push({ name: 'Phone', value: input.phoneNumber, inline: true });
  }

  const buttons = DISCORD_CATEGORY_BUTTONS[input.category] ?? [];
  const actionRows =
    buttons.length > 0
      ? [
          {
            type: 1,
            components: buttons.map((btn) => ({
              type: 2,
              style: mapButtonStyle(btn.style),
              label: btn.label,
              custom_id: `gulfos:${btn.id}:${input.context.notificationId}`,
            })),
          },
        ]
      : undefined;

  const embed: Record<string, unknown> = {
    author: {
      name: input.appName,
      icon_url: appIconUrl(input.context.appId, input.context.icon),
    },
    title: input.sanitizedTitle,
    description: input.sanitizedBody,
    color,
    fields,
    footer: {
      text: `${input.characterName} • GULFOS`,
    },
    timestamp,
  };

  if (input.context.image) {
    embed.image = { url: input.context.image };
  }
  if (input.context.icon) {
    embed.thumbnail = { url: input.context.icon };
  }

  return {
    content: null,
    embeds: [embed],
    components: actionRows,
    metadata: {
      notificationId: input.context.notificationId,
      queueId: input.context.queueId,
      category: input.category,
      requiresConfirmation: buttons.some((b) => b.requiresConfirmation),
    },
  };
}

export function outboxId(): string {
  return `DCO-${uuidv4().slice(0, 12).toUpperCase()}`;
}

export function batchId(): string {
  return `DCB-${uuidv4().slice(0, 12).toUpperCase()}`;
}

export function resolveAppName(appId: string): string {
  const names: Record<string, string> = {
    'com.gulfos.phone': 'Phone',
    'com.gulfos.messages': 'Messages',
    'com.gulfos.mail': 'Mail',
    'com.gulfos.bank': 'Bank',
    'com.gulfos.identity': 'Identity',
    'com.gulfos.security': 'Security',
    'com.gulfos.findmy': 'Find My',
    'com.gulfos.calendar': 'Calendar',
    'com.gulfos.notes': 'Notes',
    'com.gulfos.system': 'GULFOS',
  };
  return names[appId] ?? appId.split('.').pop() ?? 'GULFOS';
}
