const express = require('express');
const cors = require('cors');
const YTMusic = require('ytmusic-api');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Search endpoint
app.get('/api/songs', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  try {
    const yt = await getYTMusic();
    console.log(`Searching songs for query: "${query}"`);
    const results = await yt.searchSongs(query);

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
app.listen(PORT, async () => {
  console.log(`GanaTube Backend Server listening at http://localhost:${PORT}`);
  try {
    await getYTMusic();
  } catch (err) {
    console.error('Failed to pre-initialize YTMusic:', err);
  }
});
