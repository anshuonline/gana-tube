export interface PlaylistMeta {
  slug?: string;
  id: string;
  title: string;
  language: string;
  coverImage: string;
  searchQueries: string[];
  preloadedSongs?: any[];
  creator?: string;
  is_public?: boolean;
  is_owner?: boolean;
  is_saved?: boolean;
}

export const PLAYLISTS: PlaylistMeta[] = [
  {
    id: '76069476',
    title: '100-song English Trending Playlist',
    language: 'English',
    coverImage: '/top100.png',
    searchQueries: [
      'Risk It All — Bruno Mars',
      'Stateside — PinkPantheress & Zara Larsson',
      'My Body Isn\'t Ready — sombr',
      'American Girls — Harry Styles',
      'drop dead — Olivia Rodrigo',
      'Man I Need — Olivia Dean',
      'Potential — Bella Kay',
      'SHE DID IT AGAIN — Tyla & Zara Larsson',
      'White Keys — Dominic Fike',
      'The Great Divide — Noah Kahan',
      'Birds of a Feather — Billie Eilish',
      'Die With A Smile — Lady Gaga & Bruno Mars',
      'Espresso — Sabrina Carpenter',
      'Beautiful Things — Benson Boone',
      'Lose Control — Teddy Swims',
      'Too Sweet — Hozier',
      'APT. — ROSÉ & Bruno Mars',
      'Fortnight — Taylor Swift ft. Post Malone',
      'Stargazing — Myles Smith',
      'Please Please Please — Sabrina Carpenter',
      'Taste — Sabrina Carpenter',
      'Good Luck, Babe! — Chappell Roan',
      'Pink Pony Club — Chappell Roan',
      'End of Beginning — Djo',
      'Ordinary — Alex Warren',
      'Messy — Lola Young',
      'Sports Car — Tate McRae',
      'Greedy — Tate McRae',
      'Cruel Summer — Taylor Swift',
      'Anti-Hero — Taylor Swift',
      'Flowers — Miley Cyrus',
      'Vampire — Olivia Rodrigo',
      'Drivers License — Olivia Rodrigo',
      'Houdini — Dua Lipa',
      'Training Season — Dua Lipa',
      'Dance The Night — Dua Lipa',
      'Texas Hold \'Em — Beyoncé',
      'Feather — Sabrina Carpenter',
      'Stick Season — Noah Kahan',
      'Fast Car — Luke Combs',
      'Saturn — SZA',
      'Snooze — SZA',
      'Kill Bill — SZA',
      'I Remember Everything — Zach Bryan ft. Kacey Musgraves',
      'Austin — Dasha',
      'Million Dollar Baby — Tommy Richman',
      'I Had Some Help — Post Malone ft. Morgan Wallen',
      'Not Like Us — Kendrick Lamar',
      'Luther — Kendrick Lamar & SZA',
      'Nokia — Drake',
      'Birds of a Feather (Live)',
      'That\'s So True — Gracie Abrams',
      'Close To You — Gracie Abrams',
      'Us. — Gracie Abrams ft. Taylor Swift',
      'Casual — Chappell Roan',
      'Bed Chem — Sabrina Carpenter',
      'Busy Woman — Sabrina Carpenter',
      'Diet Pepsi — Addison Rae',
      'BMF — SZA',
      'Pink Skies — Zach Bryan',
      'Timeless — The Weeknd & Playboi Carti',
      'One Of The Girls — The Weeknd, Jennie & Lily-Rose Depp',
      'Popular — The Weeknd, Madonna & Playboi Carti',
      'Creepin\' — Metro Boomin, The Weeknd & 21 Savage',
      'Save Your Tears — The Weeknd',
      'Blinding Lights — The Weeknd',
      'As It Was — Harry Styles',
      'Watermelon Sugar — Harry Styles',
      'Golden — Harry Styles',
      'Levitating — Dua Lipa',
      'Don\'t Start Now — Dua Lipa',
      'Cold Heart — Elton John & Dua Lipa',
      'Shape of You — Ed Sheeran',
      'Eyes Closed — Ed Sheeran',
      'Bad Habits — Ed Sheeran',
      'Shivers — Ed Sheeran',
      'Perfect — Ed Sheeran',
      'Calm Down — Rema & Selena Gomez',
      'Stay — The Kid LAROI & Justin Bieber',
      'Ghost — Justin Bieber',
      'Peaches — Justin Bieber',
      'Daisies — Justin Bieber',
      'Unholy — Sam Smith & Kim Petras',
      'Heat Waves — Glass Animals',
      'Enemy — Imagine Dragons & JID',
      'Believer — Imagine Dragons',
      'Bones — Imagine Dragons',
      'Thunder — Imagine Dragons',
      'Arcade — Duncan Laurence',
      'Someone You Loved — Lewis Capaldi',
      'Before You Go — Lewis Capaldi',
      'Easy On Me — Adele',
      'Rolling In The Deep — Adele',
      'Skyfall — Adele',
      'Bad Dreams — Teddy Swims',
      'Sailor Song — Gigi Perez',
      'Beautiful People — David Guetta & Sia',
      'Titanium — David Guetta ft. Sia',
      'We Can\'t Be Friends (Wait for Your Love) — Ariana Grande',
      'Die For You — The Weeknd'
    ]
  },

  // LATEST HITS (Hero Section)
  {
    id: '42052311',
    slug: 'hero-english',
    title: 'English Latest Hits',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500',
    searchQueries: [
      'Risk It All — Bruno Mars',
      'Stateside (feat. Zara Larsson) — PinkPantheress',
      'My Body Isn\'t Ready — sombr',
      'American Girls — Harry Styles',
      'drop dead — Olivia Rodrigo',
      'Man I Need — Olivia Dean',
      'Potential — Bella Kay',
      'SHE DID IT AGAIN — Tyla & Zara Larsson',
      'White Keys — Dominic Fike',
      'The Great Divide — Noah Kahan',
      'No One Noticed — The Marías',
      'Birds of a Feather — Billie Eilish',
      'Die With A Smile — Lady Gaga & Bruno Mars',
      'Espresso — Sabrina Carpenter',
      'Beautiful Things — Benson Boone',
      'Lose Control — Teddy Swims',
      'Too Sweet — Hozier',
      'APT. — ROSÉ & Bruno Mars',
      'Fortnight — Taylor Swift feat. Post Malone',
      'Stargazing — Myles Smith'
    ]
  },
  {
    id: '60044689',
    slug: 'hero-hindi',
    title: 'Hindi Latest Hits',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top Bollywood Songs 2024', 'Latest Hindi Hits', 'Trending Hindi Music']
  },
  {
    id: '45604422',
    slug: 'hero-punjabi',
    title: 'Punjabi Latest Hits',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1533174000243-ea77699d7e5c?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Punjabi Songs 2024', 'Top Punjabi Hits', 'Punjabi Party Songs']
  },
  {
    id: '26421114',
    slug: 'hero-bhojpuri',
    title: 'Bhojpuri Latest Hits',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Bhojpuri Songs', 'Pawan Singh New Song', 'Khesari Lal Yadav Hits']
  },
  {
    id: '59171443',
    slug: 'hero-bengali',
    title: 'Bengali Latest Hits',
    language: 'Bengali',
    coverImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Bengali Songs 2024', 'Top Bengali Hits', 'Arijit Singh Bengali']
  },
  {
    id: '47667010',
    slug: 'hero-haryanvi',
    title: 'Haryanvi Latest Hits',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5956020?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Haryanvi Songs 2024', 'Sapna Choudhary Dance', 'Haryanvi DJ Hits']
  },
  {
    id: '27745696',
    slug: 'hero-tamil',
    title: 'Tamil Latest Hits',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1598369936359-c2901323f463?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Tamil Songs', 'Anirudh Hits', 'AR Rahman Tamil']
  },
  // HINDI
  {
    id: '46400550',
    slug: 'hi-top-100',
    title: 'Bollywood Top 100',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top Bollywood Songs 2024', 'Latest Hindi Hits', 'Bollywood Chartbusters']
  },
  {
    id: '41229593',
    slug: 'hi-arijit-best',
    title: 'Best of Arijit Singh',
    language: 'Hindi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Arijit_Singh_performance_at_Chandigarh_2025.jpg/500px-Arijit_Singh_performance_at_Chandigarh_2025.jpg',
    searchQueries: ['Arijit Singh Best Songs', 'Arijit Singh Romantic hits', 'Arijit Singh Sad Songs']
  },
  {
    id: '78414171',
    slug: 'hi-romantic',
    title: 'Hindi Romance',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Hindi Romantic Songs', 'Bollywood Love Songs', 'Shreya Ghoshal Romantic']
  },
  {
    id: '33943370',
    slug: 'hi-party',
    title: 'Bollywood Party',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bollywood Party Songs', 'Hindi Dance Hits', 'Badshah Party Songs']
  },
  {
    id: '25391906',
    slug: 'hi-90s',
    title: '90s Bollywood Gold',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['90s Hindi Songs', 'Kumar Sanu Hits', 'Udit Narayan Best Songs']
  },
  {
    id: '49852970',
    slug: 'hi-lofi',
    title: 'Bollywood Lofi Chill',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1516280440502-8610ebac12f4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bollywood Lofi Mix', 'Hindi Lofi Songs', 'Chill Hindi Beats']
  },
  {
    id: '10815663',
    slug: 'hi-sufi',
    title: 'Sufi Soul',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03305a527e4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Sufi Songs Hindi', 'Nusrat Fateh Ali Khan', 'Rahat Fateh Ali Khan Hits']
  },
  {
    id: '42747263',
    slug: 'hi-indie',
    title: 'Hindi Indie',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Hindi Indie Songs', 'Prateek Kuhad', 'Anuv Jain Hits']
  },
  {
    id: '33656870',
    slug: 'hi-devotional',
    title: 'Morning Bhakti',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Hindi Bhajans', 'Morning Devotional Songs', 'Aarti Collection']
  },
  
  // ENGLISH
  {
    id: '38009797',
    slug: 'en-global-top',
    title: 'Global Top 50',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Global Top Hits 2024', 'Billboard Hot 100', 'Top Pop Songs']
  },
  {
    id: '61442114',
    slug: 'en-pop-hits',
    title: 'Pop Perfection',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Pop Hits 2024', 'Taylor Swift Best', 'Dua Lipa Hits']
  },
  {
    id: '80184945',
    slug: 'en-rap-caviar',
    title: 'Rap Culture',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f4bbdc?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Top Rap Songs', 'Drake Hits', 'Eminem Best']
  },
  {
    id: '13237494',
    slug: 'en-rock-classics',
    title: 'Rock Classics',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1502251147048-2624bb183a65?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Classic Rock Hits', 'Queen Best Songs', 'AC/DC Hits']
  },
  {
    id: '25699118',
    slug: 'en-edm',
    title: 'EDM Bangers',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c092fb86f4a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['EDM Top Hits', 'Martin Garrix', 'David Guetta Best']
  },
  {
    id: '37949899',
    slug: 'en-lofi-beats',
    title: 'Lofi Beats',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1516280440502-8610ebac12f4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Lofi hip hop radio', 'Chill beats to study', 'Lofi aesthetics']
  },
  {
    id: '52292633',
    slug: 'en-rnb',
    title: 'R&B Grooves',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1485303254060-e8b8359cdcb3?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['R&B hits 2024', 'The Weeknd Hits', 'Bruno Mars Best']
  },

  // PUNJABI
  {
    id: '93595194',
    slug: 'pa-top-hits',
    title: 'Punjabi Top Hits',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1531651008558-ed1c403ba49a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Punjabi Songs', 'Punjabi Top Hits 2024']
  },
  {
    id: '81842746',
    slug: 'pa-karan-aujla',
    title: 'Karan Aujla Specials',
    language: 'Punjabi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Karan_Aujla_2020.jpg/500px-Karan_Aujla_2020.jpg',
    searchQueries: ['Karan Aujla All Songs', 'Geeta Di Machine Hits']
  },
  {
    id: '50931800',
    slug: 'pa-diljit',
    title: 'Diljit Dosanjh Hits',
    language: 'Punjabi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Diljit_Dosanjh.jpg',
    searchQueries: ['Diljit Dosanjh Best Songs', 'GOAT Diljit']
  },
  {
    id: '22164189',
    slug: 'pa-sidhu',
    title: 'Sidhu Moose Wala Legacy',
    language: 'Punjabi',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Sidhu_Moose_Wala_during_the_shooting_of_his_film_Moosa_Jatt_%28cropped%29.jpg/500px-Sidhu_Moose_Wala_during_the_shooting_of_his_film_Moosa_Jatt_%28cropped%29.jpg',
    searchQueries: ['Sidhu Moose Wala All Songs', 'Sidhu Moose Wala Hits']
  },
  {
    id: '60062828',
    slug: 'pa-party',
    title: 'Punjabi Party Mix',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Punjabi Party Songs', 'Bhangra Hits', 'AP Dhillon Party']
  },
  {
    id: '80624198',
    slug: 'pa-sad',
    title: 'Punjabi Sad Songs',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Punjabi Sad Songs', 'B Praak Sad Hits', 'Broken Heart Punjabi']
  },
  {
    id: '36529923',
    slug: 'pa-indie',
    title: 'Punjabi Indie & Lofi',
    language: 'Punjabi',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Punjabi Lofi Songs', 'Punjabi Indie Pop', 'Chill Punjabi']
  },

  // BHOJPURI
  {
    id: '45534504',
    slug: 'bh-top-hits',
    title: 'Bhojpuri Blockbusters',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1533282960533-51328aa26c26?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Bhojpuri Songs', 'Bhojpuri Hit Songs 2024']
  },
  {
    id: '47997270',
    slug: 'bh-pawan-singh',
    title: 'Pawan Singh Power Hits',
    language: 'Bhojpuri',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Pawan_Singh.jpg/500px-Pawan_Singh.jpg',
    searchQueries: ['Pawan Singh New Songs', 'Pawan Singh Blockbusters']
  },
  {
    id: '83750414',
    slug: 'bh-khesari',
    title: 'Khesari Lal Yadav Hits',
    language: 'Bhojpuri',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Khesari_Lal_Yadav_at_an_event.jpg/500px-Khesari_Lal_Yadav_at_an_event.jpg',
    searchQueries: ['Khesari Lal Yadav Latest', 'Khesari Lal Superhit']
  },
  {
    id: '78645834',
    slug: 'bh-shilpi',
    title: 'Shilpi Raj Sensations',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Shilpi Raj New Songs', 'Shilpi Raj Hit Songs']
  },
  {
    id: '56826225',
    slug: 'bh-party',
    title: 'Bhojpuri DJ Party',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bhojpuri DJ Remix Songs', 'Bhojpuri Dance Hits']
  },
  {
    id: '47213302',
    slug: 'bh-bhakti',
    title: 'Bhojpuri Bhakti',
    language: 'Bhojpuri',
    coverImage: 'https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Bhojpuri Devi Geet', 'Bhojpuri Bhakti Songs']
  },

  // HARYANVI
  {
    id: '13294695',
    slug: 'hr-top',
    title: 'Haryanvi Top Hits',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1531651008558-ed1c403ba49a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Haryanvi Songs', 'Haryanvi DJ Hits']
  },
  {
    id: '97127821',
    slug: 'hr-renuka',
    title: 'Renuka Panwar Hits',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f4bbdc?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Renuka Panwar Best Songs', '52 Gaj Ka Daman']
  },
  {
    id: '25658272',
    slug: 'hr-gulzaar',
    title: 'Gulzaar Chhaniwala Swag',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1502251147048-2624bb183a65?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Gulzaar Chhaniwala New Songs', 'Gulzaar Chhaniwala Hit Songs']
  },
  {
    id: '92132782',
    slug: 'hr-sumit',
    title: 'Sumit Goswami Best',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c092fb86f4a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Sumit Goswami Hit Songs', 'Haryana Roadways Sumit']
  },
  {
    id: '70543051',
    slug: 'hr-danda',
    title: 'Raju Punjabi Classics',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1516280440502-8610ebac12f4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Raju Punjabi Old Hits', 'Raju Punjabi Best Songs']
  },
  {
    id: '74081127',
    slug: 'hr-dj',
    title: 'Haryanvi DJ Mashup',
    language: 'Haryanvi',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Haryanvi DJ Remix 2024', 'Desi DJ Songs']
  },

  // TAMIL
  {
    id: '28677188',
    slug: 'ta-top',
    title: 'Tamil Top 100',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Tamil Hit Songs 2024', 'Tamil Chartbusters']
  },
  {
    id: '59738294',
    slug: 'ta-anirudh',
    title: 'Anirudh Musical',
    language: 'Tamil',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Anirudh_Ravichander.jpg/500px-Anirudh_Ravichander.jpg',
    searchQueries: ['Anirudh Ravichander Hits', 'Anirudh BGM']
  },
  {
    id: '15636004',
    slug: 'ta-ar-rahman',
    title: 'A.R. Rahman Tamil Hits',
    language: 'Tamil',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg/500px-AR_Rahman_at_Premier_Futsal_Press_Meet_%28cropped%29.jpg',
    searchQueries: ['AR Rahman Tamil Hit Songs', '90s AR Rahman Tamil']
  },
  {
    id: '89164127',
    slug: 'ta-yuvan',
    title: 'Yuvan Shankar Raja Magic',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['U1 Hits', 'Yuvan Shankar Raja Best Songs']
  },
  {
    id: '77507941',
    slug: 'ta-romantic',
    title: 'Tamil Melody',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03305a527e4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Tamil Romantic Songs', 'Tamil Love Melody']
  },
  {
    id: '40281479',
    slug: 'ta-kuthu',
    title: 'Tamil Kuthu Hits',
    language: 'Tamil',
    coverImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Tamil Kuthu Songs', 'Thalapathy Vijay Dance Hits']
  },

  // TELUGU
  {
    id: '10941407',
    slug: 'te-top',
    title: 'Telugu Top Hits',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1533282960533-51328aa26c26?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Latest Telugu Hit Songs 2024', 'Tollywood Chartbusters']
  },
  {
    id: '62345580',
    slug: 'te-thaman',
    title: 'Thaman S Musical',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f4bbdc?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Thaman S Hit Songs', 'Thaman BGM']
  },
  {
    id: '23507815',
    slug: 'te-dsp',
    title: 'DSP Blockbusters',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1502251147048-2624bb183a65?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Devi Sri Prasad Hits', 'DSP Telugu Hit Songs']
  },
  {
    id: '87439530',
    slug: 'te-sid-sriram',
    title: 'Sid Sriram Melodies',
    language: 'Telugu',
    coverImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Sid_Sriram_at_Audio_Launch_of_Ninnu_Kori.jpg/500px-Sid_Sriram_at_Audio_Launch_of_Ninnu_Kori.jpg',
    searchQueries: ['Sid Sriram Telugu Hits', 'Sid Sriram Melody Songs']
  },
  {
    id: '33200268',
    slug: 'te-romantic',
    title: 'Telugu Romance',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Telugu Romantic Hits', 'Telugu Love Songs']
  },
  {
    id: '20311457',
    slug: 'te-mass',
    title: 'Tollywood Mass',
    language: 'Telugu',
    coverImage: 'https://images.unsplash.com/photo-1470229722913-7c092fb86f4a?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Telugu Mass Songs', 'Pushpa Songs', 'Allu Arjun Dance Hits']
  },

  // MIXED / OTHER
  {
    id: '13017435',
    slug: 'mix-workout',
    title: 'Workout Beast Mode',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Workout Motivation Music', 'Gym Motivation Songs', 'High Energy Workout Mix']
  },
  {
    id: '11933519',
    slug: 'mix-sleep',
    title: 'Deep Sleep Sounds',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1515814896265-42d45b736b46?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Deep Sleep Music', 'Relaxing Rain Sounds', 'Meditation Music']
  },
  {
    id: '34295334',
    slug: 'mix-gaming',
    title: 'Gaming Mix',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Gaming Music Mix', 'NCS Gaming', 'Dubstep Gaming Mix']
  },
  {
    id: '60951519',
    slug: 'mix-retro',
    title: '80s Retro Synthwave',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['80s Synthwave', 'Retro Synth Pop', 'Vaporwave Mix']
  },
  {
    id: '10683081',
    slug: 'mix-classical',
    title: 'Classical Masterpieces',
    language: 'English',
    coverImage: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Mozart Masterpieces', 'Beethoven Best', 'Classical Music For Studying']
  },
  {
    id: '94543564',
    slug: 'hi-kishore',
    title: 'Kishore Kumar Classics',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Kishore Kumar Hit Songs', 'Kishore Kumar Romantic']
  },
  {
    id: '73522072',
    slug: 'hi-lata',
    title: 'Lata Mangeshkar Melodies',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Lata Mangeshkar Old Hindi Songs', 'Lata Kishore Duets']
  },
  {
    id: '81818008',
    slug: 'hi-ghazals',
    title: 'Soulful Ghazals',
    language: 'Hindi',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03305a527e4?auto=format&fit=crop&q=80&w=500',
    searchQueries: ['Jagjit Singh Ghazals', 'Best Urdu Ghazals', 'Pankaj Udhas Ghazals']
  }
];
