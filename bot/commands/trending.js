const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const https = require('https');

// Helper to fetch JSON from API
function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trending')
    .setDescription('🔥 View top trending songs on GanaTube right now'),

  async execute(interaction) {
    await interaction.deferReply();

    // Fallback curated trending list in case API is cold
    let songs = [
      { title: 'Aayi Nai (Stree 2)', artist: 'Pawan Singh, Simran Choudhary', videoId: 'eN9zM3mYg98' },
      { title: 'Tauba Tauba', artist: 'Karan Aujla', videoId: 'LK7-_dgAVQE' },
      { title: 'Sajni (Laapataa Ladies)', artist: 'Arijit Singh', videoId: 'k3g_WjLCsXM' },
      { title: 'Winning Speech', artist: 'Karan Aujla', videoId: 'tO4_4vK2E78' },
      { title: 'Soulmate', artist: 'Badshah, Arijit Singh', videoId: 'e82b7N1jN64' }
    ];

    try {
      // Try to fetch live curated songs from ManageAds API
      const apiRes = await fetchJson('https://manageads.ganatube.in/managegt-api.php?action=app_init');
      if (apiRes && apiRes.trending && Array.isArray(apiRes.trending) && apiRes.trending.length > 0) {
        songs = apiRes.trending.slice(0, 5).map(s => ({
          title: s.title || s.name,
          artist: s.artist || s.channelTitle || 'Artist',
          videoId: s.videoId || s.id
        }));
      }
    } catch (e) {
      // Use fallback
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle('🔥 Trending Music on GanaTube')
      .setDescription('Here are the hottest tracks streaming right now on **GanaTube**:')
      .setFooter({ text: 'Tune in live • Ad-Free Background Play', iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    songs.forEach((s, idx) => {
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
      const medal = medals[idx] || '🎵';
      const link = s.videoId ? `[Play on GanaTube](${config.ganatubeUrl}/play?v=${s.videoId})` : `[Listen](${config.ganatubeUrl})`;
      embed.addFields({
        name: `${medal} ${s.title}`,
        value: `👤 *${s.artist}* • 🔗 ${link}`,
        inline: false
      });
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🚀 Open Trending Feed')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.ganatubeUrl}/home`)
        .setEmoji('🔥'),
      new ButtonBuilder()
        .setLabel('🎧 Start a Listening Room')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.ganatubeUrl}/rooms`)
        .setEmoji('👥')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
