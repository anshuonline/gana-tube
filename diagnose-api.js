const http = require('http');

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

async function test() {
  const url = 'http://localhost:3000/api/songs?q=Bangles';
  try {
    const res = await getJson(url);
    console.log('Backend response (first 3):');
    res.slice(0, 3).forEach((item, idx) => {
      console.log(`Item ${idx+1}: ${item.title}`);
      console.log(`  thumbnail: ${item.thumbnail}`);
      console.log(`  thumbnailHigh: ${item.thumbnailHigh}`);
    });
  } catch(e) {
    console.error('Error fetching backend:', e);
  }
}

test().catch(console.error);
