const fs = require('fs');
const path = require('path');

const hindiGenres = [
  { name: 'Latest Trending', search: 'Latest trending hindi songs 2026' },
  { name: 'GenZ Indie Vibes', search: 'Anuv Jain Prateek Kuhad Osho Jain Indie' },
  { name: 'Bollywood Hits', search: 'Arijit Singh Shreya Ghoshal latest' },
  { name: 'Romantic Melody', search: 'Atif Aslam Neha Kakkar Romance' },
  { name: 'Heartbreak Sad', search: 'Jubin Nautiyal B Praak Sad' },
  { name: 'Party Anthems', search: 'Badshah Honey Singh Party hits' },
  { name: 'Lo-Fi Chill & Aesthetics', search: 'Lofi Chill Bollywood aesthetic' },
  { name: 'Sufi Magic', search: 'Nusrat Fateh Ali Khan Rahat' },
  { name: '90s Nostalgia', search: 'Kumar Sanu Alka Yagnik 90s' },
  { name: 'Ghazal Classics', search: 'Jagjit Singh Pankaj Udhas' },
  // Artist specific
  { name: 'Best of Arijit Singh', search: 'Arijit Singh Best Songs' },
  { name: 'Best of Atif Aslam', search: 'Atif Aslam Best Songs' },
  { name: 'Best of Shreya Ghoshal', search: 'Shreya Ghoshal Best Songs' },
  { name: 'Best of Anuv Jain & Indie', search: 'Anuv Jain Baarishein Husn Best' },
  { name: 'Best of Amit Trivedi', search: 'Amit Trivedi Coke Studio Best' }
];

const englishGenres = [
  { name: 'Global Top Trending', search: 'Global Top Trending English 2026' },
  { name: 'GenZ Pop & Alt', search: 'Billie Eilish Olivia Rodrigo Tate McRae' },
  { name: 'Pop Hits', search: 'Taylor Swift Dua Lipa Pop' },
  { name: 'Hip Hop', search: 'Drake Eminem Hip Hop' },
  { name: 'EDM Dance', search: 'David Guetta Martin Garrix EDM' },
  { name: 'Rock Classics', search: 'Queen AC/DC Rock' },
  { name: 'R&B Soul', search: 'The Weeknd Bruno Mars R&B' },
  { name: 'Acoustic Chill', search: 'Ed Sheeran Shawn Mendes Acoustic' },
  { name: 'Workout Motivation', search: 'Workout Motivation Gym' },
  { name: 'Focus Study Lofi', search: 'Lofi Girl Chillhop Study' },
  // Artist specific
  { name: 'Best of Taylor Swift', search: 'Taylor Swift Best Songs Eras' },
  { name: 'Best of The Weeknd', search: 'The Weeknd Best Songs' },
  { name: 'Best of Ed Sheeran', search: 'Ed Sheeran Best Songs' },
  { name: 'Best of Dua Lipa', search: 'Dua Lipa Best Songs' },
  { name: 'Best of Bruno Mars', search: 'Bruno Mars Best Songs' }
];

const playlists = [];
let idCounter = 1000;

function generate(language, genresArray) {
  for (let genre of genresArray) {
    // We want 50 total per language. We have 15 categories.
    // Let's do 3-4 volumes per category to reach ~50
    let vols = (genre.name.includes('Best of') || genre.name.includes('Trending')) ? 2 : 4; 
    // Wait, let's just make it simpler: distribute 50 playlists across 15 categories.
    // 50 / 15 = 3.3. We'll do 3 for some, 4 for others.
    for (let i = 1; i <= 3; i++) {
      const title = `${language} ${genre.name} Vol. ${i}`;
      playlists.push({
        id: (idCounter++).toString(),
        title: title,
        language: language,
        coverImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(genre.name.substring(0, 15) + ' ' + i)}&background=222&color=fff&size=400`,
        searchQueries: [
          `${genre.search} vol ${i}`,
          `${genre.name} full songs`,
          `Best ${genre.search} ${language}`,
          `Trending ${genre.name}`
        ],
        creator: 'GanaTube Curated',
        is_public: true
      });
    }
  }
}

generate('Hindi', hindiGenres);
generate('English', englishGenres);

let fileContent = `import { PlaylistMeta } from './playlists.data';\n\nexport const CURATED_PLAYLISTS: PlaylistMeta[] = ` + JSON.stringify(playlists, null, 2) + `;\n`;

const outPath = path.join(__dirname, 'src', 'app', 'data', 'curated-playlists.data.ts');
fs.writeFileSync(outPath, fileContent);
console.log('Successfully generated ' + playlists.length + ' curated playlists to', outPath);
