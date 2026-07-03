import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { config, isDiscordEnabled } from '../config.js';
import { searchCitizens, getIncidents, getWarrants } from '../store/json-store.js';
import { runCustomHook } from '../integrate/hooks.js';

export async function registerSlashCommands(client) {
  if (!config.discord.guildId) return;

  const commands = [
    new SlashCommandBuilder()
      .setName('mdt')
      .setDescription('فتح رابط MDT أو حالة النظام'),
    new SlashCommandBuilder()
      .setName('search')
      .setDescription('بحث مواطن في MDT')
      .addStringOption((o) => o.setName('query').setDescription('الاسم أو الهوية').setRequired(true)),
    new SlashCommandBuilder()
      .setName('warrants')
      .setDescription('عرض مذكرات التوقيف النشطة'),
    new SlashCommandBuilder()
      .setName('dispatch')
      .setDescription('البلاغات النشطة'),
  ].map((c) => c.toJSON());

  const rest = new REST().setToken(config.discord.token);
  const route = config.discord.guildId
    ? Routes.applicationGuildCommands(client.user.id, config.discord.guildId)
    : Routes.applicationCommands(client.user.id);
  await rest.put(route, { body: commands });

  console.log('[discord] Slash commands registered');
}

export function bindDiscordEvents(client) {
  client.once('ready', async () => {
    console.log(`[discord] Logged in as ${client.user.tag}`);
    await runCustomHook('onReady', { client });
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    await runCustomHook('onInteraction', { interaction, client });

    if (interaction.commandName === 'search') {
      const q = interaction.options.getString('query', true);
      const results = searchCitizens(q);
      const text = results.length
        ? results.map((c) => `**${c.fullName}** — ${c.nationalId} — ${c.phone}`).join('\n')
        : 'لا توجد نتائج';
      return interaction.reply({ content: text.slice(0, 1900), ephemeral: true });
    }

    if (interaction.commandName === 'warrants') {
      const list = getWarrants().map((w) => `• ${w.targetName} (${w.issueDate})`).join('\n') || 'لا توجد مذكرات';
      return interaction.reply({ content: list, ephemeral: true });
    }

    if (interaction.commandName === 'dispatch') {
      const list = getIncidents().map((i) => `**${i.callNumber}** — ${i.location}`).join('\n') || 'لا بلاغات';
      return interaction.reply({ content: list, ephemeral: true });
    }

    if (interaction.commandName === 'mdt') {
      return interaction.reply({
        content: 'افتح MDT من اللعبة: `/mdt` أو F5 — أو من الويب إن كان مفعّلاً.',
        ephemeral: true,
      });
    }
  });
}
