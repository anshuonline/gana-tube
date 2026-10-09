const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setGuildSetting } = require('../utils/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Creates GanaTube channels with advanced role-based permissions (Members role).')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const everyoneRole = guild.roles.everyone;
    const botMember = guild.members.me;

    try {
      // Find or create 'Members' role
      let membersRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'members' || r.name.toLowerCase() === 'member');
      if (!membersRole) {
        membersRole = await guild.roles.create({
          name: 'Members',
          color: '#a855f7', // GanaTube Purple
          reason: 'Auto-created by /setup command for channel permissions'
        });
      }

      // Create Categories
      const infoCategory = await guild.channels.create({ name: '📢 INFORMATION', type: ChannelType.GuildCategory });
      const ganatubeCategory = await guild.channels.create({ name: '🎵 GANATUBE', type: ChannelType.GuildCategory });
      const communityCategory = await guild.channels.create({ name: '💬 COMMUNITY', type: ChannelType.GuildCategory });
      const supportCategory = await guild.channels.create({ name: '🆘 SUPPORT & FEEDBACK', type: ChannelType.GuildCategory });
      const voiceCategory = await guild.channels.create({ name: '🔊 VOICE CHANNELS', type: ChannelType.GuildCategory });
      const staffCategory = await guild.channels.create({ name: '🛡️ STAFF ONLY', type: ChannelType.GuildCategory });

      // Bot Overwrites (Bot needs full text & slash command capabilities in all channels)
      const botTextPerms = {
        id: botMember.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.UseApplicationCommands,
          PermissionFlagsBits.ReadMessageHistory
        ]
      };

      // 📢 INFORMATION (Everyone can view, nobody can send except admins)
      const readOnlyPerms = [
        { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
        { id: membersRole.id, allow: [PermissionFlagsBits.ViewChannel], deny: [PermissionFlagsBits.SendMessages] },
        botTextPerms
      ];
      await guild.channels.create({ name: 'announcements', type: ChannelType.GuildText, parent: infoCategory.id, permissionOverwrites: readOnlyPerms });
      await guild.channels.create({ name: 'rules', type: ChannelType.GuildText, parent: infoCategory.id, permissionOverwrites: readOnlyPerms });
      const welcomeChan = await guild.channels.create({ name: 'welcome', type: ChannelType.GuildText, parent: infoCategory.id, permissionOverwrites: readOnlyPerms });

      // Base permissions for member-only channels (hide from everyone, allow members + bot with slash commands)
      const memberTextPerms = [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: membersRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.UseApplicationCommands
          ]
        },
        botTextPerms
      ];

      // Media permissions (allow attachments)
      const memberMediaPerms = [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: membersRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.UseApplicationCommands,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        botTextPerms
      ];

      // Voice permissions
      const memberVoicePerms = [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: membersRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream] },
        { id: botMember.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] }
      ];

      // 🎵 GANATUBE
      const roomChan = await guild.channels.create({ name: 'share-your-fav-songs', type: ChannelType.GuildText, parent: ganatubeCategory.id, permissionOverwrites: memberMediaPerms });
      await guild.channels.create({ name: 'playlist-exchange', type: ChannelType.GuildText, parent: ganatubeCategory.id, permissionOverwrites: memberMediaPerms });
      await guild.channels.create({ name: 'find-listen-buddies', type: ChannelType.GuildText, parent: ganatubeCategory.id, permissionOverwrites: memberTextPerms });
      await guild.channels.create({ name: 'music-discussions', type: ChannelType.GuildText, parent: ganatubeCategory.id, permissionOverwrites: memberTextPerms });

      // 💬 COMMUNITY
      await guild.channels.create({ name: 'general-chat', type: ChannelType.GuildText, parent: communityCategory.id, permissionOverwrites: memberTextPerms });
      await guild.channels.create({ name: 'introductions', type: ChannelType.GuildText, parent: communityCategory.id, permissionOverwrites: memberTextPerms });
      await guild.channels.create({ name: 'media-and-memes', type: ChannelType.GuildText, parent: communityCategory.id, permissionOverwrites: memberMediaPerms });
      await guild.channels.create({ name: 'bot-commands', type: ChannelType.GuildText, parent: communityCategory.id, permissionOverwrites: memberTextPerms });

      // 🆘 SUPPORT & FEEDBACK
      await guild.channels.create({ name: 'support', type: ChannelType.GuildText, parent: supportCategory.id, permissionOverwrites: memberTextPerms });
      await guild.channels.create({ name: 'tech-support', type: ChannelType.GuildText, parent: supportCategory.id, permissionOverwrites: memberMediaPerms });
      const feedbackChan = await guild.channels.create({ name: 'feedback', type: ChannelType.GuildText, parent: supportCategory.id, permissionOverwrites: memberTextPerms });
      await guild.channels.create({ name: 'bug-reports', type: ChannelType.GuildText, parent: supportCategory.id, permissionOverwrites: memberMediaPerms });

      // 🔊 VOICE CHANNELS
      await guild.channels.create({ name: 'General Voice', type: ChannelType.GuildVoice, parent: voiceCategory.id, permissionOverwrites: memberVoicePerms });
      await guild.channels.create({ name: 'Listen Together 1', type: ChannelType.GuildVoice, parent: voiceCategory.id, permissionOverwrites: memberVoicePerms });
      await guild.channels.create({ name: 'Listen Together 2', type: ChannelType.GuildVoice, parent: voiceCategory.id, permissionOverwrites: memberVoicePerms });
      await guild.channels.create({ name: 'Music Lounge', type: ChannelType.GuildVoice, parent: voiceCategory.id, permissionOverwrites: memberVoicePerms });

      // 🛡️ STAFF ONLY (Hidden from everyone and Members, bot can view)
      const hiddenPerms = [
        { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: membersRole.id, deny: [PermissionFlagsBits.ViewChannel] },
        botTextPerms
      ];
      await guild.channels.create({ name: 'admin-chat', type: ChannelType.GuildText, parent: staffCategory.id, permissionOverwrites: hiddenPerms });
      const logChan = await guild.channels.create({ name: 'bot-logs', type: ChannelType.GuildText, parent: staffCategory.id, permissionOverwrites: hiddenPerms });

      // Auto-save configured channels in settings
      setGuildSetting(guild.id, 'welcomeChannelId', welcomeChan.id);
      setGuildSetting(guild.id, 'roomChannelId', roomChan.id);
      setGuildSetting(guild.id, 'suggestionChannelId', feedbackChan.id);
      setGuildSetting(guild.id, 'logChannelId', logChan.id);

      await interaction.editReply('✅ Advanced Setup Complete! Channels created with full slash command access for Members and bot, and default channels automatically bound to `/setchannel`!');
    } catch (error) {
      console.error('Setup command error:', error);
      await interaction.editReply('❌ Failed to set up channels. Make sure I have `Manage Channels`, `Manage Roles`, and `Administrator` permissions, and my role is at the top.');
    }
  }
};
