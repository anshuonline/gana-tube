# 🧠 GanaTube Algorithm — Engagement & Recommendation Engine

> **Version**: 1.0 — Cookie-Based (No Account System)  
> **Goal**: Maximize session time, repeat visits, and emotional attachment through psychology-driven music recommendation.

---

## Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [Data Layer — Cookie-Based Tracking](#data-layer--cookie-based-tracking)
3. [Algorithm 1: Variable Reward Recommendation](#algorithm-1-variable-reward-recommendation)
4. [Algorithm 2: Skip-Time Silent Feedback](#algorithm-2-skip-time-silent-feedback)
5. [Algorithm 3: Zero Friction Autoplay Queue](#algorithm-3-zero-friction-autoplay-queue)
6. [Algorithm 4: Context-Aware Mood Matching](#algorithm-4-context-aware-mood-matching)
7. [Algorithm 5: Familiarity Bias & Nostalgia Engine](#algorithm-5-familiarity-bias--nostalgia-engine)
8. [Algorithm 6: Social Proof & FOMO Layer](#algorithm-6-social-proof--fomo-layer)
9. [Algorithm 7: Investment Loop (Hook Model)](#algorithm-7-investment-loop-hook-model)
10. [Algorithm 8: Shelf Naming & Personalization Illusion](#algorithm-8-shelf-naming--personalization-illusion)
11. [Scoring Formula](#scoring-formula)
12. [Implementation Priority Roadmap](#implementation-priority-roadmap)

---

## Core Philosophy

```
User ko kabhi ye nahi lagna chahiye ki wo "search kar raha hai."
User ko lagna chahiye ki "app mujhe samajhta hai — ye meri vibe hai."
```

**Three Pillars:**

| Pillar | Psychology | Effect |
|--------|-----------|--------|
| **Reduce Friction** | Decision fatigue hatao | User passive flow state mein chala jaye |
| **Variable Reward** | Slot-machine dopamine | Unpredictability se engagement badhta hai |
| **Emotional Ownership** | "Ye meri playlist hai" | Switching cost badhao, retention badhao |

---

## Data Layer — Cookie-Based Tracking

Since no user account system exists, all behavioral data lives in browser cookies + localStorage.

### Storage Schema

```javascript
// localStorage key: "gt_user_profile"
{
  "version": 1,
  "created_at": "2026-07-02T10:00:00Z",
  "last_session": "2026-07-02T15:30:00Z",
  
  // ─── LISTEN HISTORY (last 200 songs max) ───
  "history": [
    {
      "videoId": "abc123",
      "title": "Tum Hi Ho",
      "artist": "Arijit Singh",
      "genre_tags": ["romantic", "bollywood", "sad"],
      "listened_at": "2026-07-02T15:30:00Z",
      "listen_duration_sec": 245,    // kitna suna
      "total_duration_sec": 280,     // total song length
      "skipped": false,              // skip kiya ya nahi
      "skip_time_sec": null,         // kitne second pe skip kiya
      "source": "recommendation",    // kaha se aaya: search / recommendation / autoplay / shelf
      "listen_count": 3              // kitni baar suna hai total
    }
  ],
  
  // ─── IMPLICIT TASTE PROFILE (auto-calculated) ───
  "taste_profile": {
    "genre_scores": {
      "romantic": 0.85,
      "bollywood": 0.92,
      "sad": 0.65,
      "party": 0.30,
      "lofi": 0.45,
      "sufi": 0.20,
      "punjabi": 0.55,
      "hiphop": 0.15,
      "retro": 0.40,
      "instrumental": 0.10
    },
    "artist_scores": {
      "Arijit Singh": 0.95,
      "Neha Kakkar": 0.60,
      "AP Dhillon": 0.45
    },
    "mood_pattern": {
      "morning": ["energetic", "motivational"],     // 6am - 11am
      "afternoon": ["bollywood", "party"],           // 11am - 5pm  
      "evening": ["romantic", "sufi"],               // 5pm - 9pm
      "night": ["lofi", "sad", "chill"]              // 9pm - 6am
    },
    "day_pattern": {
      "weekday": ["lofi", "chill", "focus"],
      "weekend": ["party", "bollywood", "punjabi"]
    }
  },
  
  // ─── SESSION DATA ───
  "sessions": {
    "total_sessions": 15,
    "avg_session_duration_min": 22,
    "songs_per_session_avg": 8,
    "last_5_sessions": [
      {
        "date": "2026-07-02",
        "duration_min": 35,
        "songs_played": 12,
        "top_genre": "romantic"
      }
    ]
  },
  
  // ─── LIKED SONGS (explicit signal) ───
  "liked_songs": ["videoId1", "videoId2"],
  
  // ─── SKIPPED/DISLIKED (negative signal) ───
  "disliked_songs": ["videoId3"],
  
  // ─── SEARCH HISTORY ───
  "search_history": ["Arijit Singh", "lo-fi beats", "party songs 2026"]
}
```

### Data Limits & Cleanup

| Data Type | Max Entries | Cleanup Rule |
|-----------|-------------|-------------|
| Listen History | 200 songs | FIFO — oldest removed first |
| Liked Songs | 100 songs | No auto-cleanup |
| Disliked Songs | 50 songs | Clear after 30 days |
| Search History | 30 queries | FIFO |
| Sessions | 5 recent | Rolling window |

### Cookie Size Management
- Total localStorage budget: ~5MB (safe limit)
- Compress by storing only `videoId` + essential metadata
- Full song details fetched from YouTube API when needed

---

## Algorithm 1: Variable Reward Recommendation

> **Psychology**: Slot machine effect — unpredictability creates dopamine hits. If every recommendation is perfect, brain gets bored. If random, trust breaks. The sweet spot is controlled randomness.

### The 60-20-10 Formula

```
┌─────────────────────────────────────────────────┐
│          RECOMMENDATION MIX RATIO               │
│                                                  │
│  ████████████████████████  60-70%  SAFE ZONE     │
│  ██████████              20-30%  DISCOVERY       │
│  ████                    ~10%   WILDCARD         │
│                                                  │
│  Safe = matches history strongly                 │
│  Discovery = related but new                     │
│  Wildcard = completely random genre/mood         │
│         → occasionally ek banger nikalta hai     │
│         → THIS is the dopamine hit               │
└─────────────────────────────────────────────────┘
```

### Implementation Logic

```
FUNCTION generateRecommendationShelf(shelfSize = 15):
  
  userProfile = loadFromLocalStorage("gt_user_profile")
  currentMood = detectCurrentMood(timeOfDay, dayOfWeek)
  
  // ─── STEP 1: Calculate slot counts ───
  safeCount     = floor(shelfSize * 0.65)       // ~10 songs
  discoveryCount = floor(shelfSize * 0.25)      // ~4 songs  
  wildcardCount  = shelfSize - safeCount - discoveryCount  // ~1 song
  
  // ─── STEP 2: Generate SAFE songs (familiar territory) ───
  safeQueries = []
  topGenres = getTopN(userProfile.taste_profile.genre_scores, 3)
  topArtists = getTopN(userProfile.taste_profile.artist_scores, 2)
  
  FOR EACH genre IN topGenres:
    safeQueries.push("best {genre} songs 2026")
    safeQueries.push("{genre} hits")
  
  FOR EACH artist IN topArtists:
    safeQueries.push("{artist} songs")
  
  safeSongs = searchYouTube(randomPick(safeQueries, 3), safeCount)
  
  // ─── STEP 3: Generate DISCOVERY songs (adjacent new) ───
  // Find genres user has SOME interest in but hasn't explored deeply
  midGenres = getGenresWithScore(userProfile, 0.20, 0.50)  // medium interest
  relatedArtists = findRelatedArtists(topArtists)
  
  discoveryQueries = []
  FOR EACH genre IN midGenres:
    discoveryQueries.push("trending {genre} songs")
    discoveryQueries.push("new {genre} releases 2026")
  
  discoverySongs = searchYouTube(randomPick(discoveryQueries, 2), discoveryCount)
  
  // ─── STEP 4: Generate WILDCARD songs (pure surprise) ───
  // Pick genres user has NEVER or RARELY listened to
  coldGenres = getGenresWithScore(userProfile, 0.0, 0.15)
  wildcardQuery = randomPick(["viral {coldGenre} hits", 
                               "best {coldGenre} songs ever",
                               "trending {coldGenre} 2026"], 1)
  
  wildcardSongs = searchYouTube(wildcardQuery, wildcardCount)
  
  // ─── STEP 5: Shuffle & Interleave ───
  // Don't group by type — mix them so user can't predict pattern
  finalShelf = interleave(safeSongs, discoverySongs, wildcardSongs)
  
  // ─── STEP 6: Remove already-heard (unless nostalgia trigger) ───
  // Keep 15% of already-heard songs (familiarity bias)
  finalShelf = filterWithNostalgiaKeep(finalShelf, userProfile.history, keepRatio=0.15)
  
  RETURN finalShelf
```

### Dynamic Ratio Adjustment

```
// New user (< 5 songs listened) → more safe, less wildcard
IF userProfile.history.length < 5:
  safeRatio = 0.80
  discoveryRatio = 0.15
  wildcardRatio = 0.05

// Engaged user (50+ songs) → increase discovery
IF userProfile.history.length > 50:
  safeRatio = 0.55
  discoveryRatio = 0.30
  wildcardRatio = 0.15

// Stale user (hasn't visited in 3+ days) → heavy nostalgia
IF daysSinceLastSession > 3:
  safeRatio = 0.70      // familiar stuff to bring them back
  discoveryRatio = 0.20
  wildcardRatio = 0.10
  ADD "Welcome back" shelf with their most-played songs
```

---

## Algorithm 2: Skip-Time Silent Feedback

> **Psychology**: Explicit like/dislike pe depend mat karo — log rarely dabate hain. Behavior lie nahi karta. Skip-time is the most honest signal.

### Signal Classification

```
┌──────────────────────────────────────────────────────┐
│              SKIP-TIME SIGNAL MAP                     │
│                                                       │
│  0-5 sec skip    →  STRONG NEGATIVE  (-0.8 score)    │
│  5-15 sec skip   →  MILD NEGATIVE    (-0.3 score)    │
│  15-30 sec listen →  NEUTRAL          (0.0 score)    │
│  30-60 sec listen →  MILD POSITIVE   (+0.3 score)    │
│  60+ sec listen  →  POSITIVE          (+0.6 score)   │
│  Full song       →  STRONG POSITIVE  (+1.0 score)    │
│  Repeat play     →  STRONGEST        (+1.5 score)    │
│  Explicit like   →  BOOST            (+2.0 score)    │
│  Explicit skip   →  STRONG NEGATIVE  (-1.0 score)    │
└──────────────────────────────────────────────────────┘
```

### Tracking Implementation

```
FUNCTION trackSongEngagement(song, startTime):
  
  ON song_end OR song_skip OR song_change:
    listenDuration = now() - startTime
    totalDuration = song.duration
    completionRatio = listenDuration / totalDuration
    
    // Calculate engagement score
    IF listenDuration < 5:
      score = -0.8     // instant skip = hate it
    ELIF listenDuration < 15:
      score = -0.3     // quick skip = not interested
    ELIF listenDuration < 30:
      score = 0.0      // neutral — gave it a chance
    ELIF completionRatio < 0.5:
      score = 0.3      // decent interest
    ELIF completionRatio < 0.85:
      score = 0.6      // liked it
    ELSE:
      score = 1.0      // loved it — full listen
    
    // Repeat bonus
    IF song.videoId IN recentlyPlayed(last_24h):
      score += 0.5     // repeat = strong positive
    
    // Update taste profile
    updateGenreScores(song.genre_tags, score)
    updateArtistScore(song.artist, score)
    
    // Save to history
    saveToHistory(song, listenDuration, score)
```

### Genre Score Decay

```
// Scores decay over time — recent behavior matters more
FUNCTION decayScores():
  FOR EACH genre IN taste_profile.genre_scores:
    daysSinceLastListen = daysSince(lastListenDate[genre])
    
    IF daysSinceLastListen > 7:
      genre.score *= 0.95    // slight decay after 1 week
    IF daysSinceLastListen > 14:
      genre.score *= 0.85    // noticeable decay after 2 weeks
    IF daysSinceLastListen > 30:
      genre.score *= 0.70    // significant decay after 1 month
    
    // Floor at 0.05 — never fully forget a taste
    genre.score = max(genre.score, 0.05)
```

---

## Algorithm 3: Zero Friction Autoplay Queue

> **Psychology**: Jitna zyada user ko choose karna padega, utna jaldi app chodega. Goal: passive consumption flow state.

### Queue Generation Logic

```
FUNCTION generateAutoplayQueue(currentSong, queueSize = 20):
  
  // Rule 1: Start with "more like this"
  // Find songs similar to what's currently playing
  similarSongs = searchYouTube(
    "{currentSong.artist} similar songs",
    "songs like {currentSong.title}",
    limit = 8
  )
  
  // Rule 2: Mix in taste profile matches
  profileSongs = generateFromTasteProfile(
    currentMood = detectCurrentMood(),
    limit = 7
  )
  
  // Rule 3: Add wildcard surprises
  wildcardSongs = generateWildcard(limit = 3)
  
  // Rule 4: Sprinkle nostalgia (songs from history user loved)
  nostalgiaSongs = getFromHistory(
    filter = "score > 0.8 AND listen_count >= 2",
    limit = 2
  )
  
  // Combine and shuffle (but keep first 3 as "similar to current")
  queue = similarSongs[0:3] 
        + shuffle(similarSongs[3:] + profileSongs + wildcardSongs + nostalgiaSongs)
  
  // Remove duplicates and recently played (last 2 hours)
  queue = removeDuplicates(queue)
  queue = removeRecentlyPlayed(queue, window = 2_hours)
  
  RETURN queue[0:queueSize]


// ─── SEAMLESS TRANSITION ───
// Pre-load next song data when current song is at 80% completion
ON currentSong.progress >= 0.80:
  IF queue is empty OR queue.length < 3:
    queue = generateAutoplayQueue(currentSong)
  prefetchNextSong(queue[0])

// ─── AUTO-ADVANCE ───
ON currentSong.ended:
  nextSong = queue.shift()
  playSong(nextSong)
  // Silently generate more queue in background if running low
  IF queue.length < 5:
    appendToQueue(generateAutoplayQueue(nextSong, 10))
```

### "Continue Listening" (Session Resume)

```
FUNCTION getSessionResume():
  lastSession = loadFromStorage("gt_last_session")
  
  IF lastSession AND hoursSince(lastSession.timestamp) < 48:
    RETURN {
      type: "continue",
      label: "Continue where you left off",
      song: lastSession.lastSong,
      queue: lastSession.remainingQueue,
      position: lastSession.pausePosition  // resume from exact second
    }
  
  ELIF lastSession AND hoursSince(lastSession.timestamp) < 168:  // 1 week
    RETURN {
      type: "jump_back",
      label: "Jump back in",
      songs: lastSession.topSongsFromSession
    }
  
  ELSE:
    RETURN {
      type: "fresh",
      label: "Start fresh with today's picks"
    }
```

---

## Algorithm 4: Context-Aware Mood Matching

> **Psychology**: "Ye app mujhe samajhta hai" — even if underlying algorithm is same, context-aware framing creates perceived personalization.

### Time-of-Day Mood Map

```
┌─────────────────────────────────────────────────────────┐
│               TIME-BASED MOOD ENGINE                     │
│                                                          │
│  🌅 06:00 - 10:59  MORNING                              │
│     Default mood: energetic, motivational, fresh         │
│     Queries: "morning motivation songs",                 │
│              "feel good Hindi songs",                    │
│              "workout Bollywood playlist"                │
│                                                          │
│  ☀️ 11:00 - 16:59  AFTERNOON                             │
│     Default mood: upbeat, Bollywood, pop                 │
│     Queries: "trending Bollywood hits",                  │
│              "latest Hindi pop songs",                   │
│              "office chill music Hindi"                   │
│                                                          │
│  🌆 17:00 - 20:59  EVENING                               │
│     Default mood: romantic, melodic, sufi                │
│     Queries: "romantic Hindi songs evening",             │
│              "sufi music playlist",                      │
│              "soulful Bollywood melodies"                │
│                                                          │
│  🌙 21:00 - 05:59  NIGHT                                 │
│     Default mood: lofi, chill, sad, acoustic             │
│     Queries: "lo-fi Hindi beats night",                  │
│              "late night Bollywood sad songs",            │
│              "acoustic Hindi covers chill"               │
└─────────────────────────────────────────────────────────┘
```

### Mood Override by User Behavior

```
FUNCTION detectCurrentMood():
  hour = currentHour()
  day = currentDay()  // weekday or weekend
  
  // Base mood from time
  baseMood = TIME_MOOD_MAP[getTimeSlot(hour)]
  
  // Check if user's actual pattern differs from default
  userPattern = userProfile.taste_profile.mood_pattern[getTimeSlot(hour)]
  
  IF userPattern AND userPattern.confidence > 0.6:
    // User has established a different pattern — respect it
    // e.g., user listens to party songs at night, not lofi
    mood = userPattern.genres
  ELSE:
    mood = baseMood
  
  // Weekend override
  IF day IN ["Saturday", "Sunday"]:
    weekendPattern = userProfile.taste_profile.day_pattern.weekend
    IF weekendPattern:
      mood = blendMoods(mood, weekendPattern, weekendWeight = 0.4)
  
  RETURN mood


// ─── PATTERN LEARNING ───
// After each session, update the mood pattern
FUNCTION updateMoodPattern(songsPlayed, timeSlot):
  genreFrequency = countGenres(songsPlayed)
  topGenres = getTopN(genreFrequency, 3)
  
  currentPattern = userProfile.taste_profile.mood_pattern[timeSlot]
  
  // Exponential moving average — recent sessions weigh more
  alpha = 0.3
  FOR EACH genre IN topGenres:
    currentPattern[genre].score = 
      alpha * newScore + (1 - alpha) * currentPattern[genre].score
  
  save(userProfile)
```

---

## Algorithm 5: Familiarity Bias & Nostalgia Engine

> **Psychology**: Mere Exposure Effect — same song baar baar dikhana liking badhata hai. Repeat listens engagement signal hai, punishment nahi.

### Nostalgia Trigger Rules

```
FUNCTION generateNostalgiaShelf():
  
  // Pull songs user has listened to 2+ times with high scores
  lovedSongs = userProfile.history.filter(
    song => song.listen_count >= 2 AND song.engagement_score > 0.7
  )
  
  // Sort by emotional weight (combination of listen count + recency gap)
  FOR EACH song IN lovedSongs:
    daysSinceLastListen = daysSince(song.last_listened_at)
    
    // Sweet spot: songs listened 1-4 weeks ago (not too recent, not forgotten)
    IF daysSinceLastListen >= 7 AND daysSinceLastListen <= 30:
      song.nostalgia_score = song.listen_count * 1.5  // boost
    ELIF daysSinceLastListen > 30:
      song.nostalgia_score = song.listen_count * 1.2  // still good
    ELSE:
      song.nostalgia_score = song.listen_count * 0.5  // too recent, lower priority
  
  // Sort by nostalgia_score descending
  lovedSongs.sort(by = nostalgia_score, desc)
  
  RETURN {
    title: "Your Favorites — On Repeat 🔁",
    songs: lovedSongs[0:10]
  }


// ─── "Because You Listened To X" Shelf ───
FUNCTION generateBecauseYouListened():
  // Pick a recently loved song
  recentLoved = userProfile.history.filter(
    song => song.engagement_score > 0.8 AND daysSince(song.listened_at) < 7
  )
  
  IF recentLoved.length == 0: RETURN null
  
  seedSong = randomPick(recentLoved)
  
  relatedSongs = searchYouTube(
    "songs like {seedSong.title} {seedSong.artist}",
    limit = 12
  )
  
  RETURN {
    title: "Because you listened to {seedSong.title}",
    subtitle: seedSong.artist,
    songs: relatedSongs
  }
```

---

## Algorithm 6: Social Proof & FOMO Layer

> **Psychology**: Conformity bias — log wahi sunna chahte hain jo "sab sun rahe hain."

### Implementation (No Account Needed)

```
// These shelves use YouTube's own trending/popular data
// No user base needed — leverage YouTube's social proof

TRENDING_SHELVES = [
  {
    title: "🔥 Trending Right Now",
    query: "trending Hindi songs today 2026",
    refresh: "every 6 hours",
    psychology: "FOMO — miss nahi karna chahte"
  },
  {
    title: "🇮🇳 #1 in India Today",
    query: "most played Hindi songs India today",
    refresh: "every 12 hours",
    psychology: "Social proof — country level validation"
  },
  {
    title: "💥 Viral This Week",
    query: "viral Hindi songs this week reels",
    refresh: "every 24 hours",
    psychology: "FOMO + discovery — Instagram/reels connection"
  },
  {
    title: "🏆 All Time Legends",
    query: "most viewed Bollywood songs all time",
    refresh: "weekly",
    psychology: "Authority bias — proven quality"
  }
]

// ─── View Count Display ───
// Always show play counts on cards (even approximate)
// "2.5M plays" creates instant social validation
FUNCTION formatPlayCount(viewCount):
  IF viewCount > 1_000_000_000: RETURN "{x}B plays"
  IF viewCount > 1_000_000:     RETURN "{x}M plays"  
  IF viewCount > 1_000:         RETURN "{x}K plays"
  RETURN "{viewCount} plays"
```

---

## Algorithm 7: Investment Loop (Hook Model)

> **Psychology**: Trigger → Action → Variable Reward → Investment. Har investment action switching cost badhata hai.

```
┌──────────────────────────────────────────────────────────┐
│                    HOOK MODEL CYCLE                       │
│                                                           │
│    ┌──────────┐     ┌──────────┐     ┌──────────────┐    │
│    │ TRIGGER  │────▶│  ACTION  │────▶│   VARIABLE   │    │
│    │          │     │          │     │    REWARD     │    │
│    └──────────┘     └──────────┘     └──────┬───────┘    │
│         ▲                                    │            │
│         │           ┌──────────────┐         │            │
│         └───────────│  INVESTMENT  │◀────────┘            │
│                     └──────────────┘                      │
│                                                           │
│  TRIGGER:  App open / "Daily Mix ready" / browse icon     │
│  ACTION:   Tap play / tap shelf / tap song card           │
│  REWARD:   Song plays — sometimes great, sometimes meh   │
│  INVEST:   Like ❤️ / Skip ⏭ / Search / Listen duration   │
│            → Every action teaches the algorithm           │
│            → More investment = better recommendations     │
│            → Better recommendations = harder to leave     │
└──────────────────────────────────────────────────────────┘
```

### Investment Actions (Cookie-Based)

```
INVESTMENT_ACTIONS = {
  // Each action stores data that improves future recommendations
  
  "like_song": {
    storage: "liked_songs[] in localStorage",
    impact: "Boosts genre/artist scores by +2.0",
    ui: "Heart icon on every song card — ONE TAP",
    switching_cost: "User thinks 'my likes are here, nahi jaaunga'"
  },
  
  "skip_song": {
    storage: "implicit via history[].skipped",
    impact: "Reduces genre score, removes from future recommendations",
    ui: "Next button — already exists",
    switching_cost: "Algorithm learned what you DON'T like"
  },
  
  "search_query": {
    storage: "search_history[] in localStorage",
    impact: "Reveals explicit intent — strongest signal after like",
    ui: "Search bar with history dropdown",
    switching_cost: "Search history = personalized suggestions"
  },
  
  "full_listen": {
    storage: "history[].listen_duration",
    impact: "Strongest implicit positive signal (+1.0)",
    ui: "No UI needed — tracked silently",
    switching_cost: "200 songs of behavioral data = irreplaceable"
  },
  
  "repeat_play": {
    storage: "history[].listen_count",
    impact: "Repeat = love. Boost score +1.5",
    ui: "No UI needed — tracked silently",
    switching_cost: "App knows your comfort songs"
  }
}
```

---

## Algorithm 8: Shelf Naming & Personalization Illusion

> **Psychology**: Naming se lagta hai ki ye 100% unique hai. User sochta hai "ye meri playlist hai," na ki "ye algorithm ne banayi."

### Smart Shelf Name Generator

```
FUNCTION generateShelfNames(userProfile):
  
  topGenre = getTopGenre(userProfile)
  topArtist = getTopArtist(userProfile)
  timeSlot = getTimeSlot(currentHour())
  
  SHELVES = [
    // ─── PERSONALIZED NAMING (creates ownership) ───
    {
      query: buildQueryFromProfile(topGenre),
      name: pickRandom([
        "Made For You 💜",
        "Your Daily Mix",
        "Curated Just For You",
        "{topGenre} — Your Vibe"
      ])
    },
    
    // ─── TIME-CONTEXT NAMING (creates "it understands me") ───
    {
      query: buildQueryFromMood(timeSlot),
      name: pickRandom({
        morning: ["Your Morning Boost ☀️", "Start Your Day Right", "Rise & Shine Mix"],
        afternoon: ["Afternoon Vibes 🎵", "Midday Energy", "Your Afternoon Soundtrack"],
        evening: ["Evening Melodies 🌆", "Sunset Sessions", "Wind Down With These"],
        night: ["Late Night Feels 🌙", "Night Mode 🎧", "Midnight Melodies"]
      }[timeSlot])
    },
    
    // ─── NOSTALGIA NAMING (emotional trigger) ───
    {
      query: buildNostalgiaQuery(userProfile),
      name: pickRandom([
        "Your Favorites — On Repeat 🔁",
        "Songs You Can't Stop Playing",
        "Your Top Tracks",
        "Comfort Zone 💛"
      ])
    },
    
    // ─── DISCOVERY NAMING (curiosity trigger) ───
    {
      query: buildDiscoveryQuery(userProfile),
      name: pickRandom([
        "You Might Love These ✨",
        "Fresh Finds For You",
        "Hidden Gems 💎",
        "Discover Something New"
      ])
    },
    
    // ─── ARTIST-BASED NAMING ───
    {
      query: "{topArtist} best songs mix",
      name: pickRandom([
        "More of {topArtist}",
        "{topArtist} Radio",
        "Because You Love {topArtist}"
      ])
    },
    
    // ─── SOCIAL PROOF NAMING ───
    {
      query: "trending Hindi songs today",
      name: pickRandom([
        "🔥 Trending Right Now",
        "Everyone's Listening To This",
        "Today's Biggest Hits",
        "#1 in India Right Now"
      ])
    }
  ]
  
  RETURN SHELVES
```

---

## Scoring Formula

### Master Song Score (for ranking any song in any shelf)

```
FUNCTION calculateSongScore(song, userProfile, context):
  
  score = 0.0
  
  // ─── 1. Genre Match (weight: 0.30) ───
  genreMatchScore = 0
  FOR EACH tag IN song.genre_tags:
    genreMatchScore += userProfile.taste_profile.genre_scores[tag] || 0
  genreMatchScore = genreMatchScore / song.genre_tags.length
  score += genreMatchScore * 0.30
  
  // ─── 2. Artist Affinity (weight: 0.25) ───
  artistScore = userProfile.taste_profile.artist_scores[song.artist] || 0
  score += artistScore * 0.25
  
  // ─── 3. Recency/Freshness (weight: 0.15) ───
  // Newer songs get slight boost (people prefer new releases)
  daysSinceUpload = daysSince(song.publishedAt)
  IF daysSinceUpload < 7:      freshnessScore = 1.0
  ELIF daysSinceUpload < 30:   freshnessScore = 0.8
  ELIF daysSinceUpload < 90:   freshnessScore = 0.6
  ELIF daysSinceUpload < 365:  freshnessScore = 0.4
  ELSE:                        freshnessScore = 0.2
  score += freshnessScore * 0.15
  
  // ─── 4. Popularity/Social Proof (weight: 0.10) ───
  // Normalized view count (log scale to prevent mega-hits dominating)
  popularityScore = min(log10(song.viewCount + 1) / 10, 1.0)
  score += popularityScore * 0.10
  
  // ─── 5. Context Match (weight: 0.10) ───
  moodMatch = calculateMoodMatch(song, context.currentMood)
  score += moodMatch * 0.10
  
  // ─── 6. Novelty Bonus (weight: 0.10) ───
  // Songs user hasn't heard get a curiosity bonus
  IF song.videoId NOT IN userProfile.history:
    score += 0.10
  ELSE:
    // But loved repeats also get a nostalgia bonus
    historyEntry = findInHistory(song.videoId)
    IF historyEntry.engagement_score > 0.8:
      score += 0.05  // nostalgia boost
  
  // ─── PENALTIES ───
  // Penalize songs user skipped quickly
  IF song.videoId IN userProfile.history:
    entry = findInHistory(song.videoId)
    IF entry.skipped AND entry.skip_time_sec < 5:
      score -= 0.30  // strong penalty for instant-skip songs
  
  // Penalize disliked songs
  IF song.videoId IN userProfile.disliked_songs:
    score -= 0.50
  
  RETURN clamp(score, 0.0, 1.0)
```

### Score Weight Summary

| Factor | Weight | Signal Type |
|--------|--------|------------|
| Genre Match | 30% | Implicit (from history) |
| Artist Affinity | 25% | Implicit + Explicit |
| Freshness | 15% | Metadata |
| Social Proof | 10% | YouTube data |
| Context/Mood | 10% | Time-based |
| Novelty/Nostalgia | 10% | History-based |

---

## Implementation Priority Roadmap

### Phase 1 — Foundation (Do First) 🔴
> These create the core behavioral tracking that everything else depends on.

| # | Feature | Effort | Impact | Detail |
|---|---------|--------|--------|--------|
| 1 | **Skip-time tracking** | Low | 🔥🔥🔥 | Track listen duration on every song play. Save to localStorage. Most valuable implicit signal. |
| 2 | **Listen history in localStorage** | Low | 🔥🔥🔥 | Save last 200 songs with engagement data. Foundation for everything. |
| 3 | **Autoplay next song** | Medium | 🔥🔥🔥 | Pre-calculate next song queue. Auto-advance on song end. Zero friction. |
| 4 | **Session resume** | Low | 🔥🔥 | Save last played song + position. "Continue listening" on return. |

### Phase 2 — Personalization (After Foundation) 🟡
> Use the collected data to create personalized shelves.

| # | Feature | Effort | Impact | Detail |
|---|---------|--------|--------|--------|
| 5 | **Taste profile calculation** | Medium | 🔥🔥🔥 | Auto-calculate genre_scores and artist_scores from history. |
| 6 | **Variable reward shelves** | Medium | 🔥🔥🔥 | 60/20/10 ratio recommendation shelves. The core algorithm. |
| 7 | **Like button (heart)** | Low | 🔥🔥 | One-tap like on every song card. Explicit positive signal. |
| 8 | **"Because you listened to X"** | Medium | 🔥🔥 | Dynamic shelf based on recent loved songs. |

### Phase 3 — Context & Polish 🟢
> Make the app feel "intelligent" and personal.

| # | Feature | Effort | Impact | Detail |
|---|---------|--------|--------|--------|
| 9 | **Time-of-day mood matching** | Medium | 🔥🔥 | Morning/afternoon/evening/night contextual shelves. |
| 10 | **Smart shelf naming** | Low | 🔥🔥 | "Made For You", "Your Evening Melodies" — personalization illusion. |
| 11 | **Genre score decay** | Low | 🔥 | Scores slowly decay over time. Recent behavior > old behavior. |
| 12 | **View count display** | Low | 🔥 | Social proof on every card — "2.5M plays". |

### Phase 4 — Future (Needs Account System) 🔵
> These require user accounts and are planned for later.

| # | Feature | Needs | Detail |
|---|---------|-------|--------|
| 13 | Playlists | Account | User-created playlists. Strongest investment action. |
| 14 | Cross-device sync | Account | Same profile everywhere. |
| 15 | Friends activity | Account + Social | "Your friends are listening to..." |
| 16 | Collaborative filtering | User base | "Users like you also listened to..." |

---

> **Remember**: Algorithm ka goal music recommend karna nahi hai.  
> Algorithm ka goal **user ko flow state mein daalna** hai —  
> jahan wo actively choose nahi kar raha, bas sun raha hai,  
> aur har 10th song pe ek surprise banger aa jaata hai  
> jo usse app se emotionally attach kar deta hai. 🎧
