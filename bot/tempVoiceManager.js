const { ChannelType, PermissionFlagsBits } = require('discord.js');
let deleteDiscordRoomFunc = null;

try {
  const roomModule = require('../room.js');
  deleteDiscordRoomFunc = roomModule.deleteDiscordRoom;
} catch (e) {
  // If running independently
}

// Map: channelId -> { roomId, guildId, timeoutId, createdAt }
const activeTempChannels = new Map();

const EMPTY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function registerTempChannel(channelId, roomId, guildId, channel) {
  // Start initial 5-minute countdown (in case creator never joins)
  const timeoutId = setTimeout(() => {
    cleanupChannel(channelId, 'Empty for 5 minutes since creation');
  }, EMPTY_TIMEOUT_MS);

  activeTempChannels.set(channelId, {
    roomId,
    guildId,
    timeoutId,
    createdAt: Date.now()
  });

  console.log(`[TempVoice] Registered temp voice channel ${channelId} (Room: ${roomId}). 5-min timer started.`);
}

async function cleanupChannel(channelId, reason = 'Empty for 5 minutes') {
  const entry = activeTempChannels.get(channelId);
  if (!entry) return;

  if (entry.timeoutId) {
    clearTimeout(entry.timeoutId);
  }

  activeTempChannels.delete(channelId);

  // Clean up GanaTube backend room
  if (entry.roomId && deleteDiscordRoomFunc) {
    deleteDiscordRoomFunc(entry.roomId);
    console.log(`[TempVoice] GanaTube room ${entry.roomId} cleaned up.`);
  }

  // Delete Discord voice channel
  try {
    const { client } = require('./index.js');
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel) {
      await channel.delete(`GanaTube Temp Room: ${reason}`);
      console.log(`[TempVoice] Deleted Discord channel ${channelId}: ${reason}`);
    }
  } catch (err) {
    console.warn(`[TempVoice] Failed to delete channel ${channelId}:`, err.message);
  }
}

function handleVoiceStateUpdate(oldState, newState) {
  const leftChannelId = oldState.channelId;
  const joinedChannelId = newState.channelId;

  // ── Someone JOINED a temp channel ──
  if (joinedChannelId && activeTempChannels.has(joinedChannelId)) {
    const entry = activeTempChannels.get(joinedChannelId);
    if (entry.timeoutId) {
      clearTimeout(entry.timeoutId);
      entry.timeoutId = null;
      console.log(`[TempVoice] User joined temp channel ${joinedChannelId}. 5-minute timer paused.`);
    }
  }

  // ── Someone LEFT a temp channel ──
  if (leftChannelId && activeTempChannels.has(leftChannelId)) {
    const channel = oldState.channel;
    // Check if channel is now completely empty
    if (channel && channel.members.size === 0) {
      const entry = activeTempChannels.get(leftChannelId);
      if (entry && !entry.timeoutId) {
        console.log(`[TempVoice] Temp channel ${leftChannelId} is now empty. Starting 5-minute deletion countdown.`);
        entry.timeoutId = setTimeout(() => {
          cleanupChannel(leftChannelId, 'Empty for 5 minutes');
        }, EMPTY_TIMEOUT_MS);
      }
    }
  }
}

module.exports = {
  registerTempChannel,
  cleanupChannel,
  handleVoiceStateUpdate,
  activeTempChannels
};
