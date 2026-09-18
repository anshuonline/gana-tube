const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const { Innertube } = require('youtubei.js');

let youtube = null;
async function getYouTube() {
  if (!youtube) {
    youtube = await Innertube.create();
  }
  return youtube;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔎 Search any song on GanaTube and play it instantly ad-free')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song title, artist, or lyrics')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    await interaction.deferReply();

    try {
      const yt = await getYouTube();
      const results = await yt.search(query, { type: 'video' });
      const first = results.videos && results.videos.length > 0 ? results.videos[0] : null;

      if (!first) {
        return interaction.editReply({
          content: `❌ No songs found for **"${query}"**. Try searching with another name or artist.`
        });
      }

      const videoId = first.id;
      const title = first.title?.text || first.title || query;
      const author = first.author?.name || 'Artist';
      const duration = first.duration?.text || '3:30';
      const thumb = first.thumbnails?.[0]?.url || 'https://ganatube.in/assets/icons/icon-512x512.png';
      const playUrl = `${config.ganatubeUrl}/play?v=${videoId}`;

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`🎵 ${title}`)
        .setDescription(
          `**Artist / Channel:** ${author}\n` +
          `**Duration:** \`${duration}\`\n\n` +
          `Enjoy ad-free background streaming on GanaTube!`
        )
        .setThumbnail(thumb)
        .addFields(
          { name: '⚡ Stream Quality', value: 'Instant Buffer (Low/Standard)', inline: true },
          { name: '🚫 Advertisements', value: '100% Ad-Free', inline: true }
        )
        .setFooter({ text: 'GanaTube Music • Search & Stream', iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('▶️ Play on GanaTube')
          .setStyle(ButtonStyle.Link)
          .setURL(playUrl),
        new ButtonBuilder()
          .setLabel('🎧 Start Room with this Song')
          .setStyle(ButtonStyle.Link)
          .setURL(`${config.ganatubeUrl}/rooms`)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error('Search command error:', err);
      // Fallback response with direct GanaTube search URL
      const searchUrl = `${config.ganatubeUrl}/search?q=${encodeURIComponent(query)}`;
      const fallbackEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`🔎 Search for "${query}" on GanaTube`)
        .setDescription(`Click below to search and stream "${query}" instantly on GanaTube.`)
        .setFooter({ text: 'GanaTube Music' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('▶️ Open Search in GanaTube')
          .setStyle(ButtonStyle.Link)
          .setURL(searchUrl)
      );

      await interaction.editReply({ embeds: [fallbackEmbed], components: [row] });
    }
  }
};
