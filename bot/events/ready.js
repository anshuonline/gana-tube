const { REST, Routes, ActivityType, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[GanaTube Bot] Logged in successfully as ${client.user.tag} (ID: ${client.user.id})`);

    // ── Register Slash Commands ──
    const commands = [];
    const commandsPath = path.join(__dirname, '../commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if (command.data && command.execute) {
        commands.push(command.data.toJSON());
        client.commands.set(command.data.name, command);
      }
    }

    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
      console.log(`[GanaTube Bot] Registering ${commands.length} slash commands...`);

      if (config.guildId) {
        // Clear any global duplicate commands
        await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
        
        // Register exclusively to Guild for instant 1-time display
        await rest.put(
          Routes.applicationGuildCommands(config.clientId, config.guildId),
          { body: commands }
        );
        console.log(`[GanaTube Bot] Successfully registered ${commands.length} commands exclusively to Guild ID: ${config.guildId}`);
      } else {
        await rest.put(
          Routes.applicationCommands(config.clientId),
          { body: commands }
        );
        console.log('[GanaTube Bot] Successfully registered global slash commands.');
      }
    } catch (error) {
      console.error('[GanaTube Bot] Failed to register slash commands:', error);
    }

    // ── Rotating Presence ──
    const activities = [
      { name: 'GanaTube Music 🎧', type: ActivityType.Listening },
      { name: '/room to vibe with friends 👥', type: ActivityType.Playing },
      { name: 'Ad-Free Hindi & Punjabi Beats 🔥', type: ActivityType.Listening },
      { name: 'ganatube.in 🌐', type: ActivityType.Watching }
    ];

    let currentActivity = 0;
    const updatePresence = () => {
      const act = activities[currentActivity];
      client.user.setPresence({
        activities: [{ name: act.name, type: act.type }],
        status: 'online'
      });
      currentActivity = (currentActivity + 1) % activities.length;
    };

    updatePresence();
    setInterval(updatePresence, 30000); // Rotate every 30 seconds
  }
};
