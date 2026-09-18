const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');
const tempVoiceManager = require('../tempVoiceManager');

// Helper to create room either directly from room.js or via local/remote API
async function createBackendRoom(name) {
  try {
    const roomModule = require('../../room.js');
    if (roomModule && typeof roomModule.createDiscordRoom === 'function') {
      const r = roomModule.createDiscordRoom({ name });
      return { roomId: r.roomId, roomUrl: `${config.ganatubeUrl}/rooms/${r.roomId}` };
    }
  } catch (e) {
    // If running in isolated worker, try local HTTP
  }

  // Fallback to local server HTTP endpoint
  try {
    const http = require('http');
    const data = JSON.stringify({ name });
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

  // Final fallback (generates random 6-char id)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let roomId = '';
  for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  return { roomId, roomUrl: `${config.ganatubeUrl}/rooms/${roomId}` };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('room')
    .setDescription('🎧 Create a Temp Voice Channel on Discord & Private Synced Room on GanaTube')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Custom name for your music lounge')
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ This command can only be used inside a Discord server!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const customName = interaction.options.getString('name');
    const roomName = customName || `${interaction.user.username}'s Vibe`;
    const guild = interaction.guild;

    // 1. Create Private GanaTube Room (isPublic: false -> never shown on website lobby!)
    const { roomId, roomUrl } = await createBackendRoom(roomName);

    // 2. Create Temporary Voice Channel in Discord
    let voiceChannel = null;
    const canManageChannels = guild.members.me?.permissions.has(PermissionFlagsBits.ManageChannels);

    if (canManageChannels) {
      try {
        // Find existing Category or voice channel parent to nest cleanly
        const parentCategory = interaction.channel?.parent || null;

        voiceChannel = await guild.channels.create({
          name: `🎧・${interaction.user.username}'s Vibe`.substring(0, 32),
          type: ChannelType.GuildVoice,
          parent: parentCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak
              ]
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.PrioritySpeaker,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers
              ]
            },
            {
              id: interaction.client.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ManageChannels
              ]
            }
          ]
        });

        // Register with TempVoiceManager for 5-minute empty auto-cleanup
        tempVoiceManager.registerTempChannel(voiceChannel.id, roomId, guild.id, voiceChannel);
      } catch (voiceErr) {
        console.warn('[GanaTube Bot] Could not create temp voice channel:', voiceErr.message);
      }
    }

    // 3. Build Aesthetic AMOLED Response Embed
    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`🎧 ${roomName}`)
      .setDescription(
        `**${interaction.user}** has opened a private **Listen Together** room!\n\n` +
        `• 🔒 **Private & Unlisted**: This room will **never** appear on the website's public lobby.\n` +
        `• ⚡ **Real-Time Sync**: Synchronized playback, lyrics, requests & chat.\n` +
        `• 👑 **DJ Permissions**: The first listener to enter gets full host playback controls.\n` +
        (voiceChannel ? `• 🔊 **Discord Voice**: Join <#${voiceChannel.id}> to voice chat with listeners!` : '')
      )
      .addFields(
        { name: '🔑 Room Code', value: `\`${roomId}\``, inline: true },
        { name: '👑 Host / DJ', value: `${interaction.user}`, inline: true },
        { name: '⏳ Auto-Cleanup', value: 'Closes if empty for 5m', inline: true }
      )
      .setFooter({
        text: 'GanaTube Music • Temp Voice Lounge & Private Synced Room',
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🎧 Sync on GanaTube')
        .setStyle(ButtonStyle.Link)
        .setURL(roomUrl)
        .setEmoji('▶️'),
      new ButtonBuilder()
        .setLabel('🌐 Open GanaTube Web')
        .setStyle(ButtonStyle.Link)
        .setURL(config.ganatubeUrl)
    );

    let replyContent = voiceChannel ? `🎉 **Temp Voice Channel Ready:** <#${voiceChannel.id}>` : '';
    await interaction.editReply({ content: replyContent, embeds: [embed], components: [row] });
  }
};
