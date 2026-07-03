export interface PlaylistMeta {
  id: string;
  title: string;
  language: string;
  coverImage: string;
  searchQueries: string[];
}

export const PLAYLISTS: PlaylistMeta[] = [
  // LATEST HITS (Hero Section)
  {
    id: 'hero-english',
    title: 'English Latest Hits',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top English Songs 2024', 'Latest English Pop Hits', 'Billboard Hot 100']
  },
  {
    id: 'hero-hindi',
    title: 'Hindi Latest Hits',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top Bollywood Songs 2024', 'Latest Hindi Hits', 'Trending Hindi Music']
  },
  {
    id: 'hero-punjabi',
    title: 'Punjabi Latest Hits',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1533174000243-ea77699d7e5c?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Punjabi Songs 2024', 'Top Punjabi Hits', 'Punjabi Party Songs']
  },
  {
    id: 'hero-bhojpuri',
    title: 'Bhojpuri Latest Hits',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Bhojpuri Songs', 'Pawan Singh New Song', 'Khesari Lal Yadav Hits']
  },
  {
    id: 'hero-bengali',
    title: 'Bengali Latest Hits',
    language: 'Bengali',
    coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Bengali Songs 2024', 'Top Bengali Hits', 'Arijit Singh Bengali']
  },
  {
    id: 'hero-haryanvi',
    title: 'Haryanvi Latest Hits',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5956020?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Haryanvi Songs 2024', 'Sapna Choudhary Dance', 'Haryanvi DJ Hits']
  },
  {
    id: 'hero-tamil',
    title: 'Tamil Latest Hits',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1598369936359-c2901323f463?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Tamil Songs', 'Anirudh Hits', 'AR Rahman Tamil']
  },
  // HINDI
  {
    id: 'hi-top-100',
    title: 'Bollywood Top 100',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top Bollywood Songs 2024', 'Latest Hindi Hits', 'Bollywood Chartbusters']
  },
  {
    id: 'hi-arijit-best',
    title: 'Best of Arijit Singh',
    language: 'Hindi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Arijit_Singh_performance_at_Chandigarh_2025.jpg/500px-Arijit_Singh_performance_at_Chandigarh_2025.jpg',
    searchQueries: ['Arijit Singh Best Songs', 'Arijit Singh Romantic hits', 'Arijit Singh Sad Songs']
  },
  {
    id: 'hi-romantic',
    title: 'Hindi Romance',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Hindi Romantic Songs', 'Bollywood Love Songs', 'Shreya Ghoshal Romantic']
  },
  {
    id: 'hi-party',
    title: 'Bollywood Party',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bollywood Party Songs', 'Hindi Dance Hits', 'Badshah Party Songs']
  },
  {
    id: 'hi-90s',
    title: '90s Bollywood Gold',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['90s Hindi Songs', 'Kumar Sanu Hits', 'Udit Narayan Best Songs']
  },
  {
    id: 'hi-lofi',
    title: 'Bollywood Lofi Chill',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1516280440502-8610ebac12f4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bollywood Lofi Mix', 'Hindi Lofi Songs', 'Chill Hindi Beats']
  },
  {
    id: 'hi-sufi',
    title: 'Sufi Soul',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03305a527e4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Sufi Songs Hindi', 'Nusrat Fateh Ali Khan', 'Rahat Fateh Ali Khan Hits']
  },
  {
    id: 'hi-indie',
    title: 'Hindi Indie',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Hindi Indie Songs', 'Prateek Kuhad', 'Anuv Jain Hits']
  },
  {
    id: 'hi-devotional',
    title: 'Morning Bhakti',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Hindi Bhajans', 'Morning Devotional Songs', 'Aarti Collection']
  },
  
  // ENGLISH
  {
    id: 'en-global-top',
    title: 'Global Top 50',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Global Top Hits 2024', 'Billboard Hot 100', 'Top Pop Songs']
  },
  {
    id: 'en-pop-hits',
    title: 'Pop Perfection',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Pop Hits 2024', 'Taylor Swift Best', 'Dua Lipa Hits']
  },
  {
    id: 'en-rap-caviar',
    title: 'Rap Culture',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f4bbdc?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top Rap Songs', 'Drake Hits', 'Eminem Best']
  },
  {
    id: 'en-rock-classics',
    title: 'Rock Classics',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1502251147048-2624bb183a65?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Classic Rock Hits', 'Queen Best Songs', 'AC/DC Hits']
  },
  {
    id: 'en-edm',
    title: 'EDM Bangers',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c092fb86f4a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['EDM Top Hits', 'Martin Garrix', 'David Guetta Best']
  },
  {
    id: 'en-lofi-beats',
    title: 'Lofi Beats',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1516280440502-8610ebac12f4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Lofi hip hop radio', 'Chill beats to study', 'Lofi aesthetics']
  },
  {
    id: 'en-rnb',
    title: 'R&B Grooves',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1485303254060-e8b8359cdcb3?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['R&B hits 2024', 'The Weeknd Hits', 'Bruno Mars Best']
  },

  // PUNJABI
  {
    id: 'pa-top-hits',
    title: 'Punjabi Top Hits',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1531651008558-ed1c403ba49a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Punjabi Songs', 'Punjabi Top Hits 2024']
  },
  {
    id: 'pa-karan-aujla',
    title: 'Karan Aujla Specials',
    language: 'Punjabi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Karan_Aujla_2020.jpg/500px-Karan_Aujla_2020.jpg',
    searchQueries: ['Karan Aujla All Songs', 'Geeta Di Machine Hits']
  },
  {
    id: 'pa-diljit',
    title: 'Diljit Dosanjh Hits',
    language: 'Punjabi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Diljit_Dosanjh.jpg',
    searchQueries: ['Diljit Dosanjh Best Songs', 'GOAT Diljit']
  },
  {
    id: 'pa-sidhu',
    title: 'Sidhu Moose Wala Legacy',
    language: 'Punjabi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Sidhu_Moose_Wala_during_the_shooting_of_his_film_Moosa_Jatt_%28cropped%29.jpg/500px-Sidhu_Moose_Wala_during_the_shooting_of_his_film_Moosa_Jatt_%28cropped%29.jpg',
    searchQueries: ['Sidhu Moose Wala All Songs', 'Sidhu Moose Wala Hits']
  },
  {
    id: 'pa-party',
    title: 'Punjabi Party Mix',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Punjabi Party Songs', 'Bhangra Hits', 'AP Dhillon Party']
  },
  {
    id: 'pa-sad',
    title: 'Punjabi Sad Songs',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Punjabi Sad Songs', 'B Praak Sad Hits', 'Broken Heart Punjabi']
  },
  {
    id: 'pa-indie',
    title: 'Punjabi Indie & Lofi',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Punjabi Lofi Songs', 'Punjabi Indie Pop', 'Chill Punjabi']
  },

  // BHOJPURI
  {
    id: 'bh-top-hits',
    title: 'Bhojpuri Blockbusters',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1533282960533-51328aa26c26?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Bhojpuri Songs', 'Bhojpuri Hit Songs 2024']
  },
  {
    id: 'bh-pawan-singh',
    title: 'Pawan Singh Power Hits',
    language: 'Bhojpuri',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Pawan_Singh.jpg/500px-Pawan_Singh.jpg',
    searchQueries: ['Pawan Singh New Songs', 'Pawan Singh Blockbusters']
  },
  {
    id: 'bh-khesari',
    title: 'Khesari Lal Yadav Hits',
    language: 'Bhojpuri',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Khesari_Lal_Yadav_at_an_event.jpg/500px-Khesari_Lal_Yadav_at_an_event.jpg',
    searchQueries: ['Khesari Lal Yadav Latest', 'Khesari Lal Superhit']
  },
  {
    id: 'bh-shilpi',
    title: 'Shilpi Raj Sensations',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Shilpi Raj New Songs', 'Shilpi Raj Hit Songs']
  },
  {
    id: 'bh-party',
    title: 'Bhojpuri DJ Party',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bhojpuri DJ Remix Songs', 'Bhojpuri Dance Hits']
  },
  {
    id: 'bh-bhakti',
    title: 'Bhojpuri Bhakti',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bhojpuri Devi Geet', 'Bhojpuri Bhakti Songs']
  },

  // HARYANVI
  {
    id: 'hr-top',
    title: 'Haryanvi Top Hits',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1531651008558-ed1c403ba49a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Haryanvi Songs', 'Haryanvi DJ Hits']
  },
  {
    id: 'hr-renuka',
    title: 'Renuka Panwar Hits',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f4bbdc?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Renuka Panwar Best Songs', '52 Gaj Ka Daman']
  },
  {
    id: 'hr-gulzaar',
    title: 'Gulzaar Chhaniwala Swag',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1502251147048-2624bb183a65?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Gulzaar Chhaniwala New Songs', 'Gulzaar Chhaniwala Hit Songs']
  },
  {
    id: 'hr-sumit',
    title: 'Sumit Goswami Best',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c092fb86f4a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Sumit Goswami Hit Songs', 'Haryana Roadways Sumit']
  },
  {
    id: 'hr-danda',
    title: 'Raju Punjabi Classics',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1516280440502-8610ebac12f4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Raju Punjabi Old Hits', 'Raju Punjabi Best Songs']
  },
  {
    id: 'hr-dj',
    title: 'Haryanvi DJ Mashup',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Haryanvi DJ Remix 2024', 'Desi DJ Songs']
  },

  // TAMIL
  {
    id: 'ta-top',
    title: 'Tamil Top 100',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Tamil Hit Songs 2024', 'Tamil Chartbusters']
  },
  {
    id: 'ta-anirudh',
    title: 'Anirudh Musical',
    language: 'Tamil',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Anirudh_Ravichander.jpg/500px-Anirudh_Ravichander.jpg',
    searchQueries: ['Anirudh Ravichander Hits', 'Anirudh BGM']
  },
  {
    id: 'ta-ar-rahman',
    title: 'A.R. Rahman Tamil Hits',
    language: 'Tamil',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg/500px-AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg',
    searchQueries: ['AR Rahman Tamil Hit Songs', '90s AR Rahman Tamil']
  },
  {
    id: 'ta-yuvan',
    title: 'Yuvan Shankar Raja Magic',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['U1 Hits', 'Yuvan Shankar Raja Best Songs']
  },
  {
    id: 'ta-romantic',
    title: 'Tamil Melody',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03305a527e4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Tamil Romantic Songs', 'Tamil Love Melody']
  },
  {
    id: 'ta-kuthu',
    title: 'Tamil Kuthu Hits',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Tamil Kuthu Songs', 'Thalapathy Vijay Dance Hits']
  },

  // TELUGU
  {
    id: 'te-top',
    title: 'Telugu Top Hits',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1533282960533-51328aa26c26?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Telugu Hit Songs 2024', 'Tollywood Chartbusters']
  },
  {
    id: 'te-thaman',
    title: 'Thaman S Musical',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f4bbdc?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Thaman S Hit Songs', 'Thaman BGM']
  },
  {
    id: 'te-dsp',
    title: 'DSP Blockbusters',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1502251147048-2624bb183a65?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Devi Sri Prasad Hits', 'DSP Telugu Hit Songs']
  },
  {
    id: 'te-sid-sriram',
    title: 'Sid Sriram Melodies',
    language: 'Telugu',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sid_Sriram_at_Audio_Launch_of_Ninnu_Kori.jpg/500px-Sid_Sriram_at_Audio_Launch_of_Ninnu_Kori.jpg',
    searchQueries: ['Sid Sriram Telugu Hits', 'Sid Sriram Melody Songs']
  },
  {
    id: 'te-romantic',
    title: 'Telugu Romance',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Telugu Romantic Hits', 'Telugu Love Songs']
  },
  {
    id: 'te-mass',
    title: 'Tollywood Mass',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c092fb86f4a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Telugu Mass Songs', 'Pushpa Songs', 'Allu Arjun Dance Hits']
  },

  // MIXED / OTHER
  {
    id: 'mix-workout',
    title: 'Workout Beast Mode',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Workout Motivation Music', 'Gym Motivation Songs', 'High Energy Workout Mix']
  },
  {
    id: 'mix-sleep',
    title: 'Deep Sleep Sounds',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1515814896265-42d45b736b46?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Deep Sleep Music', 'Relaxing Rain Sounds', 'Meditation Music']
  },
  {
    id: 'mix-gaming',
    title: 'Gaming Mix',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Gaming Music Mix', 'NCS Gaming', 'Dubstep Gaming Mix']
  },
  {
    id: 'mix-retro',
    title: '80s Retro Synthwave',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['80s Synthwave', 'Retro Synth Pop', 'Vaporwave Mix']
  },
  {
    id: 'mix-classical',
    title: 'Classical Masterpieces',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Mozart Masterpieces', 'Beethoven Best', 'Classical Music For Studying']
  },
  {
    id: 'hi-kishore',
    title: 'Kishore Kumar Classics',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Kishore Kumar Hit Songs', 'Kishore Kumar Romantic']
  },
  {
    id: 'hi-lata',
    title: 'Lata Mangeshkar Melodies',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Lata Mangeshkar Old Hindi Songs', 'Lata Kishore Duets']
  },
  {
    id: 'hi-ghazals',
    title: 'Soulful Ghazals',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03305a527e4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Jagjit Singh Ghazals', 'Best Urdu Ghazals', 'Pankaj Udhas Ghazals']
  }
];
