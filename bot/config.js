const path = require('path');
// Load environment variables (supports Hostinger dashboard, root .env, and local bot/.env)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  ganatubeUrl: process.env.GANATUBE_URL || 'https://ganatube.in',
  colors: {
    primary: 0xa855f7,   // Signature AMOLED Purple
    accent: 0xec4899,    // Signature AMOLED Pink
    dark: 0x0a0a0f,      // AMOLED Card
    success: 0x10b981,   // Emerald Green
    error: 0xef4444,     // Red
    warning: 0xf59e0b    // Gold
  },
  emojis: {
    headphones: '🎧',
    music: '🎵',
    fire: '🔥',
    sparkles: '✨',
    wave: '👋',
    pin: '📌',
    link: '🔗',
    play: '▶️',
    heart: '❤️',
    star: '⭐',
    check: '✅',
    cross: '❌',
    shield: '🛡️',
    stats: '📊'
  },
  autoRole: 'Listener',
  antiInvite: true
};
