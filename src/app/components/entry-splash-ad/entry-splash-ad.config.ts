// ═══════════════════════════════════════════════════════════════════════
// GanaTube Entry Splash Ad — Configuration
// ─────────────────────────────────────────────────────────────────────────
// 24 ghante me ek baar aane wala entry reward/interstitial ad gate.
// Jab aapke paas ad code script aa jaye, simply ENTRY_SPLASH_CONFIG.adScript me paste kar dein.
// ═══════════════════════════════════════════════════════════════════════

export const ENTRY_SPLASH_CONFIG = {
  // Forced countdown time in seconds before skip unlocks
  countdownSeconds: 6,

  // Cooldown in hours before the splash appears again for the same user
  cooldownHours: 24,

  // LocalStorage key used to track last seen timestamp
  storageKey: 'gt_entry_splash_seen',

  // Safety timeout in milliseconds: agar ad load na ho ya ad-blocker ho,
  // to itni der baad skip button auto-unlock ho jayega taaki user phanse nahi.
  safetyTimeoutMs: 12000,

  // AD NETWORK SCRIPT CODE
  // Paste your script tag / ad unit HTML here when ready.
  // Example: `<script src="https://..."></script>`
  adScript: ``
};
