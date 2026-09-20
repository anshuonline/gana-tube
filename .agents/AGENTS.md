# GanaTube Project Rules

- **STRICT COMPLIANCE**: As an AI Agent, you MUST strictly read, remember, and follow EVERY rule in this `AGENTS.md` file for every single action. These rules are absolute and supersede any standard behavior.

## 1. Git Commits & Pushes (CRITICAL)
- **NEVER** push code directly to the `main` (live) branch unless explicitly instructed by the user ("push to main/live").
- **ALWAYS** push to the `staging` branch first.
- You **MUST** ask the user for permission every single time before running `npm run build` or `git push` on any branch. Do not assume permission just because a task is complete.
- **NEVER FORGET TO PUSH**: Hamesha yaad rakhein ki code change karne ke baad usko turant dono repositories (`manageads` aur `gana-tube`) par push karna hai, baat kar ke bhul nahi jana hai.

## 2. Repositories
This project spans across two primary GitHub repositories:
1. **GanaTube (Frontend)**: Located at `f:\APPS\ganatube`. Contains the Angular frontend codebase. Remote: `https://github.com/anshuonline/gana-tube.git` (branches: `main`, `staging`).
2. **ManageAds (Backend/API)**: Located at `C:\xampp\htdocs\manageads`. Contains the PHP backend APIs (like `playlist-api.php`).

## 3. Frontend Builds (ZERO-TOLERANCE RULE)
- Whenever you modify Angular frontend files (HTML/TS/SCSS/Routing) and receive permission to build, you **MUST ALWAYS** run `npm run build:local`.
- **CRITICAL**: Before committing, you must explicitly run `git add dist/` (or `git add dist/ganatube`) along with your modified source files. The live server serves the `dist/` folder directly. If you forget this step, the live server will not get the updated build.
- **Synchronized Backend Pushes**: If changes are made to the `manageads` backend files, they must also be committed and pushed to their respective repository. Ensure both repositories are pushed if both have been modified.

## 4. API Priority & Music Data Source (CRITICAL RULE)
- **1st PRIORITY ALWAYS**: You **MUST ALWAYS** use the `npm ytmusic api` (YouTube Music API / node-ytmusic / ytmusic-api) as the primary source for all music data (songs, search, artists, albums, recommendations, metadata).
- **NEVER EVER** use custom/personal APIs by default for music data.
- **CUSTOM API AS FALLBACK ONLY (ASK PERMISSION FIRST)**: Custom APIs can **ONLY** be used as a fallback if `npm ytmusic api` fails or lacks a feature, **AND ONLY AFTER EXPLICITLY ASKING THE USER FOR PERMISSION FIRST**. Never write code using custom APIs without asking the user and getting explicit approval.

## 5. Top-Class Engineering
- Always act as a highly intelligent developer. Think deeply about the consequences of your actions and seek the absolute best implementation. Ask yourself "If I do this, what will happen? What is the absolute BEST way to achieve this?"

## 6. UI / UX & Styling Rules (Official Design System)
- **Official Color Palette Document**: For comprehensive guidelines, always refer to [COLOR_PALETTE.md](file:///f:/APPS/ganatube/.agents/COLOR_PALETTE.md).
- **Color Scheme**:
  - **Canvas / Background**: Strictly maintain an **AMOLED Black** background (`#000000`). Never use grays or light mode.
  - **Cards & Surfaces**: AMOLED Deep Card (`#0a0a0f` / `#101016`) with subtle border `rgba(255, 255, 255, 0.08)` and glassmorphic blur.
  - **Text Hierarchy**: Pure **White** (`#ffffff`) for primary headers/icons; `rgba(255, 255, 255, 0.7)` for secondary text; `rgba(255, 255, 255, 0.4)` for muted metadata.
  - **Brand Accent Gradient**: Signature **Purple & Pink Gradient** (`linear-gradient(135deg, #a855f7 0%, #ec4899 100%)` / Tailwind: `from-purple-500 to-pink-500` or `from-purple-600 to-pink-600`) for primary buttons, active tabs, gradient text, and ambient glows.
  - **Delete / Destructive Buttons (STRICT)**: **MUST ALWAYS** be **Red** (`#ef4444` / `bg-red-500/10 text-red-400 border border-red-500/20`).
- **Component Encapsulation**: Every component must have its own dedicated `.scss` file. Do not write component-specific CSS globally inside `app.scss`.
- **No Browser Native Popups**: **NEVER** use `alert()` or `prompt()` in production code (testing is okay, but must be removed). Always build or utilize custom UI input fields, modals, or toast notifications.

## 7. Key Frontend Architecture (`f:\APPS\ganatube\src\app\`)
GanaTube uses modern Angular features like Standalone Components and Signals for state management.

### Core Services (`src/app/services/`)
- **`player.service.ts`**: Manages the global audio player state, queue, current track, playback controls (play, pause, next, prev), and YouTube iframe integration. Uses Signals (`playerState()`, `currentTrack()`, `queue()`).
- **`room.service.ts`**: Handles the "Listen Together" socket connections. Manages room state, chat, synchronized playback, song recommendations (requests), and user roles (Admin vs. Listener).
- **`auth.service.ts` & `user.service.ts`**: Manages user authentication and preferences (like saved playlists and liked songs).

### Key Components (`src/app/components/`)
- **`music-player/`**: The sticky mini-player bar at the bottom of the screen. Handles local playback controls, expanding to full screen, and respects room locks (`isRoomLocked()`) when a non-admin listener is in a room.
- **`full-screen-player/`**: The expanded immersive player view containing large artwork, lyrics, queue, and gesture-based swiping.
- **`rooms/`**: The "Listen Together" feature.
  - `room-view/`: The actual live room interface containing a synchronized player, a queue/requests panel, and live chat.
  - `rooms-discover/`: The lobby to find public rooms or create/join private ones.

## 8. Listen Together (Rooms) Mechanics
- **Host (Admin)**: The creator of the room. Has exclusive control over playback (Play/Pause, Scrubbing, Skipping). Can add songs directly to the queue and accept/reject song requests.
- **Listeners**: Synced automatically to the Host's playback timestamp. Cannot control the player.
- **Song Requests**: Listeners can search for a song and hit "Request Song". This triggers `roomService.requestSong(track)`, which adds the track to the "Requests" tab for the host to review.