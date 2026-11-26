// When this browser page loaded. Public forms send how long the visitor was
// on the page, and the server drops submissions that come in too fast.
const PAGE_LOADED_AT = typeof window !== 'undefined' ? Date.now() : 0;

export function formElapsedMs() {
  if (!PAGE_LOADED_AT) return 0;
  return Date.now() - PAGE_LOADED_AT;
}
