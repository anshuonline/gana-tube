const { Events } = require('discord.js');
const tempVoiceManager = require('../tempVoiceManager');

module.exports = {
  name: Events.VoiceStateUpdate,
  execute(oldState, newState) {
    try {
      tempVoiceManager.handleVoiceStateUpdate(oldState, newState);
    } catch (err) {
      console.error('[GanaTube Bot] Error in voiceStateUpdate:', err);
    }
  }
};
