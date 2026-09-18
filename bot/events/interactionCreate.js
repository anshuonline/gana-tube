module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`[GanaTube Bot] No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`[GanaTube Bot] Error executing ${interaction.commandName}:`, error);
      const errPayload = {
        content: '❌ There was an error while executing this command. Please try again later!',
        ephemeral: true
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errPayload);
      } else {
        await interaction.reply(errPayload);
      }
    }
  }
};
