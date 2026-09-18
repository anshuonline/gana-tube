const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    console.log(`[GanaTube Bot] New member joined: ${member.user.tag}`);

    // ── Auto-assign Role ──
    if (config.autoRole) {
      try {
        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() === config.autoRole.toLowerCase());
        if (role) {
          await member.roles.add(role);
          console.log(`[GanaTube Bot] Assigned "${role.name}" role to ${member.user.tag}`);
        }
      } catch (err) {
        console.warn(`[GanaTube Bot] Could not auto-assign role to ${member.user.tag}:`, err.message);
      }
    }

    // ── Find Welcome Channel ──
    const welcomeChannel =
      member.guild.systemChannel ||
      member.guild.channels.cache.find(c =>
        c.isTextBased() && (c.name.includes('welcome') || c.name.includes('general') || c.name.includes('lounge') || c.name.includes('chat'))
      );

    if (!welcomeChannel) return;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`👋 Welcome to GanaTube Community, ${member.user.username}!`)
      .setDescription(
        `Hey ${member}, welcome to the official home of **GanaTube**! 🎵✨\n\n` +
        `• 🎧 **Listen Together**: Join or create 24/7 synced music rooms.\n` +
        `• 🔥 **Trending Tracks**: Discover hot Bollywood, Punjabi & Indie songs.\n` +
        `• ⚡ **Ad-Free Experience**: Background music streaming without interruptions.\n\n` +
        `Head over to <#rules> to get verified and use \`/room\` to vibe with us!`
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👥 Member #', value: `\`#${member.guild.memberCount}\``, inline: true },
        { name: '🎵 Streaming URL', value: `[ganatube.in](${config.ganatubeUrl})`, inline: true }
      )
      .setFooter({ text: 'GanaTube Music • Welcome to the Vibe', iconURL: member.guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🎧 Start Listening')
        .setStyle(ButtonStyle.Link)
        .setURL(config.ganatubeUrl),
      new ButtonBuilder()
        .setLabel('👥 Join a Room')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.ganatubeUrl}/rooms`)
    );

    try {
      await welcomeChannel.send({ content: `Welcome ${member}! 🎶`, embeds: [embed], components: [row] });
    } catch (err) {
      console.error('[GanaTube Bot] Failed to send welcome message:', err);
    }
  }
};
