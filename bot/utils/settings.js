const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'guild-settings.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error('[GanaTube Bot] Failed to create data dir:', e.message);
    }
  }
}

// Load all settings
function loadAllSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('[GanaTube Bot] Failed to parse settings file:', e.message);
    return {};
  }
}

// Save all settings
function saveAllSettings(settings) {
  ensureDataDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('[GanaTube Bot] Failed to save settings file:', e.message);
    return false;
  }
}

// Get settings for a specific guild
function getGuildSettings(guildId) {
  if (!guildId) return {};
  const all = loadAllSettings();
  return all[guildId] || {};
}

// Set a specific setting for a guild
function setGuildSetting(guildId, key, value) {
  if (!guildId || !key) return false;
  const all = loadAllSettings();
  if (!all[guildId]) {
    all[guildId] = {};
  }
  all[guildId][key] = value;
  return saveAllSettings(all);
}

// Remove a specific setting for a guild
function removeGuildSetting(guildId, key) {
  if (!guildId || !key) return false;
  const all = loadAllSettings();
  if (all[guildId] && all[guildId][key] !== undefined) {
    delete all[guildId][key];
    return saveAllSettings(all);
  }
  return true;
}

module.exports = {
  getGuildSettings,
  setGuildSetting,
  removeGuildSetting,
  loadAllSettings
};
