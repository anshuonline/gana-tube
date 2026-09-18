# 🎧 GanaTube Official Discord Bot

A feature-rich, high-performance Discord bot directly integrated with GanaTube Music.

## 🚀 Features

* **`/room [name]`** — Generate instant GanaTube **Listen Together** real-time rooms with custom invite links.
* **`/search <query>`** — Search any song or artist on YouTube and get an ad-free direct play link on GanaTube.
* **`/trending`** — View the top 5 trending songs on GanaTube.
* **`/stats`** — Real-time server and platform health monitor.
* **`/suggest <idea>`** — Community feedback and feature suggestion pipeline.
* **`/help`** — Interactive command guide.
* **Auto-Welcome** — AMOLED welcome card for new members.
* **Auto-Moderation** — Anti-invite link spam protection.
* **Health Check Server** — Embedded Express server on port 3005 for 24/7 keep-alive pings on Hostinger.

## ⚙️ Hostinger Configuration

Add the following under **Environment Variables** in Hostinger Node.js Dashboard (or in `.env`):

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
GANATUBE_URL=https://ganatube.in
BOT_PORT=3005
```

## 🛠️ Standalone Run

```bash
node bot/index.js
```

Or it runs automatically whenever GanaTube's `server.js` starts!
