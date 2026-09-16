const { nanoid } = require('nanoid');

// --- Storage ---
const rooms = new Map();
const socketToRoom = new Map();
const userMutes = new Map(); // Firebase UID -> { level: number, expiresAt: number, history: { time: number, content: string }[] }
const disconnectTimeouts = new Map();

// --- Room Analytics (lifetime counters, in-memory) ---
const roomStats = {
  totalCreated: 0,   // every room ever created (real + bot) since server start
  dismissed: 0       // rooms closed/destroyed since server start
};

// --- Spam Filter ---
function applySpamMute(uid, socket) {
  let state = userMutes.get(uid);
  if (!state) {
    state = { level: 0, expiresAt: 0, history: [] };
  }
  
  // If expired for more than 24h, reset level
  if (state.expiresAt > 0 && Date.now() > state.expiresAt + 24 * 60 * 60 * 1000) {
    state.level = 0;
  }

  state.level += 1;
  if (state.level > 4) state.level = 4;

  const durations = [0, 2 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000, 24 * 60 * 60 * 1000];
  state.expiresAt = Date.now() + durations[state.level];
  userMutes.set(uid, state);

  // Notify user
  let message = '';
  if (state.level === 1) message = 'Chat Muted for 2 minutes due to excessive messaging.';
  else if (state.level === 2) message = 'Chat Muted for 10 Minutes. Please slow down and avoid flooding.';
  else if (state.level === 3) message = 'Chat Muted for 30 Minutes for continued flooding.';
  else message = 'Chat Restricted. You have reached 4 warnings. Muted for 24 hours in all rooms.';

  socket.emit('room:chat_muted', { message, expiresAt: state.expiresAt });
}

function checkSpam(uid, content, socket) {
  let state = userMutes.get(uid);
  if (!state) {
    state = { level: 0, expiresAt: 0, history: [] };
    userMutes.set(uid, state);
  }

  const now = Date.now();
  
  // Check if currently muted
  if (state.expiresAt > now) {
    const remain = Math.ceil((state.expiresAt - now) / 60000);
    socket.emit('room:chat_muted', { message: `You are muted. Try again in ${remain} minute(s).`, expiresAt: state.expiresAt });
    return true; // Is spam/muted
  }

  // Clean history (last 10s)
  state.history = state.history.filter(m => now - m.time < 10000);
  state.history.push({ time: now, content });

  // Rule 1: > 5 messages in 10s
  if (state.history.length > 5) {
    applySpamMute(uid, socket);
    state.history = [];
    return true;
  }

  // Rule 2: 3 identical messages in a row
  if (state.history.length >= 3) {
    const last3 = state.history.slice(-3).map(m => m.content);
    if (last3[0] === content && last3[1] === content && last3[2] === content) {
      applySpamMute(uid, socket);
      state.history = [];
      return true;
    }
  }

  return false;
}


