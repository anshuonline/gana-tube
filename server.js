require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const YTMusic = require('ytmusic-api');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const app = express();
app.use(compression()); // Enable gzip compression for all responses
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;


const userDevices = new Map(); // email -> [{socketId, deviceId, deviceName, isMobile, isActive}]

// Listening Rooms State (In-Memory)
const rooms = new Map(); // roomId -> RoomData object
const socketToRoom = new Map(); // socketId -> roomId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // --- Listening Rooms cleanup ---
    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        // Remove disconnected member
        room.members = room.members.filter(m => m.socketId !== socket.id);
        room.listenerCount = room.members.length;

        if (room.members.length === 0) {
          // No one left — destroy room
          rooms.delete(roomId);
          console.log(`Room ${roomId} destroyed (empty)`);
        } else if (room.adminUid === socket.id) {
          // Admin disconnected but others remain — transfer admin to next member
          const newAdmin = room.members[0];
          newAdmin.isAdmin = true;
          room.adminUid = newAdmin.socketId;
          room.adminFirebaseUid = newAdmin.uid;
          room.adminName = newAdmin.displayName;
          // Mark old admin
          // (already removed from members array above)
          io.to(roomId).emit('room:admin_changed', { newAdminUid: newAdmin.socketId, members: room.members });
          io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
          console.log(`Room ${roomId}: admin transferred to ${newAdmin.displayName}`);
        } else {
          // Regular member left
          io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
        }
      }
      socketToRoom.delete(socket.id);
    }

    // --- Device Sync cleanup ---
    for (const [email, devices] of userDevices.entries()) {
      const idx = devices.findIndex(d => d.socketId === socket.id);
      if (idx !== -1) {
        devices.splice(idx, 1);
        if (devices.length === 0) {
          userDevices.delete(email);
        } else {
          io.to(`user_sync_${email}`).emit('available_devices', devices);
        }
      }
    }
  });

  // --- Device Sync (Spotify Connect Style) ---
  socket.on('join_device_sync', ({ email, deviceId, deviceName, isMobile }) => {
    if (!email) return;
    const room = `user_sync_${email}`;
    socket.join(room);
    
    if (!userDevices.has(email)) {
      userDevices.set(email, []);
    }
    
    const devices = userDevices.get(email);
    // Remove existing with same deviceId to prevent duplicates
    const existingIdx = devices.findIndex(d => d.deviceId === deviceId);
    if (existingIdx !== -1) devices.splice(existingIdx, 1);
    
    devices.push({ socketId: socket.id, deviceId, deviceName, isMobile, isActive: false });
    
    io.to(room).emit('available_devices', devices);
  });
  
  socket.on('device_state_update', ({ email, deviceId, state }) => {
    if (!email) return;
    socket.to(`user_sync_${email}`).emit('remote_state_update', { deviceId, state });
  });

  socket.on('takeover_device', ({ email, fromDeviceId, toDeviceId }) => {
    if (!email) return;
    const devices = userDevices.get(email);
    if (devices) {
      devices.forEach(d => d.isActive = (d.deviceId === toDeviceId));
      io.to(`user_sync_${email}`).emit('available_devices', devices);
    }
    socket.to(`user_sync_${email}`).emit('takeover_requested', { fromDeviceId, toDeviceId });
  });

  // --- Listening Rooms Events ---
  socket.on('room:create', ({ name, isPublic, adminUser }) => {
    const roomId = nanoid(6).toUpperCase();
    
    const room = {
      roomId,
      name: name.substring(0, 40),
      isPublic,
      // Room code = roomId itself. For private rooms, users enter this code to join.
      joinCode: roomId,
      adminUid: socket.id,
      adminFirebaseUid: adminUser.uid, // Firebase UID for reconnection
      adminName: adminUser.displayName || 'Host',
      members: [{
        socketId: socket.id,
        uid: adminUser.uid,
        displayName: adminUser.displayName || 'Host',
        photoURL: adminUser.photoURL,
        isAdmin: true
      }],
      currentTrack: null,
      queue: [],
      currentTime: 0,
      isPlaying: false,
      chat: [],
      listenerCount: 1
    };
    
    rooms.set(roomId, room);
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room:state', room);
  });

  socket.on('room:join', ({ roomId, joinCode, user }) => {
    // Try to find room by roomId directly, or search by joinCode
    let room = rooms.get(roomId);
    if (!room) {
      // Maybe user entered room code — search all rooms
      for (const [rid, r] of rooms.entries()) {
        if (r.joinCode === roomId || r.roomId === roomId) {
          room = r;
          roomId = rid;
          break;
        }
      }
    }
    if (!room) {
      return socket.emit('room:error', 'Room not found');
    }
    
    // For private rooms, the joinCode must match (joinCode = roomId)
    if (!room.isPublic) {
      const codeToCheck = joinCode || roomId;
      if (room.joinCode !== codeToCheck) {
        return socket.emit('room:error', 'Invalid room code');
      }
    }
    
    if (room.members.length >= 50) {
      return socket.emit('room:error', 'Room is full (50/50)');
    }
    
    // Check if this user is reconnecting (same Firebase UID)
    const existingIdx = room.members.findIndex(m => m.uid === user.uid);
    if (existingIdx !== -1) {
      // Reconnecting user — update their socket ID
      const existingMember = room.members[existingIdx];
      const oldSocketId = existingMember.socketId;
      existingMember.socketId = socket.id;
      
      // If this was the admin reconnecting, restore admin status
      if (room.adminFirebaseUid === user.uid) {
        existingMember.isAdmin = true;
        room.adminUid = socket.id;
        room.adminName = existingMember.displayName;
        // Remove admin from any other member who got it temporarily
        room.members.forEach(m => {
          if (m.uid !== user.uid) m.isAdmin = false;
        });
      }
      
      // Clean up old mapping
      socketToRoom.delete(oldSocketId);
    } else {
      // New member joining
      const newMember = {
        socketId: socket.id,
        uid: user.uid,
        displayName: user.displayName || 'Listener',
        photoURL: user.photoURL,
        isAdmin: false
      };
      room.members.push(newMember);
      room.listenerCount = room.members.length;
    }
    
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room:state', room);
    io.to(roomId).emit('room:member_joined', { members: room.members, listenerCount: room.listenerCount });
  });

  socket.on('room:leave', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (room) {
      room.members = room.members.filter(m => m.socketId !== socket.id);
      room.listenerCount = room.members.length;
      
      if (room.members.length === 0) {
        // No one left — destroy room
        io.to(roomId).emit('room:closed');
        io.socketsLeave(roomId);
        rooms.delete(roomId);
        console.log(`Room ${roomId} destroyed (admin left, no members)`);
      } else if (room.adminUid === socket.id) {
        // Admin explicitly left but others remain — transfer admin
        const newAdmin = room.members[0];
        newAdmin.isAdmin = true;
        room.adminUid = newAdmin.socketId;
        room.adminFirebaseUid = newAdmin.uid;
        room.adminName = newAdmin.displayName;
        
        socket.leave(roomId);
        io.to(roomId).emit('room:admin_changed', { newAdminUid: newAdmin.socketId, members: room.members });
        io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
        console.log(`Room ${roomId}: admin left, transferred to ${newAdmin.displayName}`);
      } else {
        // Regular member left
        socket.leave(roomId);
        io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
      }
    }
    socketToRoom.delete(socket.id);
  });

  socket.on('room:transfer_admin', ({ targetSocketId }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    const targetMember = room.members.find(m => m.socketId === targetSocketId);
    if (targetMember) {
      // old admin
      const currentAdmin = room.members.find(m => m.socketId === socket.id);
      if (currentAdmin) currentAdmin.isAdmin = false;
      
      // new admin
      targetMember.isAdmin = true;
      room.adminUid = targetSocketId;
      room.adminFirebaseUid = targetMember.uid;
      room.adminName = targetMember.displayName;
      
      io.to(roomId).emit('room:admin_changed', { newAdminUid: targetSocketId, members: room.members });
    }
  });

  // Kick a member (admin only)
  socket.on('room:kick_member', ({ targetSocketId }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    // Can't kick yourself
    if (targetSocketId === socket.id) return;
    
    const targetMember = room.members.find(m => m.socketId === targetSocketId);
    if (!targetMember) return;
    
    // Remove from room
    room.members = room.members.filter(m => m.socketId !== targetSocketId);
    room.listenerCount = room.members.length;
    
    // Notify the kicked user
    io.to(targetSocketId).emit('room:kicked', { reason: 'You were removed from the room by the host' });
    
    // Remove from socket room
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) targetSocket.leave(roomId);
    socketToRoom.delete(targetSocketId);
    
    // Notify remaining members
    io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
    console.log(`Room ${roomId}: ${targetMember.displayName} was kicked by admin`);
  });

  socket.on('room:toggle_visibility', () => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    room.isPublic = !room.isPublic;
    io.to(roomId).emit('room:state', room);
  });

  socket.on('room:play_track', ({ track }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    room.currentTrack = track;
    room.currentTime = 0;
    room.isPlaying = true;
    io.to(roomId).emit('room:track_changed', { track });
  });

  socket.on('room:playback_sync', ({ isPlaying, currentTime }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    room.isPlaying = isPlaying;
    room.currentTime = currentTime;
    // Broadcast to everyone else
    socket.to(roomId).emit('room:playback_sync', { isPlaying, currentTime });
  });

  socket.on('room:queue_updated', ({ queue }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    room.queue = queue;
    io.to(roomId).emit('room:queue_updated', { queue });
  });

  socket.on('room:chat_message', ({ type, content, track, senderUid, senderName }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    
    const msg = {
      id: nanoid(),
      senderUid,
      senderName,
      type,
      content,
      track,
      timestamp: Date.now()
    };
    
    // keep last 100 msgs max in memory to prevent leak
    if (room.chat.length > 100) room.chat.shift();
    room.chat.push(msg);
    
    io.to(roomId).emit('room:chat_new', msg);
  });

  socket.on('room:discover', () => {
    const publicRooms = Array.from(rooms.values())
      .filter(r => r.isPublic)
      .map(r => ({
        roomId: r.roomId,
        name: r.name,
        adminName: r.adminName,
        currentTrack: r.currentTrack,
        listenerCount: r.listenerCount,
        isPublic: r.isPublic
      }));
    socket.emit('room:discover_results', publicRooms);
  });
});

