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

## 4. Top-Class Engineering
- Always act as a highly intelligent developer. Think deeply about the consequences of your actions and seek the absolute best implementation. Ask yourself "If I do this, what will happen? What is the absolute BEST way to achieve this?"

## 5. UI / UX & Styling Rules
- **Color Scheme**: Strictly maintain an **AMOLED Black** background (`#000000`) with **White** text and icons. No other colors should be used unless explicitly requested by the user, with the sole exception of **Delete buttons** (which should be red).
- **Component Encapsulation**: Every component must have its own dedicated `.scss` file. Do not write component-specific CSS globally inside `app.scss`.
- **No Browser Native Popups**: **NEVER** use `alert()` or `prompt()` in production code (testing is okay, but must be removed). Always build or utilize custom UI input fields, modals, or toast notifications.

## 6. Key Frontend Architecture (`f:\APPS\ganatube\src\app\`)
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

## 7. Listen Together (Rooms) Mechanics
- **Host (Admin)**: The creator of the room. Has exclusive control over playback (Play/Pause, Scrubbing, Skipping). Can add songs directly to the queue and accept/reject song requests.
- **Listeners**: Synced automatically to the Host's playback timestamp. Cannot control the player.
- **Song Requests**: Listeners can search for a song and hit "Request Song". This triggers `roomService.requestSong(track)`, which adds the track to the "Requests" tab for the host to review.