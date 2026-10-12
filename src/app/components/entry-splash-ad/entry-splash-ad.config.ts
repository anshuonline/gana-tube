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
  // to itni der baad skip button auto-unlock ho jayega taaki user phanse nahi.
  safetyTimeoutMs: 12000,

  // AD NETWORK SCRIPT CODE
  // HilltopAds video slider ad unit
  adScript: `<script>
(function(iplkv){
var d = document,
    s = d.createElement('script'),
    l = d.currentScript || d.scripts[d.scripts.length - 1];
s.settings = iplkv || {};
s.src = "\\/\\/massivesalad.com\\/b.XdVWsVd\\/GHla0fYsWVcF\\/ze\\/mm9Cu_Z\\/Url\\/kiPST\\/cu1cMnTfIT4gNmjMUytvNazTUWx\\/MJjCgA2\\/OiQX";
s.async = true;
s.referrerPolicy = 'no-referrer-when-downgrade';
l.parentNode.insertBefore(s, l);
})({})
</script>`
};