app.use(cors());
app.use(express.json());

let ytmusicInstance = null;

// Initialize YTMusic instance once
async function getYTMusic() {
  if (!ytmusicInstance) {
    console.log('Initializing YTMusic...');
    const ytmusic = new YTMusic();
    await ytmusic.initialize();
    ytmusicInstance = ytmusic;
    console.log('YTMusic initialized successfully!');
  }
  return ytmusicInstance;
}

// ─── Smart Query Enhancement ────────────────────────────────────────────────
// ytmusic-api's search is biased toward the server's regional language (Hindi).
// We detect the user's intent and reinforce the query so results stay on-topic.

const ENGLISH_TRIGGERS = [
  'english', 'pop', 'rock', 'rap', 'hip hop', 'hiphop', 'r&b', 'rnb',
  'jazz', 'country', 'blues', 'metal', 'indie', 'edm', 'dance',
  'taylor swift', 'ed sheeran', 'dua lipa', 'weeknd', 'drake', 'eminem',
  'billie eilish', 'ariana grande', 'bruno mars', 'adele', 'coldplay',
  'imagine dragons', 'post malone', 'the beatles', 'michael jackson'
];

const HINDI_TRIGGERS = [
  'hindi', 'bollywood', 'arijit', 'atif', 'kumar sanu', 'lata mangeshkar',
  'kishore kumar', 'sonu nigam', 'shreya ghoshal', 'neha kakkar', 'badshah',
  'udit narayan', 'asha bhosle', 'rafi', 'mukesh', 'armaan malik'
];

