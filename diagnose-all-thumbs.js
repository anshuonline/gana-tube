const http = require('http');
const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(data);
        }
      });
    }).on('error', reject);
  });
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', () => {
      resolve(500);
    });
  });
}

async function test() {
  const songsUrl = 'http://localhost:3000/api/songs?q=New Hindi Songs 2026';
  try {
    const songs = await getJson(songsUrl);
    console.log(`Fetched ${songs.length} songs from backend.`);
    for (const song of songs) {
      const codeLow = await checkUrl(song.thumbnail);
      const codeHigh = await checkUrl(song.thumbnailHigh);
      console.log(`Song: ${song.title}`);
      console.log(`  thumbnail: ${song.thumbnail} (status: ${codeLow})`);
      console.log(`  thumbnailHigh: ${song.thumbnailHigh} (status: ${codeHigh})`);
    }
  } catch(e) {
    console.error('Error:', e);
  }
}

test().catch(console.error);
