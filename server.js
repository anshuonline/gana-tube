const express = require('express');
const cors = require('cors');
const YTMusic = require('ytmusic-api');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3000;

// Room State Management
const rooms = new Map(); // roomId -> { hostId, users: [{id, nickname}], currentTrack, currentTime, isPlaying, queue }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', ({ roomId, nickname }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        hostId: socket.id,
        users: [],
        currentTrack: null,
        currentTime: 0,
        isPlaying: false,
        queue: []
      });
    }
    
    const room = rooms.get(roomId);
    room.users.push({ id: socket.id, nickname });
    
    // Send current state to the new user
    socket.emit('room_state', room);
    
    // Notify others
    io.to(roomId).emit('users_updated', { users: room.users, hostId: room.hostId });
    io.to(roomId).emit('notification', `${nickname} joined the room`);
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    const room = rooms.get(roomId);
    if (room) {
      const user = room.users.find(u => u.id === socket.id);
      room.users = room.users.filter(u => u.id !== socket.id);
      if (room.users.length === 0) {
        rooms.delete(roomId);
      } else {
        if (room.hostId === socket.id) {
          room.hostId = room.users[0].id; // Assign new host
        }
        io.to(roomId).emit('users_updated', { users: room.users, hostId: room.hostId });
        if (user) io.to(roomId).emit('notification', `${user.nickname} left the room`);
      }
    }
  });

  socket.on('play_track', ({ roomId, track }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.currentTrack = track;
      room.currentTime = 0;
      room.isPlaying = true;
      socket.to(roomId).emit('track_changed', track);
    }
  });

  socket.on('sync_playback', ({ roomId, isPlaying, currentTime }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.isPlaying = isPlaying;
      if (currentTime !== undefined) room.currentTime = currentTime;
      socket.to(roomId).emit('playback_synced', { isPlaying, currentTime });
    }
  });
  
  socket.on('sync_queue', ({ roomId, queue, currentIndex }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === socket.id) {
      room.queue = queue;
      socket.to(roomId).emit('queue_synced', { queue, currentIndex });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Find rooms this user was in and remove them
    for (const [roomId, room] of rooms.entries()) {
      const user = room.users.find(u => u.id === socket.id);
      if (user) {
        room.users = room.users.filter(u => u.id !== socket.id);
        if (room.users.length === 0) {
          rooms.delete(roomId);
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.users[0].id;
          }
          io.to(roomId).emit('users_updated', { users: room.users, hostId: room.hostId });
          io.to(roomId).emit('notification', `${user.nickname} left the room`);
        }
      }
    }
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
    console.log(`Searching songs: "${rawQuery}" → enhanced: "${query}" (limit: ${limit})`);
    
    let results = await yt.searchSongs(query);
    
    // ytmusic-api natively returns 20 results per search.
    // If the client requested more (e.g. 50), run parallel searches with varied terms to combine them
    if (limit > 20 && results && results.length > 0) {
      try {
        const parallelSearches = await Promise.all([
          yt.searchSongs(`${query} hit songs`),
          yt.searchSongs(`best ${query} tracks`)
        ]);
        
        for (const extraResults of parallelSearches) {
          if (extraResults && extraResults.length > 0) {
            results = results.concat(extraResults);
          }
        }
        
        // Remove exact duplicates by videoId
        const seen = new Set();
        results = results.filter(item => {
          if (!seen.has(item.videoId)) {
            seen.add(item.videoId);
            return true;
          }
          return false;
        });
        
        results = results.slice(0, limit);
      } catch (err) {
        console.warn('Failed parallel extra searches, returning initial 20', err);
      }
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
        
      let thumbnailLow = item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[0].url
        : `https://img.youtube.com/vi/${item.videoId}/default.jpg`;

      let thumbnailHigh = item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[item.thumbnails.length - 1].url
        : `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;

      return {
        videoId: item.videoId,
        title: item.name,
        channelTitle: artistName,
        thumbnail: toHDUrl(thumbnailLow),
        thumbnailHigh: toHDUrl(thumbnailHigh),
        publishedAt: new Date().toISOString(),
      };
    });

    res.json(mappedResults);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'An error occurred during search' });
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

// Serve Angular static frontend files from 'browser' folder
const path = require('path');
app.use(express.static(path.join(__dirname, 'browser')));

// Route all other requests to Angular's index.html (SPA routing fallback)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'browser/index.html'));
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
