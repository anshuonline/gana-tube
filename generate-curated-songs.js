const fs = require('fs');
const http = require('http');
const path = require('path');

const inputFilePath = path.join(__dirname, 'src', 'admin', 'daily-songs.json');
const outputFilePath = path.join(__dirname, 'src', 'app', 'data', 'curated-songs.ts');

if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found at ${inputFilePath}. Please create it first.`);
    process.exit(1);
}

const inputData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
const finalResults = {};

const fetchSong = (query) => {
    return new Promise((resolve) => {
        const url = `http://localhost:3000/api/songs?q=${encodeURIComponent(query)}&limit=1`;
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && parsed.length > 0) {
                        resolve(parsed[0]);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            resolve(null);
        });
    });
};

async function run() {
    let totalSongs = 0;
    for (const lang of Object.keys(inputData)) {
        totalSongs += inputData[lang].length;
        finalResults[lang] = [];
    }

    console.log(`Starting to fetch metadata for ${totalSongs} songs across ${Object.keys(inputData).length} languages...`);

    let count = 0;
    for (const lang of Object.keys(inputData)) {
        console.log(`\n--- Fetching songs for ${lang} ---`);
        const songs = inputData[lang];
        
        for (let i = 0; i < songs.length; i++) {
            const query = songs[i];
            count++;
            console.log(`[${count}/${totalSongs}] Fetching: ${query}`);
            
            // Adding language suffix for more accurate searches
            const searchQuery = `${query} ${lang} song`;
            const result = await fetchSong(searchQuery);
            
            if (result) {
                finalResults[lang].push(result);
            } else {
                console.log(`Failed to find: ${query}`);
            }
            
            // Small delay to avoid overwhelming the local server
            await new Promise(r => setTimeout(r, 200));
        }
    }

    const tsContent = `export const CURATED_SONGS: Record<string, any[]> = ${JSON.stringify(finalResults, null, 2)};\n`;
    
    // Create directory if it doesn't exist
    const outDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFilePath, tsContent);
    console.log(`\nSuccessfully saved structured metadata to ${outputFilePath}`);
}

run();
