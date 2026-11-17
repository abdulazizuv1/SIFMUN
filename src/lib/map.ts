/* The venue map. The admin pastes either a Google Maps "Embed a map" snippet (the whole
   <iframe ...> code or just its link) or an OpenStreetMap embed link. Nothing else is
   ever put into the iframe, so a typo or a pasted stranger's link cannot load another site. */

const ALLOWED: { host: string; path: string }[] = [
  { host: 'www.google.com', path: '/maps/embed' },
  { host: 'www.openstreetmap.org', path: '/export/embed' },
]

/** Returns a safe embed address, or null when the text is empty or not a known map embed. */
export function parseMapEmbed(input: string | null | undefined): string | null {
  if (!input) return null
  const fromIframe = input.match(/src\s*=\s*["']([^"']+)["']/i)
  const raw = (fromIframe ? fromIframe[1] : input).trim().replace(/&amp;/g, '&')
  try {
    const url = new URL(raw)
    const ok = url.protocol === 'https:' && ALLOWED.some((a) => url.hostname === a.host && url.pathname.startsWith(a.path))
    return ok ? url.toString() : null
  } catch {
    return null
  }
}

/** Google embed links carry the pin as ...!2d<longitude>!3d<latitude>... */
export function coordsFromEmbed(url: string | null): { lat: number; lng: number } | null {
  if (!url) return null
  const m = url.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/)
  if (!m) return null
  const lng = Number(m[1])
  const lat = Number(m[2])
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}