function enhanceQuery(rawQuery) {
  const q = rawQuery.toLowerCase().trim();

  const isEnglish = ENGLISH_TRIGGERS.some(t => q.includes(t));
  const isHindi   = HINDI_TRIGGERS.some(t => q.includes(t));

  // If the user's query clearly points to English content, append
  // a strong English-language signal that YTMusic understands.
  if (isEnglish && !isHindi) {
    // Don't double-add the word if already present
    if (!q.includes('english')) {
      return `${rawQuery} english`;
    }
    return rawQuery;
  }

  // Hindi / Bollywood — keep as-is; the API already defaults well for these
  return rawQuery;
}
// ────────────────────────────────────────────────────────────────────────────

const trendingCache = {};

app.get('/api/trending', async (req, res) => {
  const lang = req.query.lang || 'Hindi';
  const limit = parseInt(req.query.limit) || 12;
  const cacheKey = lang.toLowerCase();

  // 1 hour cache (3600000 ms)
  if (trendingCache[cacheKey] && (Date.now() - trendingCache[cacheKey].timestamp < 3600000)) {
    let results = [...trendingCache[cacheKey].results];
    // Shuffle the cached results so it looks different on refresh
    results = results.sort(() => 0.5 - Math.random());
    return res.json(results.slice(0, limit));
  }

  try {
    const yt = await getYTMusic();
    const query = `Trending ${lang} Songs`;
    let results = await yt.searchSongs(query);
    
    // Helper to upgrade YouTube Music / Video thumbnails to high resolution (HD)
    const toHDUrl = (url) => {
      if (!url) return '';
      if (url.includes('img.youtube.com')) {
        return url.replace('/default.jpg', '/hqdefault.jpg');
      }
      return url
        .replace(/=w\d+-h\d+/, '=w600-h600')
        .replace(/-w\d+-h\d+/, '-w600-h600')
        .replace(/\/s\d+-/, '/s600-');
    };

    const mappedResults = results.map(item => {
      const artistName = item.artist && typeof item.artist === 'object' 
        ? item.artist.name 
        : (typeof item.artist === 'string' ? item.artist : 'Unknown Artist');
        
      const videoId = item.videoId || item.albumId || item.playlistId;

      let thumbnailLow = item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[0].url
        : `https://img.youtube.com/vi/${videoId}/default.jpg`;

      let thumbnailHigh = item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[item.thumbnails.length - 1].url
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId: videoId,
        title: item.name || item.title,
        channelTitle: artistName,
        thumbnail: toHDUrl(thumbnailLow),
        thumbnailHigh: toHDUrl(thumbnailHigh),
        duration: item.duration,
        publishedAt: new Date().toISOString(),
        type: 'song'
      };
    });

    trendingCache[cacheKey] = {
      timestamp: Date.now(),
      results: mappedResults
    };

    let shuffled = [...mappedResults].sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, limit));
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({ error: 'Failed to fetch trending songs' });
  }
});

