const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const config = require('../config');
const { getGuildSettings, setGuildSetting, removeGuildSetting } = require('../utils/settings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('⚙️ Configure dedicated channels for Welcome, Rooms, Suggestions, and Logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('welcome')
        .setDescription('Set the channel where new member welcome cards will be sent')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Select the text channel for welcome messages')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('room')
        .setDescription('Set dedicated channel for GanaTube Listen Together rooms & broadcasts')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Select the text channel for music room activity')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('suggestions')
        .setDescription('Set the channel where /suggest feedback will be sent')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Select the text channel for suggestions')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('logs')
        .setDescription('Set the channel for bot alerts and moderation logs')
        .addChannelOption(opt =>
          opt
            .setName('channel')
            .setDescription('Select the text channel for logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('view')
        .setDescription('View current configured channels for GanaTube Bot')
    )
    .addSubcommand(sub =>
      sub
        .setName('reset')
        .setDescription('Reset a channel configuration back to automatic')
        .addStringOption(opt =>
          opt
            .setName('type')
            .setDescription('Which channel configuration to reset')
            .setRequired(true)
            .addChoices(
              { name: 'Welcome Channel', value: 'welcome' },
              { name: 'Room Channel', value: 'room' },
              { name: 'Suggestions Channel', value: 'suggestions' },
              { name: 'Logs Channel', value: 'logs' },
              { name: 'All Channels', value: 'all' }
            )
        )
    ),

  async execute(interaction) {
    // Administrator runtime validation
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ **Access Denied**: You need `Administrator` permission to use `/setchannel`.',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (sub === 'view') {
      const settings = getGuildSettings(guildId);
      const welcome = settings.welcomeChannelId ? `<#${settings.welcomeChannelId}>` : '`Not Set` *(Automatic)*';
      const room = settings.roomChannelId ? `<#${settings.roomChannelId}>` : '`Not Set` *(Any Channel)*';
      const suggestions = settings.suggestionChannelId ? `<#${settings.suggestionChannelId}>` : '`Not Set` *(Automatic)*';
      const logs = settings.logChannelId ? `<#${settings.logChannelId}>` : '`Not Set` *(None)*';

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('⚙️ GanaTube Bot — Configured Channels')
        .setDescription('Here are the currently active channel bindings for this server:')
        .addFields(
          { name: '👋 Welcome Channel', value: welcome, inline: true },
          { name: '🎧 Room Broadcasts', value: room, inline: true },
          { name: '💡 Suggestions Channel', value: suggestions, inline: true },
          { name: '🛡️ Moderation / Logs', value: logs, inline: true }
        )
        .setFooter({ text: 'Use /setchannel <type> <#channel> to update any channel' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'reset') {
      const type = interaction.options.getString('type');
      if (type === 'all') {
        removeGuildSetting(guildId, 'welcomeChannelId');
        removeGuildSetting(guildId, 'roomChannelId');
        removeGuildSetting(guildId, 'suggestionChannelId');
        removeGuildSetting(guildId, 'logChannelId');
      } else if (type === 'welcome') {
        removeGuildSetting(guildId, 'welcomeChannelId');
      } else if (type === 'room') {
        removeGuildSetting(guildId, 'roomChannelId');
      } else if (type === 'suggestions') {
        removeGuildSetting(guildId, 'suggestionChannelId');
      } else if (type === 'logs') {
        removeGuildSetting(guildId, 'logChannelId');
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('🔄 Channel Reset Successful')
        .setDescription(`Channel configuration for **${type}** has been reset back to default.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Setting a channel
    const targetChannel = interaction.options.getChannel('channel');
    if (!targetChannel) {
      return interaction.reply({ content: '❌ Invalid channel provided.', ephemeral: true });
    }

    // Verify bot has permissions in that channel
    const botMember = interaction.guild.members.me;
    const botPerms = targetChannel.permissionsFor(botMember);
    const missingPerms = [];

    if (!botPerms.has(PermissionFlagsBits.ViewChannel)) missingPerms.push('View Channel');
    if (!botPerms.has(PermissionFlagsBits.SendMessages)) missingPerms.push('Send Messages');
    if (!botPerms.has(PermissionFlagsBits.EmbedLinks)) missingPerms.push('Embed Links');

    if (missingPerms.length > 0) {
      return interaction.reply({
        content: `⚠️ **Warning**: I do not have full permissions in ${targetChannel}!\nMissing: \`${missingPerms.join(', ')}\`\nPlease give me these permissions or the bot cannot post there.`,
        ephemeral: true
      });
    }

    let keyName = '';
    let labelName = '';

    if (sub === 'welcome') {
      keyName = 'welcomeChannelId';
      labelName = 'Welcome Channel';
    } else if (sub === 'room') {
      keyName = 'roomChannelId';
      labelName = 'Room Announcements & Broadcasts';
    } else if (sub === 'suggestions') {
      keyName = 'suggestionChannelId';
      labelName = 'Suggestions Channel';
    } else if (sub === 'logs') {
      keyName = 'logChannelId';
      labelName = 'Logs Channel';
    }

    setGuildSetting(guildId, keyName, targetChannel.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Channel Configured Successfully')
      .setDescription(`**${labelName}** has been set to ${targetChannel}.`)
      .addFields(
        { name: 'Channel', value: `${targetChannel} (\`${targetChannel.id}\`)`, inline: true },
        { name: 'Configured By', value: `${interaction.user}`, inline: true }
      )
      .setFooter({ text: 'GanaTube Bot • Administration' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
