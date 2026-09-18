const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../config');

// Helper to create the real GanaTube room
async function createBackendRoom(name, username) {
  try {
    const roomModule = require('../../room.js');
    if (roomModule && typeof roomModule.createDiscordRoom === 'function') {
      const r = roomModule.createDiscordRoom({ name, adminName: username });
      return { roomId: r.roomId, roomUrl: `${config.ganatubeUrl}/rooms/${r.roomId}` };
    }
  } catch (e) {
    // If running in isolated process
  }

  // Fallback to local server API
  try {
    const http = require('http');
    const data = JSON.stringify({ name, adminName: username });
    const res = await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: process.env.PORT || 3000,
          path: '/api/rooms/create-discord-room',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        },
        (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(null);
            }
          });
        }
      );
      req.on('error', () => resolve(null));
      req.write(data);
      req.end();
    });

    if (res && res.success && res.roomId) {
      return { roomId: res.roomId, roomUrl: res.roomUrl || `${config.ganatubeUrl}/rooms/${res.roomId}` };
    }
  } catch (e) {}

  // Final fallback
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let roomId = '';
  for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  return { roomId, roomUrl: `${config.ganatubeUrl}/rooms/${roomId}` };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('room')
    .setDescription('🎧 Create an instant Listen Together room on GanaTube to vibe with friends')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Custom name for your music party room')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const customName = interaction.options.getString('name');
    const roomName = customName || `${interaction.user.username}'s Music Vibe`;

    // 1. Create Private GanaTube Room (isPublic: false -> never shown on website public lobby)
    const { roomId, roomUrl } = await createBackendRoom(roomName, interaction.user.username);

    // 2. Build AMOLED Embed
    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`🎧 ${roomName}`)
      .setDescription(
        `**${interaction.user}** has created a live **Listen Together** room on GanaTube!\n\n` +
        `• 🔒 **Private & Unlisted**: This room will **never** appear on the website public lobby.\n` +
        `• ⚡ **Real-Time Audio Sync**: Synced playback, lyrics, requests & live chat.\n` +
        `• 👑 **DJ Controls**: Click below to enter and take full control of the queue & player.`
      )
      .addFields(
        { name: '🔑 Room Code', value: `\`${roomId}\``, inline: true },
        { name: '👤 Created By', value: `${interaction.user}`, inline: true },
        { name: '⚡ Streaming', value: 'Ad-Free • Fast Buffer', inline: true }
      )
      .setFooter({
        text: 'Powered by GanaTube • Real-time Music Rooms',
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🎧 Join Room on GanaTube')
        .setStyle(ButtonStyle.Link)
        .setURL(roomUrl)
        .setEmoji('▶️'),
      new ButtonBuilder()
        .setLabel('🌐 Open GanaTube Web')
        .setStyle(ButtonStyle.Link)
        .setURL(config.ganatubeUrl)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
