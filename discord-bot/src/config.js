/**
 * إعدادات موحّدة — لا تتعارض مع MDT أو FiveM
 * كل خدمة تقرأ من .env الخاص بها فقط
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_BOT_TOKEN ?? '',
    guildId: process.env.DISCORD_GUILD_ID ?? '',
    logChannelId: process.env.DISCORD_LOG_CHANNEL_ID ?? '',
    mdtRoleId: process.env.DISCORD_MDT_ROLE_ID ?? '',
    exportWebhook: process.env.DISCORD_EXPORT_WEBHOOK_URL ?? '',
  },
  api: {
    port: Number(process.env.API_PORT ?? 3921),
    secret: process.env.API_SECRET ?? 'dev-secret-change-me',
  },
};

export function isDiscordEnabled() {
  return Boolean(config.discord.token);
}
