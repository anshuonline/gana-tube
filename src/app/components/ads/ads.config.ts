// ═══════════════════════════════════════════════════════════════════════
// GanaTube Hardcore Ads — Central Ad Network Config
// ─────────────────────────────────────────────────────────────────────────
// Direct ad-network tags (ManageAds backend removed).
// Popunder & Smartlink intentionally NOT included (project rule).
// ═══════════════════════════════════════════════════════════════════════

export interface AdsterraTag {
  key: string;
  width: number;
  height: number;
}

export const ADSTERRA_TAGS = {
  banner160x300: { key: 'cbd58a293fd524def4a4689162fc3fe0', width: 160, height: 300 },
  banner300x250: { key: 'ea39d6f7f9636d606fda87856f77c46e', width: 300, height: 250 },
  banner320x50: { key: '2d019fa88a32e182c15ff12021a92452', width: 320, height: 50 },
  banner468x60: { key: 'aa734b0c84d5650e2fa3c8777ef6efc8', width: 468, height: 60 },
  banner728x90: { key: '2fe003803d51e18bb4f9de910a1720e4', width: 728, height: 90 }
} as const satisfies Record<string, AdsterraTag>;

export const NATIVE_BANNER = {
  scriptUrl:
    'https://pl30834380.profitableratecpmnetwork.com/9b1942652a0c298126cec3623689ea32/invoke.js',
  containerId: 'container-9b1942652a0c298126cec3623689ea32'
};

export const SOCIAL_BAR_SCRIPT =
  'https://pl30834381.profitableratecpmnetwork.com/fd/df/42/fddf427a865916017c37e1552ebb5bc9.js';

/** Builds the Adsterra iframe-sync srcdoc document */
export function buildAdsterraSrcdoc(tag: AdsterraTag): string {
  return (
    `<html><head><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>` +
    `<script>atOptions = { 'key' : '${tag.key}', 'format' : 'iframe', 'height' : ${tag.height}, 'width' : ${tag.width}, 'params' : {} };</script>` +
    `<script src="https://www.highrevenueformat.com/${tag.key}/invoke.js"></script>` +
    `</body></html>`
  );
}

/** Picks the best leaderboard size for the current viewport width */
export function pickLeaderboardTag(vw: number): AdsterraTag {
  if (vw >= 900) return ADSTERRA_TAGS.banner728x90;
  if (vw >= 500) return ADSTERRA_TAGS.banner468x60;
  return ADSTERRA_TAGS.banner320x50;
}
