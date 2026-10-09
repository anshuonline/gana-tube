const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType
} = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fixperms')
    .setDescription('🛠️ Automatically fix channel permissions so GanaTube Bot and /room work in all channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ **Access Denied**: You need `Administrator` permission to run `/fixperms`.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const botMember = guild.members.me;

    // Check if bot has Manage Roles/Channels
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels) && !botMember.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({
        content: '❌ **Bot Missing Permissions**: I need `Manage Channels` or `Administrator` permission to update channel overwrites.'
      });
    }

    // Find Members role if exists
    const membersRole = guild.roles.cache.find(r =>
      r.name.toLowerCase() === 'members' || r.name.toLowerCase() === 'member'
    );

    let fixedCount = 0;
    const fixedChannels = [];
    const errors = [];

    const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

    for (const [, channel] of channels) {
      try {
        const isStaffOnly = channel.name.includes('admin') ||
                            channel.name.includes('staff') ||
                            channel.parent?.name?.toLowerCase().includes('staff');

        // Always ensure the BOT itself can view and respond in all text channels
        await channel.permissionOverwrites.edit(botMember.id, {
          ViewChannel: true,
          SendMessages: true,
          EmbedLinks: true,
          AttachFiles: true,
          UseApplicationCommands: true,
          ReadMessageHistory: true
        });

        // For non-staff channels, ensure Members role (and everyone if public) can use slash commands
        if (!isStaffOnly) {
          if (membersRole) {
            await channel.permissionOverwrites.edit(membersRole.id, {
              ViewChannel: true,
              SendMessages: true,
              EmbedLinks: true,
              UseApplicationCommands: true,
              ReadMessageHistory: true
            });
          }
        }

        fixedCount++;
        fixedChannels.push(channel.name);
      } catch (err) {
        errors.push(`${channel.name}: ${err.message}`);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🛠️ Permissions Successfully Fixed!')
      .setDescription(
        `Permissions have been updated across **${fixedCount} text channels**.\n\n` +
        `• ✅ **GanaTube Bot**: Granted full Embed, Message & Slash Command access.\n` +
        `• ✅ **Slash Commands**: \`/room\`, \`/search\`, \`/trending\` are now unlocked in community channels.\n` +
        `• 🔒 **Staff Channels**: Preserved hidden privacy for admin/staff categories.`
      )
      .addFields(
        {
          name: 'Channels Updated',
          value: fixedChannels.slice(0, 15).map(c => `• \`#${c}\``).join('\n') +
                 (fixedChannels.length > 15 ? `\n...and ${fixedChannels.length - 15} more` : ''),
          inline: false
        }
      )
      .setFooter({ text: 'Run /room in any channel to verify!' })
      .setTimestamp();

    if (errors.length > 0) {
      embed.addFields({
        name: '⚠️ Warnings',
        value: errors.slice(0, 3).join('\n')
      });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};
