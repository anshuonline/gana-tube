const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('./config');

function createBotClient(usePrivileged = true) {
  const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ];

  if (usePrivileged) {
    intents.push(
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildPresences
    );
  }

  const client = new Client({ intents });
  client.commands = new Collection();

  // Load Commands
  const commandsPath = path.join(__dirname, 'commands');
  if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
      }
    }
  }

  // Load Events
  const eventsPath = path.join(__dirname, 'events');
  if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
      const event = require(path.join(eventsPath, file));
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
    }
  }

  return client;
}

// ── Lightweight Health Server for Hostinger Keep-Alive ──
const botApp = express();
const BOT_PORT = process.env.BOT_PORT || 3005;
let currentClient = null;

botApp.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: currentClient && currentClient.user ? currentClient.user.tag : 'Connecting...',
    uptime: Math.floor(process.uptime()),
    ping: currentClient && currentClient.ws ? currentClient.ws.ping : -1,
    service: 'GanaTube Discord Bot',
    url: config.ganatubeUrl
  });
});

let serverInstance = null;

function startBot() {
  if (!config.token) {
    console.error('[GanaTube Bot] DISCORD_BOT_TOKEN is missing! Please configure it.');
    return;
  }

  if (!serverInstance) {
    try {
      serverInstance = botApp.listen(BOT_PORT, () => {
        console.log(`[GanaTube Bot] Health monitor active at http://localhost:${BOT_PORT}`);
      });
    } catch (e) {
      console.warn(`[GanaTube Bot] Port ${BOT_PORT} warning:`, e.message);
    }
  }

  // Attempt to start with full intents; if disallowed in Developer Portal, fallback to standard
  currentClient = createBotClient(true);

  currentClient.login(config.token).catch(err => {
    if (err.message && err.message.includes('disallowed intents')) {
      console.warn('[GanaTube Bot] Privileged Gateway Intents not enabled in Discord Developer Portal. Falling back to Standard Gateway Intents...');
      currentClient.destroy();
      currentClient = createBotClient(false);
      currentClient.login(config.token).catch(fallbackErr => {
        console.error('[GanaTube Bot] Fallback login failed:', fallbackErr.message);
      });
    } else {
      console.error('[GanaTube Bot] Login failed:', err.message);
    }
  });
}

if (require.main === module) {
  startBot();
}

module.exports = {
  startBot,
  get client() { return currentClient; }
};
