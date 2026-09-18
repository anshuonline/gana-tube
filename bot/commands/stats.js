const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('📊 View live GanaTube server & community statistics'),

  async execute(interaction) {
    const guild = interaction.guild;
    const memberCount = guild ? guild.memberCount : 0;
    const ping = interaction.client.ws.ping;
    const uptime = Math.floor(process.uptime());
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📊 GanaTube Live Platform Statistics')
      .setDescription('Real-time health and community overview of GanaTube ecosystem.')
      .addFields(
        { name: '👥 Community Members', value: `\`${memberCount}\` listeners`, inline: true },
        { name: '⚡ Bot Latency', value: `\`${ping}ms\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${hours}h ${minutes}m\``, inline: true },
        { name: '🎵 Audio Streaming', value: '🟢 Operational (Ad-Free)', inline: true },
        { name: '🎧 Listen Together', value: '🟢 Real-time Rooms Live', inline: true },
        { name: '🌐 Web Platform', value: `[ganatube.in](${config.ganatubeUrl})`, inline: true }
      )
      .setFooter({ text: 'GanaTube Music • 24/7 High Speed Streaming', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Visit GanaTube')
        .setStyle(ButtonStyle.Link)
        .setURL(config.ganatubeUrl)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
