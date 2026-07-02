const YTMusic = require('ytmusic-api');

async function test() {
  const yt = new YTMusic();
  await yt.initialize();
  const results = await yt.searchSongs('Bangles');
  console.log('Results:');
  results.slice(0, 5).forEach((item, idx) => {
    console.log(`Song ${idx + 1}: ${item.name}`);
    console.log('Thumbnails:', JSON.stringify(item.thumbnails, null, 2));
  });
}

test().catch(console.error);
