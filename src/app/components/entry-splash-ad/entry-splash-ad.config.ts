// ═══════════════════════════════════════════════════════════════════════
// GanaTube Entry Splash Ad — Configuration
// ─────────────────────────────────────────────────────────────────────────
// 24 ghante me ek baar aane wala entry reward/interstitial ad gate.
// Jab aapke paas ad code script aa jaye, simply ENTRY_SPLASH_CONFIG.adScript me paste kar dein.
// ═══════════════════════════════════════════════════════════════════════

export const ENTRY_SPLASH_CONFIG = {
  // Master toggle: set to true when ad script is ready to go live
  enabled: true,

  // Forced countdown time in seconds before skip unlocks
  countdownSeconds: 6,

  // Cooldown in hours before the splash appears again for the same user
  cooldownHours: 24,

  // LocalStorage key used to track last seen timestamp
  storageKey: 'gt_entry_splash_seen',

  // Safety timeout in milliseconds: agar ad load na ho ya ad-blocker ho,
  // to itni der baad countdown auto-start ho jayega taaki user phanse nahi.
  safetyTimeoutMs: 6000,

  // AD NETWORK SCRIPT CODE
  // Adsterra 300x250 Banner Ad Unit
  adScript: `<script>
  atOptions = {
    'key' : 'ea39d6f7f9636d606fda87856f77c46e',
    'format' : 'iframe',
    'height' : 250,
    'width' : 300,
    'params' : {}
  };
</script>
<script src="https://www.highrevenueformat.com/ea39d6f7f9636d606fda87856f77c46e/invoke.js"></script>`
};