// Search endpoint
app.get('/api/songs', async (req, res) => {
  const rawQuery = req.query.q;
  if (!rawQuery) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  const query = enhanceQuery(rawQuery);   // ← apply smart enhancement

  try {
    const yt = await getYTMusic();
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type || 'song';
    console.log(`Searching ${type}s: "${rawQuery}" → enhanced: "${query}" (limit: ${limit})`);
    
    let results = [];
    if (type === 'album') {
      results = await yt.searchAlbums(query);
    } else if (type === 'playlist') {
      results = await yt.searchPlaylists(query);
    } else {
      results = await yt.searchSongs(query);
    }
    
    // Always enforce the limit, whether it is 1 or 50.
    if (results && results.length > limit) {
      results = results.slice(0, limit);
    }

    // Helper to upgrade YouTube Music / Video thumbnails to high resolution (HD)
    const toHDUrl = (url) => {
      if (!url) return '';
      if (url.includes('img.youtube.com')) {
        return url.replace('/default.jpg', '/hqdefault.jpg');
      }
      // Replace dynamic sizing parameters in Google UserContent URLs (album art) to 600x600 for sharp HD
      return url
        .replace(/=w\d+-h\d+/, '=w600-h600')
        .replace(/-w\d+-h\d+/, '-w600-h600')
        .replace(/\/s\d+-/, '/s600-');
    };

    // Map to standard YouTubeSearchResult format expected by Angular frontend
    const mappedResults = results.map(item => {
      const artistName = item.artist && typeof item.artist === 'object' 
        ? item.artist.name 
        : (typeof item.artist === 'string' ? item.artist : 'Unknown Artist');
        
      const videoId = item.videoId || item.albumId || item.playlistId;

      let thumbnailLow = item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[0].url
        : `https://img.youtube.com/vi/${videoId}/default.jpg`;

      let thumbnailHigh = item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[item.thumbnails.length - 1].url
        : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId: videoId,
        title: item.name || item.title,
        channelTitle: artistName,
        thumbnail: toHDUrl(thumbnailLow),
        thumbnailHigh: toHDUrl(thumbnailHigh),
        duration: item.duration,
        publishedAt: new Date().toISOString(),
        type: type // return the requested type to help frontend routing
      };
    });

    res.json(mappedResults);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'An error occurred during search' });
  }
});

