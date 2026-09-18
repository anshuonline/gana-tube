const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    // ── Anti-Invite Link Protection ──
    if (config.antiInvite) {
      const inviteRegex = /(discord\.(gg|io|me|li)\/.+|discordapp\.com\/invite\/.+|discord\.com\/invite\/.+)/i;
      if (inviteRegex.test(message.content)) {
        // Allow members with Manage Messages or Administrator permission
        const isStaff = message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
                        message.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isStaff) {
          try {
            await message.delete();
            const warnMsg = await message.channel.send({
              content: `⚠️ ${message.author}, posting unauthorized Discord invite links is not permitted here!`
            });
            setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
          } catch (err) {
            console.error('[GanaTube Bot] Failed to delete invite link:', err);
          }
        }
      }
    }
  }
};
