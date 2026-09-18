const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('💡 Submit a feature suggestion or report a bug for GanaTube')
    .addStringOption(option =>
      option.setName('idea')
        .setDescription('Your feature idea, suggestion, or feedback for the creators')
        .setRequired(true)
    ),

  async execute(interaction) {
    const idea = interaction.options.getString('idea');
    const user = interaction.user;

    // Try to find a suggestions or feedback channel in the server
    const feedbackChannel = interaction.guild?.channels.cache.find(
      c => c.name.includes('suggest') || c.name.includes('feedback') || c.name.includes('ideas')
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle('💡 New GanaTube Suggestion')
      .setDescription(`>>> ${idea}`)
      .addFields(
        { name: '👤 Submitted By', value: `${user} (\`${user.tag}\`)`, inline: true },
        { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
      )
      .setFooter({ text: 'GanaTube Feedback • Community Driven', iconURL: user.displayAvatarURL() })
      .setTimestamp();

    if (feedbackChannel && feedbackChannel.isTextBased()) {
      try {
        const msg = await feedbackChannel.send({ embeds: [embed] });
        await msg.react('👍');
        await msg.react('👎');
      } catch (e) {
        console.error('Failed to post to feedback channel:', e);
      }
    }

    const replyEmbed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('✅ Suggestion Received!')
      .setDescription(`Thank you **${user.username}**! Your suggestion has been recorded:\n\n* "${idea}" *\n\nThe GanaTube dev team reviews community ideas regularly!`)
      .setFooter({ text: 'GanaTube Music • Community Hub' });

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  }
};
