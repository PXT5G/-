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
    console.log(`[api] MDT Discord API listening on http://127.0.0.1:${config.api.port}`);
    console.log('[api] MDT Web: set DISCORD_BOT_API_URL=http://127.0.0.1:' + config.api.port);
    console.log('[api] FiveM: set mdt_api_url and mdt_api_secret convars');
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
