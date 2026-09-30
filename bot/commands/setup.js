const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Creates standard GanaTube channels and categories with permissions.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const everyoneRole = guild.roles.everyone;

    try {
      // Create Categories
      const infoCategory = await guild.channels.create({ name: '📢 INFORMATION', type: ChannelType.GuildCategory });
      const ganatubeCategory = await guild.channels.create({ name: '🎵 GANATUBE', type: ChannelType.GuildCategory });
      const communityCategory = await guild.channels.create({ name: '💬 COMMUNITY', type: ChannelType.GuildCategory });
      const supportCategory = await guild.channels.create({ name: '🆘 SUPPORT & FEEDBACK', type: ChannelType.GuildCategory });
      const voiceCategory = await guild.channels.create({ name: '🔊 VOICE CHANNELS', type: ChannelType.GuildCategory });
      const staffCategory = await guild.channels.create({ name: '🛡️ STAFF ONLY', type: ChannelType.GuildCategory });

      // 📢 INFORMATION (Admin only send)
      const readOnlyPerms = [
        {
          id: everyoneRole.id,
          allow: [PermissionFlagsBits.ViewChannel],
          deny: [PermissionFlagsBits.SendMessages]
        }
      ];
      await guild.channels.create({ name: 'announcements', type: ChannelType.GuildText, parent: infoCategory.id, permissionOverwrites: readOnlyPerms });
      await guild.channels.create({ name: 'rules', type: ChannelType.GuildText, parent: infoCategory.id, permissionOverwrites: readOnlyPerms });
      await guild.channels.create({ name: 'welcome', type: ChannelType.GuildText, parent: infoCategory.id, permissionOverwrites: readOnlyPerms });

      // 🎵 GANATUBE
      await guild.channels.create({ name: 'share-your-fav-songs', type: ChannelType.GuildText, parent: ganatubeCategory.id });
      await guild.channels.create({ name: 'playlist-exchange', type: ChannelType.GuildText, parent: ganatubeCategory.id });
      await guild.channels.create({ name: 'find-listen-buddies', type: ChannelType.GuildText, parent: ganatubeCategory.id });
      await guild.channels.create({ name: 'music-discussions', type: ChannelType.GuildText, parent: ganatubeCategory.id });

      // 💬 COMMUNITY
      await guild.channels.create({ name: 'general-chat', type: ChannelType.GuildText, parent: communityCategory.id });
      await guild.channels.create({ name: 'introductions', type: ChannelType.GuildText, parent: communityCategory.id });
      await guild.channels.create({ name: 'memes', type: ChannelType.GuildText, parent: communityCategory.id });
      await guild.channels.create({ name: 'bot-commands', type: ChannelType.GuildText, parent: communityCategory.id });

      // 🆘 SUPPORT & FEEDBACK (Everyone can send)
      await guild.channels.create({ name: 'support', type: ChannelType.GuildText, parent: supportCategory.id });
      await guild.channels.create({ name: 'tech-support', type: ChannelType.GuildText, parent: supportCategory.id });
      await guild.channels.create({ name: 'feedback', type: ChannelType.GuildText, parent: supportCategory.id });
      await guild.channels.create({ name: 'bug-reports', type: ChannelType.GuildText, parent: supportCategory.id });
      await guild.channels.create({ name: 'feature-requests', type: ChannelType.GuildText, parent: supportCategory.id });

      // 🔊 VOICE CHANNELS
      await guild.channels.create({ name: 'General Voice', type: ChannelType.GuildVoice, parent: voiceCategory.id });
      await guild.channels.create({ name: 'Listen Together 1', type: ChannelType.GuildVoice, parent: voiceCategory.id });
      await guild.channels.create({ name: 'Listen Together 2', type: ChannelType.GuildVoice, parent: voiceCategory.id });
      await guild.channels.create({ name: 'Music Lounge', type: ChannelType.GuildVoice, parent: voiceCategory.id });

      // 🛡️ STAFF ONLY (Hidden from everyone)
      const hiddenPerms = [
        {
          id: everyoneRole.id,
          deny: [PermissionFlagsBits.ViewChannel]
        }
      ];
      await guild.channels.create({ name: 'admin-chat', type: ChannelType.GuildText, parent: staffCategory.id, permissionOverwrites: hiddenPerms });
      await guild.channels.create({ name: 'bot-logs', type: ChannelType.GuildText, parent: staffCategory.id, permissionOverwrites: hiddenPerms });
      await guild.channels.create({ name: 'moderator-only', type: ChannelType.GuildText, parent: staffCategory.id, permissionOverwrites: hiddenPerms });

      await interaction.editReply('✅ GanaTube Server channels have been successfully set up! Around 22 channels created with proper permissions.');
    } catch (error) {
      console.error('Setup command error:', error);
      await interaction.editReply('❌ Failed to set up channels. Make sure I have `Manage Channels` and `Administrator` permissions, and my role is high enough.');
    }
  }
};
