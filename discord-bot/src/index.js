import { Client, GatewayIntentBits } from 'discord.js';
import { config, isDiscordEnabled } from './config.js';
import { createApiApp } from './api/server.js';
import { registerSlashCommands, bindDiscordEvents } from './bot/discord-client.js';

async function main() {
  let discordClient = null;

  if (isDiscordEnabled()) {
    discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
    bindDiscordEvents(discordClient);
    await discordClient.login(config.discord.token);
    await registerSlashCommands(discordClient);
  } else {
    console.warn('[discord] DISCORD_BOT_TOKEN not set — API only mode');
  }

  const app = createApiApp(discordClient);
  app.listen(config.api.port, () => {
    console.log(`[api] PlayStation MDT API → http://127.0.0.1:${config.api.port}`);
    console.log('[api] اربط mdt/.env.local فقط — FiveM لا يستخدم هذا البوت');
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
