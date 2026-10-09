const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 View all GanaTube bot commands and features'),

  async execute(interaction) {
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎧 GanaTube Discord Bot — Command Guide')
      .setDescription(
        `Welcome to **GanaTube**! Stream unlimited music ad-free, create real-time listening rooms, and share your favorite tracks.\n\n` +
        `**Music & Community Commands:**`
      )
      .addFields(
        {
          name: '🎧 `/room [name]`',
          value: 'Create an instant **Listen Together** room on GanaTube. Sync audio with friends in real-time!',
          inline: false
        },
        {
          name: '🔎 `/search <query>`',
          value: 'Search any track, artist, or album and get an instant play link on GanaTube.',
          inline: false
        },
        {
          name: '🔥 `/trending`',
          value: 'View the hottest trending tracks streaming on GanaTube right now.',
          inline: false
        },
        {
          name: '📊 `/stats`',
          value: 'Check live community members, server health, and platform status.',
          inline: false
        },
        {
          name: '💡 `/suggest <idea>`',
          value: 'Submit your feature suggestions or report bugs directly to developers.',
          inline: false
        },
        {
          name: '📖 `/guide [topic]`',
          value: 'Open interactive in-depth guide covering Listen Together rooms, streaming features, and manuals.',
          inline: false
        }
      );

    if (isAdmin) {
      embed.addFields(
        {
          name: '👑 Admin Commands:',
          value:
            '• ⚙️ `/setchannel <welcome|room|suggestions|logs|view|reset>` — Bind specific channels for welcome cards, room broadcasts, etc.\n' +
            '• 🛠️ `/fixperms` — Automatically unlock slash commands & bot access across all text channels.\n' +
            '• 🚀 `/setup` — Auto-create organized categories and channels with role permissions.',
          inline: false
        }
      );
    }

    embed
      .setFooter({ text: 'GanaTube Music • Powered by ganatube.in', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Open GanaTube')
        .setStyle(ButtonStyle.Link)
        .setURL(config.ganatubeUrl),
      new ButtonBuilder()
        .setLabel('🎧 Listen Together')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.ganatubeUrl}/rooms`)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