// Album details endpoint
app.get('/api/album', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const yt = await getYTMusic();
    const album = await yt.getAlbum(id);
    
    // getAlbum returns metadata but 0 songs, so use playlistId with getPlaylistVideos
    let songs = [];
    const albumPlaylistId = album.playlistId;
    if (albumPlaylistId) {
      try {
        const videos = await yt.getPlaylistVideos(albumPlaylistId);
        songs = (videos || []).map(song => ({
          videoId: song.videoId,
          title: song.name || song.title,
          channelTitle: (song.artist && song.artist.name) || (album.artist && album.artist.name) || 'Unknown Artist',
          thumbnail: song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg` : 
                     (song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''),
          thumbnailHigh: song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 
                        (song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[song.thumbnails.length - 1].url : ''),
          duration: song.duration,
          publishedAt: album.year ? `${album.year}-01-01T00:00:00Z` : new Date().toISOString()
        }));
      } catch (e) {
        console.warn('getPlaylistVideos failed for album, falling back:', e.message);
      }
    }
    
    // If getPlaylistVideos failed, try mapping from album.songs (may still be 0)
    if (songs.length === 0 && album.songs && album.songs.length > 0) {
      songs = album.songs.map(song => ({
        videoId: song.videoId,
        title: song.name || song.title,
        channelTitle: (song.artist && song.artist.name) || (album.artist && album.artist.name) || 'Unknown Artist',
        thumbnail: song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg` : 
                   (song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : ''),
        thumbnailHigh: song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 
                      (song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[song.thumbnails.length - 1].url : ''),
        publishedAt: album.year ? `${album.year}-01-01T00:00:00Z` : new Date().toISOString()
      }));
    }
    
    res.json({
      id: album.albumId || id,
      title: album.name || album.title,
      creator: (album.artist && album.artist.name) || (typeof album.artist === 'string' ? album.artist : 'YouTube Music'),
      coverImage: album.thumbnails && album.thumbnails.length > 0 ? album.thumbnails[album.thumbnails.length - 1].url : '',
      searchQueries: [],
      preloadedSongs: songs
    });
  } catch (error) {
    console.error('Error fetching album:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// Playlist details endpoint
app.get('/api/playlist', async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const yt = await getYTMusic();
    let playlistId = id;
    if (playlistId.startsWith('VL')) {
      playlistId = playlistId.substring(2);
    }
    
    // Get playlist metadata
    const playlist = await yt.getPlaylist(playlistId);
    
    // getPlaylist returns metadata but 0 tracks, use getPlaylistVideos for actual songs
    let songs = [];
    try {
      const videos = await yt.getPlaylistVideos(playlistId);
      songs = (videos || []).map(song => ({
        videoId: song.videoId,
        title: song.name || song.title,
        channelTitle: (song.artist && song.artist.name) || (typeof song.artist === 'string' ? song.artist : 'Unknown Artist'),
        thumbnail: song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '',
        thumbnailHigh: song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[song.thumbnails.length - 1].url : '',
        duration: song.duration,
        publishedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('getPlaylistVideos failed, trying getPlaylist tracks:', e.message);
      // Fallback to whatever getPlaylist returned (likely 0 but try anyway)
      songs = (playlist.videos || playlist.songs || playlist.tracks || []).map(song => ({
        videoId: song.videoId,
        title: song.name || song.title,
        channelTitle: (song.artist && song.artist.name) || 'Unknown Artist',
        thumbnail: song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[0].url : '',
        thumbnailHigh: song.thumbnails && song.thumbnails.length > 0 ? song.thumbnails[song.thumbnails.length - 1].url : '',
        publishedAt: new Date().toISOString()
      }));
    }
    
    res.json({
      id: playlist.playlistId || id,
      title: playlist.name || playlist.title,
      creator: (playlist.author && playlist.author.name) || (playlist.artist && playlist.artist.name) || (typeof playlist.author === 'string' ? playlist.author : 'YouTube Music'),
      coverImage: playlist.thumbnails && playlist.thumbnails.length > 0 ? playlist.thumbnails[playlist.thumbnails.length - 1].url : '',
      searchQueries: [],
      preloadedSongs: songs
    });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

// Suggestions endpoint
app.get('/api/autocomplete', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const yt = await getYTMusic();
    const suggestions = await yt.getSearchSuggestions(query);
    res.json(suggestions);
  } catch (error) {
    console.error('Error during suggestions fetch:', error);
    res.status(500).json({ error: 'An error occurred during fetching suggestions' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', ytmusicInitialized: !!ytmusicInstance });
});

// Config endpoint for frontend environment variables
app.get('/api/config', (req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    }
  });
});

// Lyrics endpoint
app.get('/api/lyrics', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) {
    return res.status(400).json({ error: 'Query parameter "videoId" is required' });
  }

  try {
    const yt = await getYTMusic();
    const lyrics = await yt.getLyrics(videoId);
    res.json({ lyrics });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({ error: 'An error occurred during fetching lyrics' });
  }
});

// Synced Lyrics endpoint via LRCLIB
app.get('/api/synced-lyrics', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`LRCLIB returned ${response.status}`);
    }
    const data = await response.json();
    
    // Find the first result with synced lyrics, or just the first result
    if (data && data.length > 0) {
      const bestMatch = data.find(item => item.syncedLyrics) || data[0];
      return res.json(bestMatch);
    }
    
    res.json(null);
  } catch (error) {
    console.error('Error fetching synced lyrics:', error);
    res.status(500).json({ error: 'An error occurred during fetching synced lyrics' });
  }
});



