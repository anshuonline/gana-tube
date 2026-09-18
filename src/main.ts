import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const CACHE_KEY = 'gt_env_config';

function renderOfflinePage() {
  document.body.innerHTML = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        background: #000000 !important;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        user-select: none;
      }
      .offline-wrap {
        position: relative;
        width: 90%;
        max-width: 440px;
        background: #0a0a0f;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 40px 28px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 80px rgba(168, 85, 247, 0.12);
        backdrop-filter: blur(20px);
      }
      .glow-bg {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 180px;
        height: 180px;
        background: radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(168, 85, 247, 0.15) 50%, transparent 70%);
        filter: blur(30px);
        pointer-events: none;
        z-index: 0;
      }
      .icon-box {
        position: relative;
        z-index: 1;
        width: 80px;
        height: 80px;
        margin: 0 auto 24px auto;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      }
      .icon-box svg {
        stroke: #ec4899;
        filter: drop-shadow(0 0 12px rgba(236, 72, 153, 0.5));
        animation: pulse 2.5s ease-in-out infinite;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        padding: 6px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 18px;
      }
      .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ef4444;
        box-shadow: 0 0 8px #ef4444;
        animation: blink 1.5s infinite;
      }
      .offline-title {
        font-size: 24px;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 10px;
        letter-spacing: -0.3px;
      }
      .offline-desc {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.6;
        margin-bottom: 28px;
        padding: 0 10px;
      }
      .retry-btn {
        width: 100%;
        padding: 14px 24px;
        background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
        border: none;
        border-radius: 14px;
        color: #ffffff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 8px 25px rgba(236, 72, 153, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
      }
      .retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 30px rgba(236, 72, 153, 0.5);
      }
      .retry-btn:active {
        transform: translateY(0);
      }
      .app-brand {
        margin-top: 24px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(0.92); opacity: 0.75; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .spin {
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
    </style>
    <div class="offline-wrap">
      <div class="glow-bg"></div>
      <div class="icon-box">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
      </div>
      <div class="status-badge">
        <span class="status-dot"></span>
        <span>No Connection</span>
      </div>
      <h1 class="offline-title">You're Offline</h1>
      <p class="offline-desc">It looks like you've lost your internet connection. Please check your Wi-Fi or mobile data to continue streaming.</p>
      <button class="retry-btn" id="gt-retry-btn" onclick="retryBootstrap()">
        <svg id="retry-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        <span id="retry-text">Try Again</span>
      </button>
      <div class="app-brand">GanaTube Music</div>
    </div>
  `;
}

function startApp(config: any) {
  (window as any).__env = config;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch (e) {}

  bootstrapApplication(App, appConfig).catch(err => {
    console.error('Bootstrap error:', err);
    renderOfflinePage();
  });
}

function tryBootstrap() {
  fetch('/api/config')
    .then(response => {
      if (!response.ok) throw new Error('Network response not ok');
      return response.json();
    })
    .then(config => {
      startApp(config);
    })
    .catch(err => {
      console.warn('Failed to fetch dynamic config from server:', err);
      // If we have a previously cached environment config, use it to start the app
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.firebase && parsed.firebase.apiKey) {
            console.info('Starting app using cached environment configuration.');
            startApp(parsed);
            return;
          }
        }
      } catch (e) {}

      // If no cached config or bootstrap cannot proceed offline, show the AMOLED offline screen
      renderOfflinePage();
    });
}

(window as any).retryBootstrap = function() {
  const btn = document.getElementById('gt-retry-btn');
  const icon = document.getElementById('retry-icon');
  const text = document.getElementById('retry-text');
  if (btn) btn.style.pointerEvents = 'none';
  if (icon) icon.classList.add('spin');
  if (text) text.textContent = 'Connecting...';

  setTimeout(() => {
    window.location.reload();
  }, 400);
};

// Auto-reload as soon as internet connection is restored
window.addEventListener('online', () => {
  console.info('Network connection restored. Reloading GanaTube...');
  window.location.reload();
});

// Initial boot attempt
tryBootstrap();

