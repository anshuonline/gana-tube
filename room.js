const { nanoid } = require('nanoid');

// --- Storage ---
const rooms = new Map();
const socketToRoom = new Map();
const userMutes = new Map();

function applySpamMute(uid, socket) {
  let state = userMutes.get(uid);
  if (!state) state = { level: 0, expiresAt: 0, history: [] };
  
  if (state.expiresAt > 0 && Date.now() > state.expiresAt + 24 * 60 * 60 * 1000) {
    state.level = 0;
  }
  state.level += 1;
  if (state.level > 4) state.level = 4;
  const durations = [0, 2 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000, 24 * 60 * 60 * 1000];
  state.expiresAt = Date.now() + durations[state.level];
  userMutes.set(uid, state);

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
  if (state.expiresAt > now) {
    const remain = Math.ceil((state.expiresAt - now) / 60000);
    socket.emit('room:chat_muted', { message: \You are muted. Try again in \ minute(s).\, expiresAt: state.expiresAt });
    return true;
  }
  state.history = state.history.filter(m => now - m.time < 10000);
  state.history.push({ time: now, content });
  if (state.history.length > 5) {
    applySpamMute(uid, socket);
    state.history = [];
    return true;
  }
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

function setupRoomHandlers(io, socket) {
  socket.on('room:create', ({ name, isPublic, adminUser }) => {
    const roomId = nanoid(6).toUpperCase();
    const room = {
      roomId, name: name.substring(0, 40), isPublic, joinCode: roomId,
      adminUid: socket.id, adminFirebaseUid: adminUser.uid, adminName: adminUser.displayName || 'Host',
      members: [{ socketId: socket.id, uid: adminUser.uid, displayName: adminUser.displayName || 'Host', photoURL: adminUser.photoURL, isAdmin: true }],
      currentTrack: null, queue: [], currentTime: 0, isPlaying: false, chat: [], listenerCount: 1
    };
    rooms.set(roomId, room);
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit('room:state', room);
  });

  socket.on('room:join', ({ roomId, joinCode, user }) => {
    let room = rooms.get(roomId);
    if (!room) {
      for (const [rid, r] of rooms.entries()) {
        if (r.joinCode === roomId || r.roomId === roomId) { room = r; roomId = rid; break; }
      }
    }
    if (!room) return socket.emit('room:error', 'Room not found');
    if (!room.isPublic) {
      const codeToCheck = joinCode || roomId;
      if (room.joinCode !== codeToCheck) return socket.emit('room:error', 'Invalid room code');
    }
    if (room.members.length >= 50) return socket.emit('room:error', 'Room is full (50/50)');
    
    const existingIdx = room.members.findIndex(m => m.uid === user.uid);
    if (existingIdx !== -1) {
      const existingMember = room.members[existingIdx];
      const oldSocketId = existingMember.socketId;
      existingMember.socketId = socket.id;
      if (room.adminFirebaseUid === user.uid) {
        existingMember.isAdmin = true;
        room.adminUid = socket.id;
        room.adminName = existingMember.displayName;
        room.members.forEach(m => { if (m.uid !== user.uid) m.isAdmin = false; });
      }
      socketToRoom.delete(oldSocketId);
    } else {
      room.members.push({ socketId: socket.id, uid: user.uid, displayName: user.displayName || 'Listener', photoURL: user.photoURL, isAdmin: false });
      room.listenerCount = room.members.length;
    }
    socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
    socket.emit('room:state', room);
    io.to(roomId).emit('room:member_joined', { members: room.members, listenerCount: room.listenerCount });
  });

  socket.on('room:leave', () => handleRoomDisconnect(io, socket.id));

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
    if (!room || room.adminUid !== socket.id || targetSocketId === socket.id) return;
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
    room.currentTrack = track; room.currentTime = 0; room.isPlaying = true;
    io.to(roomId).emit('room:track_changed', { track });
  });

  socket.on('room:playback_sync', ({ isPlaying, currentTime }) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room || room.adminUid !== socket.id) return;
    room.isPlaying = isPlaying; room.currentTime = currentTime;
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

  socket.on('room:chat_message', (msg) => {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    let checkContent = msg.content;
    if (msg.type === 'song-share') checkContent = 'song-share-' + (msg.track?.videoId || '');
    if (checkSpam(msg.senderUid, checkContent, socket)) return;
    msg.id = nanoid(10);
    msg.timestamp = Date.now();
    room.chat.push(msg);
    if (room.chat.length > 100) room.chat.shift();
    io.to(roomId).emit('room:chat_new', msg);
  });

  socket.on('room:discover', () => {
    const publicRooms = [];
    for (const room of rooms.values()) {
      if (room.isPublic) {
        publicRooms.push({ roomId: room.roomId, name: room.name, adminName: room.adminName, listenerCount: room.listenerCount, currentTrack: room.currentTrack, isPublic: room.isPublic });
      }
    }
    socket.emit('room:discover_results', publicRooms);
  });
}

function handleRoomDisconnect(io, socketId) {
  const roomId = socketToRoom.get(socketId);
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      room.members = room.members.filter(m => m.socketId !== socketId);
      room.listenerCount = room.members.length;
      if (room.members.length === 0) {
        io.to(roomId).emit('room:closed');
        io.socketsLeave(roomId);
        rooms.delete(roomId);
        console.log(\Room \ destroyed (empty)\);
      } else if (room.adminUid === socketId) {
        const newAdmin = room.members[0];
        newAdmin.isAdmin = true;
        room.adminUid = newAdmin.socketId;
        room.adminFirebaseUid = newAdmin.uid;
        room.adminName = newAdmin.displayName;
        io.in(socketId).socketsLeave(roomId);
        io.to(roomId).emit('room:admin_changed', { newAdminUid: newAdmin.socketId, members: room.members });
        io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
        console.log(\Room \: admin transferred to \\);
      } else {
        io.in(socketId).socketsLeave(roomId);
        io.to(roomId).emit('room:member_left', { members: room.members, listenerCount: room.listenerCount });
      }
    }
    socketToRoom.delete(socketId);
  }
}

module.exports = { setupRoomHandlers, handleRoomDisconnect };