// --- Event Handlers ---
function setupRoomHandlers(io, socket) {

  socket.on('room:create', ({ name, isPublic, adminUser }) => {
    const roomId = nanoid(6).toUpperCase();
    roomStats.totalCreated++;
    
    const room = {
      roomId,
      name: name.substring(0, 40),
      isPublic,
      joinCode: roomId,
      adminUid: socket.id,
      adminFirebaseUid: adminUser.uid,
      adminName: adminUser.displayName || 'Host',
      maxMembers: 10,
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
      recommendations: [],
      listenerCount: 1
    };
    
    rooms.set(roomId, room);
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    
    socket.emit('room:state', room);
  });

  socket.on('room:join', ({ roomId, joinCode, user }) => {
    if (disconnectTimeouts.has(user.uid)) {
      clearTimeout(disconnectTimeouts.get(user.uid));
      disconnectTimeouts.delete(user.uid);
    }
    
    let room = rooms.get(roomId);
    if (!room) {
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
    
    if (!room.isPublic) {
      const codeToCheck = joinCode || roomId;
      if (room.joinCode !== codeToCheck) {
        return socket.emit('room:error', 'Invalid room code');
      }
    }
    
    const maxLimit = room.maxMembers || 10;
    // Allow admin to rejoin regardless of limit
    const isAdminRejoining = room.adminFirebaseUid === user.uid;
    
    if (!isAdminRejoining && room.members.length >= maxLimit && !room.members.some(m => m.uid === user.uid)) {
      return socket.emit('room:error', `Room is full (${maxLimit}/${maxLimit})`);
    }
    
    const existingIdx = room.members.findIndex(m => m.uid === user.uid);
    if (existingIdx !== -1) {
      const existingMember = room.members[existingIdx];
      const oldSocketId = existingMember.socketId;
      existingMember.socketId = socket.id;
      
      if (room.adminFirebaseUid === user.uid) {
        existingMember.isAdmin = true;
        room.adminUid = socket.id;
        room.adminName = existingMember.displayName;
        room.members.forEach(m => {
          if (m.uid !== user.uid) m.isAdmin = false;
        });
      }
      
      socketToRoom.delete(oldSocketId);
    } else {
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
    
      // Notify room
      socket.emit('room:state', room);
      io.to(roomId).emit('room:member_joined', { members: room.members, listenerCount: room.listenerCount });

      // System Chat Message for Join
      const msg = {
        id: nanoid(10),
        senderUid: 'system',
        senderName: 'System',
        type: 'system-join',
        content: `* ${user.displayName || 'A listener'} joined the room.`,
        timestamp: Date.now()
      };
      room.chat.push(msg);
      if (room.chat.length > 100) room.chat.shift();
      io.to(roomId).emit('room:chat_new', msg);
  });

  socket.on('room:leave', () => {
    handleRoomDisconnect(io, socket.id, true);
  });

  socket.on('room:transfer_admin', ({ targetSocketId }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    const targetMember = room.members.find(m => m.socketId === targetSocketId);
    if (targetMember) {
      const currentAdmin = room.members.find(m => m.socketId === socket.id);
      if (currentAdmin) currentAdmin.isAdmin = false;
      
      targetMember.isAdmin = true;
      room.adminUid = targetSocketId;
      room.adminFirebaseUid = targetMember.uid;
      room.adminName = targetMember.displayName;
      
      io.to(roomId).emit('room:admin_changed', { newAdminUid: targetSocketId, members: room.members });
    }
  });

  socket.on('room:kick_member', ({ targetSocketId }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    if (targetSocketId === socket.id) return;
    
    const targetMember = room.members.find(m => m.socketId === targetSocketId);
    if (!targetMember) return;
    
    room.members = room.members.filter(m => m.socketId !== targetSocketId);
    room.listenerCount = room.members.length;
    
    io.to(targetSocketId).emit('room:kicked', { reason: 'You were removed from the room by the host' });
    io.in(targetSocketId).socketsLeave(roomId);
    
    io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
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

  socket.on('room:update_settings', ({ maxMembers }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    const newLimit = parseInt(maxMembers);
    if (newLimit >= 2 && newLimit <= 100) {
      room.maxMembers = newLimit;
      io.to(roomId).emit('room:state', room);
    }
  });

  socket.on('room:playback_sync', ({ isPlaying, currentTime }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    room.isPlaying = isPlaying;
    room.currentTime = currentTime;
    socket.to(roomId).emit('room:playback_sync', { isPlaying, currentTime });
  });

  socket.on('room:queue_updated', ({ queue, currentIndex }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    
    room.queue = queue;
    socket.to(roomId).emit('room:queue_updated', { queue, currentIndex });
  });

  socket.on('room:recommend_song', ({ track }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    
    const member = room.members.find(m => m.socketId === socket.id);
    if (!member) return;
    
    if (checkSpam(member.uid, 'recommend')) {
      socket.emit('room:error', { message: 'You are recommending too fast. Please wait.' });
      return;
    }
    
    if (!room.recommendations) room.recommendations = [];
    
    if (room.currentTrack && room.currentTrack.videoId === track.videoId) return;
    if (room.queue.some(t => t.videoId === track.videoId)) return;
    
    const existing = room.recommendations.find(r => r.track.videoId === track.videoId);
    if (existing) {
      if (!existing.voters.includes(member.uid)) {
        existing.voters.push(member.uid);
        room.recommendations.sort((a, b) => b.voters.length - a.voters.length);
        io.to(roomId).emit('room:recommendations_updated', { recommendations: room.recommendations });
      }
    } else {
      if (room.recommendations.length > 50) room.recommendations.pop();
      room.recommendations.push({
        id: nanoid(8),
        track,
        suggestedBy: { uid: member.uid, displayName: member.displayName, photoURL: member.photoURL },
        voters: [member.uid],
        timestamp: Date.now()
      });
      room.recommendations.sort((a, b) => b.voters.length - a.voters.length);
      io.to(roomId).emit('room:recommendations_updated', { recommendations: room.recommendations });
    }
  });

  socket.on('room:remove_recommendation', ({ videoId }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    if (!room.recommendations) return;
    
    const index = room.recommendations.findIndex(r => r.track.videoId === videoId);
    if (index !== -1) {
      room.recommendations.splice(index, 1);
      io.to(roomId).emit('room:recommendations_updated', { recommendations: room.recommendations });
    }
  });

  socket.on('room:chat_message', (msg) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    
    // Secure identity check
    const member = room.members.find(m => m.socketId === socket.id);
    if (!member) return;
    
    msg.senderUid = member.uid;
    msg.senderName = member.displayName;
    
    // SPAM CHECK
    let checkContent = msg.content;
    if (msg.type === 'song-share') checkContent = 'song-share-' + (msg.track?.videoId || '');
    if (msg.type === 'like') checkContent = 'like'; // Hearts don't count heavily
    
    if (msg.type !== 'like' && checkSpam(msg.senderUid, checkContent, socket)) {
      return; // Dropped
    }
    
    msg.id = nanoid(10);
    msg.timestamp = Date.now();
    
    if (msg.type !== 'like') {
      room.chat.push(msg);
      if (room.chat.length > 100) room.chat.shift();
    }
    
    io.to(roomId).emit('room:chat_new', msg);
  });

  socket.on('room:discover', () => {
    const publicRooms = [];
    for (const room of rooms.values()) {
      if (room.isPublic) {
        publicRooms.push({
          roomId: room.roomId,
          name: room.name,
          adminName: room.adminName,
          listenerCount: room.listenerCount,
          currentTrack: room.currentTrack,
          isPublic: room.isPublic
        });
      }
    }
    socket.emit('room:discover_results', publicRooms);
  });
}

function handleRoomDisconnect(io, socketId, isIntentional = false) {
  const roomId = socketToRoom.get(socketId);
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      const leavingMember = room.members.find(m => m.socketId === socketId);
      if (!leavingMember) return;
      
      socketToRoom.delete(socketId);

      // Cut ALL connections: remove the socket from the room so it stops
      // receiving any room events (sync, track changes, queue updates).
      const leavingSocket = io.sockets?.sockets?.get(socketId);
      if (leavingSocket) {
        leavingSocket.leave(roomId);
      }
      
      const removeUser = () => {
        const r = rooms.get(roomId);
        if (!r) return;
        r.members = r.members.filter(m => m.uid !== leavingMember.uid);
        r.listenerCount = r.members.length;

        if (r.members.length === 0) {
          io.to(roomId).emit('room:closed');
          io.socketsLeave(roomId);
          rooms.delete(roomId);
          botRooms.delete(roomId);
          roomStats.dismissed++;
          console.log(`Room ${roomId} destroyed (empty)`);
        } else {
          if (r.adminFirebaseUid === leavingMember.uid) {
            const newAdmin = r.members[0];
            newAdmin.isAdmin = true;
            r.adminUid = newAdmin.socketId;
            r.adminFirebaseUid = newAdmin.uid;
            r.adminName = newAdmin.displayName;
            
            io.to(roomId).emit('room:admin_changed', { newAdminUid: newAdmin.socketId, members: r.members });
          }
          io.to(roomId).emit('room:member_left', { members: r.members, listenerCount: r.listenerCount });
          
          const msg = {
            id: nanoid(10),
            senderUid: 'system',
            senderName: 'System',
            type: 'system-leave',
            content: `* ${leavingMember.displayName} left the room.`,
            timestamp: Date.now()
          };
          r.chat.push(msg);
          if (r.chat.length > 100) r.chat.shift();
          io.to(roomId).emit('room:chat_new', msg);
        }
      };

      if (isIntentional) {
        removeUser();
      } else {
        const tid = setTimeout(() => {
          removeUser();
        }, 15000); // 15s grace period
        disconnectTimeouts.set(leavingMember.uid, tid);
      }
    }
  }
}

// --- Cleanup Tasks ---
setInterval(() => {
  const now = Date.now();
  for (const [uid, state] of userMutes.entries()) {
    // If expired for more than 24h, delete from map
    if (state.expiresAt > 0 && now > state.expiresAt + 24 * 60 * 60 * 1000) {
      userMutes.delete(uid);
    }
  }
}, 60 * 60 * 1000); // Run every 1 hour

// ════════════════════════════════════════════════════════════════════════════
// ─── Bot Rooms System (Cron) ────────────────────────────────────────────────
// Keeps the Rooms lobby alive: 6 bot-hosted rooms with 60 distributed bot
// listeners, auto-playing music and light random activity. Runs entirely
// server-side via scheduled ticks (cron-style).
// ════════════════════════════════════════════════════════════════════════════

const BOT_NAMES = [
  // Realistic Indian names
  'Aarav', 'Priya', 'Rohan', 'Ananya', 'Vikram', 'Neha', 'Arjun', 'Kavya',
  'Aditya', 'Isha', 'Kabir', 'Meera', 'Rahul', 'Pooja', 'Karan', 'Sneha',
  'Varun', 'Divya', 'Siddharth', 'Riya', 'Nikhil', 'Anjali', 'Manav', 'Tanya',
  'Yash', 'Shreya', 'Dev', 'Nisha', 'Raghav', 'Simran', 'Aryan', 'Preeti',
  'Harsh', 'Anaya', 'Rishi', 'Kiara', 'Mohit', 'Aisha', 'Sameer', 'Trisha',
  'Abhay', 'Nandini', 'Kunal', 'Ira', 'Parth', 'Myra', 'Dhruv', 'Sara',
  // A few foreign names in the mix
  'Liam', 'Emma', 'Noah', 'Sofia', 'Lucas', 'Mia', 'Ethan', 'Chloe', 'Aiden', 'Zoe', 'Leo', 'Ivy',
  // New names to reach 120
  'Armaan', 'Roshni', 'Sahil', 'Mehak', 'Ayaan', 'Gauri', 'Reyansh', 'Ishita',
  'Vedant', 'Navya', 'Vihaan', 'Avni', 'Rudra', 'Tanvi', 'Shaurya', 'Diya',
  'Kiaan', 'Sanya', 'Arnav', 'Riddhi', 'Ahaan', 'Shruti', 'Ishaan', 'Jiya',
  'Darsh', 'Tara', 'Ayush', 'Raina', 'Ritik', 'Prisha', 'Samar', 'Kriti',
  'Aakash', 'Suhana', 'Nakul', 'Aadhya', 'Ranveer', 'Niharika', 'Sanjay', 'Payal',
  'Vijay', 'Mahi', 'Ajay', 'Aarti', 'Amit', 'Swati', 'Suraj', 'Sonam',
  'Raj', 'Anita', 'Sunil', 'Jyoti', 'Anand', 'Seema', 'Suresh', 'Bhumika',
  'Gaurav', 'Pallavi', 'Akshay', 'Ritika', 'Manoj', 'Neelam'
];

const ROOM_NAME_PATTERNS = [
  (n) => `${n}'s Room`,
  (n) => `${n}'s Vibes`,
  (n) => `${n} ki Mehfil`,
  (n) => `${n}'s Party`,
  (n) => `${n}'s Lounge`,
  (n) => `${n} & Chill`
];

const BOT_CHAT_LINES = [
  'banger', 'this track never gets old', 'kya vibe hai',
  'add this to your playlist guys', 'anyone listening from Delhi?',
  'volume is perfect right now', 'next one should be something chill',
  'classic after ages', 'looping this all day', 'such a mood right now',
  'old is gold', 'this playlist never disappoints'
];

const BOT_ROOM_COUNT = 10;
const BOT_POOL_REFRESH_MS = 30 * 60 * 1000; // refresh song pool every 30 min

const botRooms = new Set(); // roomIds managed by bots
let botTrackPool = [];
let botSongsProvider = null;
let botPoolRefreshedAt = 0;
let botTickerStarted = false;
let botPlaylistProvider = null;
let botRoomsConfig = [];
let botPlaylistCache = {};

// ytmusic-api returns "3:30" style strings, frontend uses seconds — normalize here
function parseDurationToSeconds(d) {
  if (typeof d === 'number' && d > 0) return d;
  if (typeof d === 'string') {
    const parts = d.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && parts.every(p => !isNaN(p))) return parts[0] * 60 + parts[1];
    if (parts.length === 3 && parts.every(p => !isNaN(p))) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

// Fallback pool (well-known music videos) so bot rooms are never silent
function fallbackBotTracks() {
  const ids = [
    { videoId: 'JGwWNGJdvx8', title: 'Shape of You', channelTitle: 'Ed Sheeran' },
    { videoId: 'OPf0YbXqDm0', title: 'Uptown Funk', channelTitle: 'Mark Ronson' },
    { videoId: 'fRh_vgS2dFE', title: "Can't Stop the Feeling!", channelTitle: 'Justin Timberlake' },
    { videoId: 'hT_nvWreIhg', title: 'Counting Stars', channelTitle: 'OneRepublic' },
    { videoId: 'YQHsXMglC9A', title: 'Hello', channelTitle: 'Adele' },
    { videoId: 'RgKAFK5djSk', title: 'See You Again', channelTitle: 'Wiz Khalifa' }
  ];
  return ids.map(t => ({
    ...t,
    thumbnail: `https://img.youtube.com/vi/${t.videoId}/mqdefault.jpg`,
    thumbnailHigh: `https://img.youtube.com/vi/${t.videoId}/hqdefault.jpg`,
    duration: 220,
    publishedAt: new Date().toISOString()
  }));
}

function pickBotTracks(roomIndex) {
  if (roomIndex !== undefined && botPlaylistCache[roomIndex] && botPlaylistCache[roomIndex].length > 0) {
    return botPlaylistCache[roomIndex];
  }
  return botTrackPool.length > 0 ? botTrackPool : fallbackBotTracks();
}

function createBotRoom(io, admin, listeners, namePatternIdx, roomIndex) {
  const roomId = nanoid(6).toUpperCase();
  roomStats.totalCreated++;
  const allTaken = new Set();
  for (const rId of botRooms) {
    const r = rooms.get(rId);
    if (r) {
      if (r.currentTrack) allTaken.add(r.currentTrack.videoId);
      r.queue.forEach(t => allTaken.add(t.videoId));
    }
  }
  const available = pickBotTracks(roomIndex).filter(t => !allTaken.has(t.videoId));
  const pool = available.length > 6 ? available.sort(() => 0.5 - Math.random()) : pickBotTracks(roomIndex).sort(() => 0.5 - Math.random());
  const room = {
    roomId,
    name: ROOM_NAME_PATTERNS[namePatternIdx % ROOM_NAME_PATTERNS.length](admin.displayName),
    isPublic: true,
    joinCode: roomId,
    adminUid: `bot_socket_${admin.uid}`,
    adminFirebaseUid: admin.uid,
    adminName: admin.displayName,
    maxMembers: 30,
    members: [
      { socketId: `bot_socket_${admin.uid}`, uid: admin.uid, displayName: admin.displayName, isAdmin: true },
      ...listeners.map(b => ({ socketId: `bot_socket_${b.uid}`, uid: b.uid, displayName: b.displayName, isAdmin: false }))
    ],
    currentTrack: pool[0] || null,
    queue: pool.slice(1, 6),
    currentTime: Math.floor(Math.random() * 60),
    isPlaying: true,
    chat: [],
    recommendations: [],
    listenerCount: listeners.length + 1,
    _isBotRoom: true,
    _botRoomIndex: roomIndex
  };
  rooms.set(roomId, room);
  botRooms.add(roomId);
  return room;
}

async function refreshBotPool(force = false) {
  if (!botSongsProvider) return;
  if (!force && botPoolRefreshedAt > 0 && Date.now() - botPoolRefreshedAt < BOT_POOL_REFRESH_MS) return;
  
  try {
    const tracks = await botSongsProvider();
    if (tracks && tracks.length > 0) {
      botTrackPool = tracks;
    }
  } catch (e) {
    console.warn('Bot track pool refresh failed:', e.message);
  }

  if (botPlaylistProvider && botRoomsConfig && botRoomsConfig.length > 0) {
    for (let i = 0; i < botRoomsConfig.length; i++) {
      const pid = botRoomsConfig[i];
      if (!pid) continue;
      try {
        const pTracks = await botPlaylistProvider(pid);
        if (pTracks && pTracks.length > 0) {
          botPlaylistCache[i] = pTracks;
        }
      } catch (e) {}
    }
  }

  botPoolRefreshedAt = Date.now();
}

function hasRealListeners(room) {
  return room.members.some(m => !m.uid.startsWith('bot_'));
}

function initBotRooms(io, provider, config = [], playlistProvider = null) {
  botSongsProvider = provider;
  botRoomsConfig = config;
  botPlaylistProvider = playlistProvider;
  
  refreshBotPool(true).then(() => {
    // 60 bots shuffled, distributed across 6 rooms (7-13 per room, leftovers join random rooms)
    const bots = [...BOT_NAMES].sort(() => 0.5 - Math.random())
      .map((name, i) => ({ uid: `bot_${String(i + 1).padStart(2, '0')}`, displayName: name }));
    let idx = 0;
    for (let i = 0; i < BOT_ROOM_COUNT; i++) {
      const size = Math.min(bots.length - idx, 7 + Math.floor(Math.random() * 7));
      const group = bots.slice(idx, idx + size);
      idx += size;
      const admin = group[0];
      admin.isAdmin = true;
      createBotRoom(io, admin, group.slice(1), i, i);
    }
    while (idx < bots.length) {
      const bot = bots[idx++];
      const roomIds = [...botRooms];
      const r = rooms.get(roomIds[Math.floor(Math.random() * roomIds.length)]);
      if (r) {
        r.members.push({ socketId: `bot_socket_${bot.uid}`, uid: bot.uid, displayName: bot.displayName, isAdmin: false });
        r.listenerCount = r.members.length;
      }
    }
    console.log(`Bot rooms live: ${botRooms.size} rooms with ${bots.length} bots`);
    startBotTicker(io);
  }).catch(err => console.warn('Bot room init failed:', err.message));
}

function startBotTicker(io) {
  if (botTickerStarted) return;
  botTickerStarted = true;

  // ── Playback progression (every second) ──
  setInterval(() => {
    for (const roomId of botRooms) {
      const room = rooms.get(roomId);
      if (!room || !room.isPlaying || !room.currentTrack) continue;
      const dur = parseDurationToSeconds(room.currentTrack.duration);
      room.currentTime += 1;
      if (room.currentTime >= dur) {
        // Track ended — play next (queue first, then random from pool)
        const pool = pickBotTracks(room._botRoomIndex);
        const taken = new Set();
        for (const otherId of botRooms) {
          if (otherId === roomId) continue;
          const other = rooms.get(otherId);
          if (other) {
            if (other.currentTrack) taken.add(other.currentTrack.videoId);
            other.queue.forEach(t => taken.add(t.videoId));
          }
        }

        if (room.queue.length > 0) {
          room.currentTrack = room.queue.shift();
        } else {
          const free = pool.filter(t => !taken.has(t.videoId) && t.videoId !== room.currentTrack?.videoId);
          const candidates = free.length > 0 ? free : pool;
          room.currentTrack = candidates[Math.floor(Math.random() * candidates.length)];
        }
        
        const freeForQueue = pool.filter(t => !taken.has(t.videoId) && t.videoId !== room.currentTrack?.videoId && !room.queue.some(q => q.videoId === t.videoId));
        const qCandidates = freeForQueue.length > 0 ? freeForQueue : pool;
        const nextUp = qCandidates[Math.floor(Math.random() * qCandidates.length)];
        room.queue.push(nextUp);
        room.currentTime = 0;
        // Keep real listeners in sync with the new track
        io.to(roomId).emit('room:track_changed', { track: room.currentTrack });
      }
    }
  }, 1000);

  // ── Light activity cron (every 3 minutes) ──
  setInterval(async () => {
    const roomIds = [...botRooms];
    if (roomIds.length === 0) return;

    // 1) Shuffle 1-2 listeners between random rooms
    const moveCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < moveCount; i++) {
      const fromId = roomIds[Math.floor(Math.random() * roomIds.length)];
      const toId = roomIds[Math.floor(Math.random() * roomIds.length)];
      if (fromId === toId) continue;

      const from = rooms.get(fromId);
      const to = rooms.get(toId);
      if (!from || !to) continue;

      const botMembers = from.members.filter(m => m.uid.startsWith('bot_') && !m.isAdmin);
      if (botMembers.length <= 4) continue; // keep a minimum crowd in every room

      const mover = botMembers[Math.floor(Math.random() * botMembers.length)];
      from.members = from.members.filter(m => m.uid !== mover.uid);
      from.listenerCount = from.members.length;
      io.to(fromId).emit('room:member_left', { members: from.members, listenerCount: from.listenerCount });

      to.members.push(mover);
      to.listenerCount = to.members.length;
      io.to(toId).emit('room:member_joined', { members: to.members, listenerCount: to.listenerCount });
    }

    // 2) Random bot drops a chat message
    if (Math.random() < 0.6) {
      const chatRoomId = roomIds[Math.floor(Math.random() * roomIds.length)];
      const chatRoom = rooms.get(chatRoomId);
      if (chatRoom) {
        const botsInRoom = chatRoom.members.filter(m => m.uid.startsWith('bot_'));
        const speaker = botsInRoom[Math.floor(Math.random() * botsInRoom.length)];
        if (speaker) {
          const msg = {
            id: nanoid(10),
            senderUid: speaker.uid,
            senderName: speaker.displayName,
            type: 'text',
            content: BOT_CHAT_LINES[Math.floor(Math.random() * BOT_CHAT_LINES.length)],
            timestamp: Date.now()
          };
          chatRoom.chat.push(msg);
          if (chatRoom.chat.length > 100) chatRoom.chat.shift();
          io.to(chatRoomId).emit('room:chat_new', msg);
        }
      }
    }

    // 3) Refresh the song pool periodically (cached)
    await refreshBotPool();

    // 4) Push a playback sync to rooms with real listeners so they stay glued to the bot clock
    for (const roomId of botRooms) {
      const room = rooms.get(roomId);
      if (!room || !room.currentTrack) continue;
      if (hasRealListeners(room)) {
        io.to(roomId).emit('room:playback_sync', { isPlaying: room.isPlaying, currentTime: room.currentTime });
      }
    }
  }, 3 * 60 * 1000);
}

// --- Room Analytics Snapshot ---
function getRoomAnalytics() {
  const activeRooms = [];
  let totalActiveMembers = 0;
  let botRoomCount = 0;
  let realRoomCount = 0;

  for (const room of rooms.values()) {
    totalActiveMembers += room.members.length;
    if (room._isBotRoom) botRoomCount++;
    else realRoomCount++;
    activeRooms.push({
      roomId: room.roomId,
      name: room.name,
      adminName: room.adminName,
      listenerCount: room.listenerCount,
      maxMembers: room.maxMembers || 10,
      isPublic: room.isPublic,
      isBot: !!room._isBotRoom,
      currentTrack: room.currentTrack ? room.currentTrack.title : null,
      hasRealListeners: room.members.some(m => !m.uid.startsWith('bot_'))
    });
  }

  return {
    totalCreated: roomStats.totalCreated,
    dismissed: roomStats.dismissed,
    activeRoomCount: activeRooms.length,
    botRoomCount,
    realRoomCount,
    totalActiveMembers,
    activeRooms
  };
}

module.exports = {
  setupRoomHandlers,
  handleRoomDisconnect,
  initBotRooms,
  getRoomAnalytics
};