// Proxy for YouTube Data API Search Fallback
app.get('/api/yt-search', async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'YOUTUBE_API_KEY missing in backend' });

  try {
    const params = new URLSearchParams({
      part: req.query.part || 'snippet',
      q: req.query.q || '',
      type: req.query.type || 'video',
      videoCategoryId: req.query.videoCategoryId || '10',
      maxResults: req.query.maxResults || '20',
      key: apiKey
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching yt-search:', error);
    res.status(500).json({ error: 'Failed to fetch from YouTube Search API' });
  }
});

// Proxy for YouTube Data API Videos details
app.get('/api/yt-videos', async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const ids = (req.query.id || '').split(',').filter(Boolean);
  
  if (!apiKey) {
    try {
      const yt = await getYTMusic();
      const results = await Promise.all(ids.map(async (id) => {
        try {
          const song = await yt.getSong(id);
          if (!song) return null;
          return {
            id: song.videoId,
            snippet: {
              title: song.name,
              channelTitle: song.artist?.name || 'Unknown Artist',
              publishedAt: new Date().toISOString(),
              thumbnails: {
                medium: { url: `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg` },
                maxres: { url: `https://img.youtube.com/vi/${song.videoId}/maxresdefault.jpg` },
                standard: { url: `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg` },
                high: { url: `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg` }
              }
            },
            contentDetails: {
              duration: `PT${song.duration}S`
            }
          };
        } catch (e) {
          return null;
        }
      }));
      return res.json({ items: results.filter(Boolean) });
    } catch(e) {
      console.error('Error in fallback yt-videos:', e);
      return res.status(500).json({ error: 'Failed to fetch from fallback YT API' });
    }
  }

  try {
    const params = new URLSearchParams({
      part: req.query.part || 'snippet,contentDetails',
      id: req.query.id || '',
      key: apiKey
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params.toString()}`);
    if (!response.ok) throw new Error(`YouTube API returned ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching yt-videos:', error);
    res.status(500).json({ error: 'Failed to fetch from YouTube Videos API' });
  }
});

// Redirect share.php requests to the PHP backend so the script executes correctly
app.get('/share.php', (req, res) => {
  res.redirect(301, 'https://manageads.ganatube.in' + req.originalUrl);
});

// Serve Angular static frontend files from 'browser' folder
app.use(express.static(path.join(__dirname, 'dist', 'ganatube', 'browser')));

// Route all other requests to Angular's index.html (SPA routing fallback)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'ganatube', 'browser', 'index.html'));
});

// Start server
server.listen(PORT, async () => {
  console.log(`GanaTube Backend Server listening at http://localhost:${PORT}`);
  try {
    await getYTMusic();
  } catch (err) {
    console.error('Failed to pre-initialize YTMusic:', err);
  }
});
