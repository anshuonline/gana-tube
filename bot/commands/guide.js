const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../config');

// Helper to create topic-specific embeds
function getGuideEmbed(topic, clientUser) {
  const avatar = clientUser?.displayAvatarURL() || '';

  if (topic === 'rooms') {
    return new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle('🎧 Listen Together (Music Rooms) — In-Depth Guide')
      .setDescription(
        'GanaTube **Listen Together** allows you and your friends to stream music in total synchronization from anywhere in the world!'
      )
      .addFields(
        {
          name: '1️⃣ Creating a Room',
          value:
            '• Run `/room [name]` right here in Discord (or click **Create Room** on [ganatube.in/rooms](https://ganatube.in/rooms)).\n' +
            '• Discord-created rooms are **Private & Unlisted** by default — only users with the room link or 6-character code can enter!',
          inline: false
        },
        {
          name: '2️⃣ Host (DJ) Master Controls',
          value:
            '• **Play / Pause / Seek**: Host has exclusive scrubbing control. Whenever the host pauses or seeks, everyone syncs instantly.\n' +
            '• **Queue Control**: Add songs, reorder tracks, skip to next, or remove tracks from the playlist.\n' +
            '• **Manage Song Requests**: Listeners can submit song requests; the Host reviews and accepts them with one click.',
          inline: false
        },
        {
          name: '3️⃣ Listener Experience',
          value:
            '• **Zero-Drift Audio Sync**: Listeners are synced down to the millisecond with the Host audio stream.\n' +
            '• **Live Chat & Reactions**: Chat in real-time with everyone in the room while vibing to the beat.\n' +
            '• **Request Songs**: Search any track directly in the room search tab and hit "Request Song".',
          inline: false
        },
        {
          name: '4️⃣ 24/7 Radio & Bot Rooms',
          value:
            '• Public 24/7 curated rooms are always online on the website:\n' +
            '  🔥 *Trending Hindi Hits* • 🎵 *Punjabi Beats* • 🌍 *Global Pop* • ☕ *Lofi Chill*',
          inline: false
        }
      )
      .setFooter({ text: 'GanaTube Guide • Listen Together', iconURL: avatar })
      .setTimestamp();
  }

  if (topic === 'commands') {
    return new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🤖 GanaTube Discord Bot — Complete Command Manual')
      .setDescription('Here is the complete manual of all slash commands available in this server:')
      .addFields(
        {
          name: '🎧 `/room [name]`',
          value:
            '**Description**: Create a private Listen Together room with real-time audio sync.\n' +
            '**Parameters**: `name` *(Optional)* — Custom title for your party room.\n' +
            '**Example**: `/room Late Night Punjabi Vibes`',
          inline: false
        },
        {
          name: '🔎 `/search <query>`',
          value:
            '**Description**: Search any song, artist, or album directly from YouTube Music.\n' +
            '**Parameters**: `query` *(Required)* — Song title, artist name, or lyrics snippet.\n' +
            '**Example**: `/search Arijit Singh Kesariya`',
          inline: false
        },
        {
          name: '🔥 `/trending`',
          value:
            '**Description**: Displays the top trending music tracks currently hot on GanaTube.\n' +
            '**Example**: `/trending`',
          inline: false
        },
        {
          name: '📊 `/stats`',
          value:
            '**Description**: View live platform performance, bot latency, uptime, and server statistics.\n' +
            '**Example**: `/stats`',
          inline: false
        },
        {
          name: '💡 `/suggest <idea>`',
          value:
            '**Description**: Submit feature ideas, suggestions, or bug reports directly to developers.\n' +
            '**Parameters**: `idea` *(Required)* — Your detailed suggestion.',
          inline: false
        },
        {
          name: '📖 `/guide [topic]`',
          value:
            '**Description**: Interactive full-featured guide explaining all features of GanaTube.\n' +
            '**Parameters**: `topic` *(Optional)* — `general`, `rooms`, `commands`, `admin`, `streaming`.',
          inline: false
        },
        {
          name: '❓ `/help`',
          value:
            '**Description**: Quick reference card for all active commands.',
          inline: false
        }
      )
      .setFooter({ text: 'GanaTube Guide • Commands Manual', iconURL: avatar })
      .setTimestamp();
  }

  if (topic === 'admin') {
    return new EmbedBuilder()
      .setColor(0xf59e0b) // Gold
      .setTitle('👑 Administrator & Server Setup Manual')
      .setDescription(
        'Configure channels, repair permissions, and manage GanaTube Bot settings. *(Administrator Only)*'
      )
      .addFields(
        {
          name: '⚙️ `/setchannel <type> <#channel>`',
          value:
            'Bind specific server channels for bot activities so messages never get sent to the wrong place:\n' +
            '• `welcome`: Sets channel for greeting new members (e.g. `#welcome`).\n' +
            '• `room`: Sets channel for Listen Together party alerts (e.g. `#share-your-fav-songs`).\n' +
            '• `suggestions`: Sets channel where `/suggest` ideas are posted (e.g. `#feedback`).\n' +
            '• `logs`: Sets channel for moderation and bot logs (e.g. `#bot-logs`).\n' +
            '• `view`: Review currently active channel configurations.\n' +
            '• `reset`: Revert channel binding back to automatic detection.',
          inline: false
        },
        {
          name: '🛠️ `/fixperms`',
          value:
            '**One-Click Channel Permission Repair**:\n' +
            '• Automatically grants `UseApplicationCommands` and `EmbedLinks` to the `@Members` role in community channels.\n' +
            '• Ensures the GanaTube Bot has full text & embed permissions across all channels.\n' +
            '• Keeps private staff channels completely hidden from normal members.',
          inline: false
        },
        {
          name: '🚀 `/setup`',
          value:
            '**Automated Server Layout Generator**:\n' +
            'Creates 6 standard categories (`INFORMATION`, `GANATUBE`, `COMMUNITY`, `SUPPORT`, `VOICE`, `STAFF`) with role permissions and binds defaults automatically.',
          inline: false
        },
        {
          name: '🛡️ Automated Moderation',
          value:
            '• **Anti-Invite Shield**: Automatically deletes unauthorized Discord invite links posted in public chats (Staff bypass enabled).\n' +
            '• **Auto-Role**: Automatically assigns the `Listener` or `Members` role to joining users.',
          inline: false
        }
      )
      .setFooter({ text: 'GanaTube Guide • Administrator Guide', iconURL: avatar })
      .setTimestamp();
  }

  if (topic === 'streaming') {
    return new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('⚡ Audio Streaming & Player Features')
      .setDescription(
        'Learn about GanaTube’s music engine, player shortcuts, and audio quality capabilities.'
      )
      .addFields(
        {
          name: '🚫 100% Ad-Free Background Streaming',
          value:
            '• GanaTube completely filters out mid-roll video advertisements and interruptions.\n' +
            '• Seamless background streaming on mobile (Android / iOS) even when minimizing the browser.',
          inline: false
        },
        {
          name: '🎤 Real-Time Synced Lyrics',
          value:
            '• Sing along with live scrolling karaoke lyrics powered by LRCLIB.\n' +
            '• Click the **Lyrics** button in the full-screen player to view timestamped lines.',
          inline: false
        },
        {
          name: '📱 Progressive Web App (PWA)',
          value:
            '• Install GanaTube as a native app on Windows, macOS, Android, or iPhone!\n' +
            '• Tap **"Install App"** in your browser menu for a standalone full-screen player experience.',
          inline: false
        },
        {
          name: '⌨️ Desktop Keyboard Shortcuts',
          value:
            '• `Spacebar` — Play / Pause\n' +
            '• `Right / Left Arrow` — Seek Forward / Backward 5 seconds\n' +
            '• `M` — Mute / Unmute Volume\n' +
            '• `F` — Toggle Full-Screen Immersive Player',
          inline: false
        }
      )
      .setFooter({ text: 'GanaTube Guide • Streaming Engine', iconURL: avatar })
      .setTimestamp();
  }

  // Default: General Overview
  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('📖 GanaTube — The Ultimate Music Platform Guide')
    .setDescription(
      `Welcome to **GanaTube**! Stream unlimited music with **Zero Ads**, explore millions of tracks, and vibe with friends in synced **Listen Together** rooms.\n\n` +
      `Use the dropdown menu below to explore detailed walkthroughs for each feature:`
    )
    .addFields(
      {
        name: '🎧 Listen Together Rooms',
        value: 'Create or join private synchronized music rooms with friends. Full DJ queue control & song requests.',
        inline: true
      },
      {
        name: '🤖 Discord Bot Integration',
        value: 'Create rooms directly with `/room`, search tracks with `/search`, and check trending beats.',
        inline: true
      },
      {
        name: '⚡ Ad-Free Streaming',
        value: 'Enjoy clean background music playback, high definition audio, and real-time scrolling lyrics.',
        inline: true
      },
      {
        name: '🚀 Quick Start (In 3 Steps):',
        value:
          '1. **Start Listening**: Head over to [ganatube.in](https://ganatube.in) and hit Play on any track.\n' +
          '2. **Host a Party**: Type `/room` in any Discord channel to generate your private party link.\n' +
          '3. **Vibe Together**: Share the link with friends to enjoy synced audio playback and live chat!',
        inline: false
      }
    )
    .setFooter({ text: 'Select a topic below to read the in-depth guide', iconURL: avatar })
    .setTimestamp();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('📖 In-depth comprehensive guide for GanaTube, Listen Together rooms, and bot features')
    .addStringOption(option =>
      option
        .setName('topic')
        .setDescription('Select a specific topic to view its detailed guide directly')
        .setRequired(false)
        .addChoices(
          { name: '📖 General Overview & Quick Start', value: 'general' },
          { name: '🎧 Listen Together (Music Rooms)', value: 'rooms' },
          { name: '🤖 Bot Commands Manual', value: 'commands' },
          { name: '⚡ Audio Streaming & Player Features', value: 'streaming' },
          { name: '👑 Administrator & Server Setup', value: 'admin' }
        )
    ),

  async execute(interaction) {
    const selectedTopic = interaction.options.getString('topic') || 'general';
    const embed = getGuideEmbed(selectedTopic, interaction.client.user);

    // Dropdown Select Menu
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('guide_select_topic')
      .setPlaceholder('📑 Choose a topic to read detailed guide...')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('General Overview & Quick Start')
          .setDescription('Learn what GanaTube is and how to get started in 3 steps')
          .setValue('general')
          .setEmoji('📖')
          .setDefault(selectedTopic === 'general'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Listen Together (Rooms)')
          .setDescription('How rooms work, DJ controls, listeners, audio sync, and requests')
          .setValue('rooms')
          .setEmoji('🎧')
          .setDefault(selectedTopic === 'rooms'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Bot Commands Manual')
          .setDescription('Full documentation and examples for every slash command')
          .setValue('commands')
          .setEmoji('🤖')
          .setDefault(selectedTopic === 'commands'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Audio Streaming & Features')
          .setDescription('Ad-free engine, scrolling lyrics, shortcuts, and PWA mobile app')
          .setValue('streaming')
          .setEmoji('⚡')
          .setDefault(selectedTopic === 'streaming'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Administrator & Server Setup')
          .setDescription('How to use /setchannel, /fixperms, and /setup (Admin Only)')
          .setValue('admin')
          .setEmoji('👑')
          .setDefault(selectedTopic === 'admin')
      );

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    // Quick Action Buttons
    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Open GanaTube')
        .setStyle(ButtonStyle.Link)
        .setURL(config.ganatubeUrl),
      new ButtonBuilder()
        .setLabel('🎧 Listen Together Rooms')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.ganatubeUrl}/rooms`),
      new ButtonBuilder()
        .setLabel('🔥 Trending Beats')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.ganatubeUrl}`)
    );

    const response = await interaction.reply({
      embeds: [embed],
      components: [rowSelect, rowButtons]
    });

    // Interactive Collector for Select Menu (active for 5 minutes)
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000 // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '⚠️ This guide session was opened by someone else. Type `/guide` to open your own interactive menu!',
          ephemeral: true
        });
      }

      const choice = i.values[0];
      const newEmbed = getGuideEmbed(choice, interaction.client.user);

      // Update options with active selection marked default
      const updatedSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('guide_select_topic')
        .setPlaceholder('📑 Choose a topic to read detailed guide...')
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel('General Overview & Quick Start')
            .setDescription('Learn what GanaTube is and how to get started in 3 steps')
            .setValue('general')
            .setEmoji('📖')
            .setDefault(choice === 'general'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Listen Together (Rooms)')
            .setDescription('How rooms work, DJ controls, listeners, audio sync, and requests')
            .setValue('rooms')
            .setEmoji('🎧')
            .setDefault(choice === 'rooms'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Bot Commands Manual')
            .setDescription('Full documentation and examples for every slash command')
            .setValue('commands')
            .setEmoji('🤖')
            .setDefault(choice === 'commands'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Audio Streaming & Features')
            .setDescription('Ad-free engine, scrolling lyrics, shortcuts, and PWA mobile app')
            .setValue('streaming')
            .setEmoji('⚡')
            .setDefault(choice === 'streaming'),
          new StringSelectMenuOptionBuilder()
            .setLabel('Administrator & Server Setup')
            .setDescription('How to use /setchannel, /fixperms, and /setup (Admin Only)')
            .setValue('admin')
            .setEmoji('👑')
            .setDefault(choice === 'admin')
        );

      const updatedRow = new ActionRowBuilder().addComponents(updatedSelectMenu);

      await i.update({
        embeds: [newEmbed],
        components: [updatedRow, rowButtons]
      });
    });

    collector.on('end', async () => {
      try {
        const disabledSelectMenu = StringSelectMenuBuilder.from(selectMenu).setDisabled(true);
        const disabledRow = new ActionRowBuilder().addComponents(disabledSelectMenu);
        await interaction.editReply({ components: [disabledRow, rowButtons] });
      } catch (e) {
        // Message might have been deleted
      }
    });
  }
};
