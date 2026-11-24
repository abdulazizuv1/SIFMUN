/* The scroll film engine for the home hero.

   Framework-free on purpose: it is mounted once from a React effect and from then
   on talks to the DOM directly. Nothing in here sets React state, so scrolling
   never re-renders anything.

   What it does:
   - the film is downloaded in full first, as a Blob (hosts without HTTP Range
     support cannot seek a plain <video src>), by preloadFilm() below; the film is
     only mounted once that has finished, so nobody scrolls through a half-loaded film;
   - eases the displayed time toward the scroll position in a rAF loop that rests
     when converged and while the hero is off screen;
   - gates seeks so only one is ever in flight;
   - drives the caption bands, writing to the DOM only when a value changed;
   - falls back to four stills if the film never arrives. */
import { clamp } from './motion'

/** Visitors matching any of these get the composed still hero instead of the film. */
export const HERO_GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)',
]

// Kept referenced at module level: unreferenced query lists have lost their listeners in old browsers.
let gateLists: MediaQueryList[] | null = null
const lists = () => (gateLists ??= HERO_GATES.map((q) => matchMedia(q)))

export function scrubAllowed(): boolean {
  if (typeof matchMedia !== 'function') return false
  return !lists().some((m) => m.matches)
}

export function watchGates(cb: () => void): () => void {
  const all = lists()
  all.forEach((m) => m.addEventListener('change', cb))
  return () => all.forEach((m) => m.removeEventListener('change', cb))
}

/* ---------- the download, shared by every mount ---------- */

export type FilmSource = { url: string; bytes: number }

/** Picks the film for this connection: the light version on slow or metered links,
    none at all when the visitor asked to save data or is on 2G. */
export function chooseFilm(full: FilmSource, lite: FilmSource): FilmSource | null {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string; downlink?: number } }).connection
  if (!c) return full // Safari and Firefox do not say: assume a normal connection
  if (c.saveData || c.effectiveType === 'slow-2g' || c.effectiveType === '2g') return null
  if (c.effectiveType === '3g' || (typeof c.downlink === 'number' && c.downlink < 4)) return lite
  return full
}

const films = new Map<string, Promise<string>>()
const readyFilms = new Map<string, string>()

/** The object URL of a film that has finished downloading in this visit, if any. */
export function filmIfReady(src: FilmSource): string | null {
  return readyFilms.get(src.url) ?? null
}

/** Downloads the whole film once per page load and resolves with an object URL.
    Navigating away and back reuses it. A stall of 20 seconds without a byte gives up. */
export function preloadFilm(src: FilmSource): Promise<string> {
  const known = films.get(src.url)
  if (known) return known
  const job = (async () => {
    const abort = new AbortController()
    let watchdog = window.setTimeout(() => abort.abort(), 20000)
    try {
      const res = await fetch(src.url, { priority: 'low', signal: abort.signal } as RequestInit)
      if (!res.ok || !res.body) throw new Error(`film: HTTP ${res.status}`)
      // A single-page host answers a missing file with the HTML page and status 200.
      if (!(res.headers.get('content-type') ?? '').startsWith('video/')) throw new Error('film: not a video')
      const reader = res.body.getReader()
      const chunks: BlobPart[] = []
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        clearTimeout(watchdog) // re-armed on every chunk
        watchdog = window.setTimeout(() => abort.abort(), 20000)
        chunks.push(value)
      }
      const url = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }))
      readyFilms.set(src.url, url)
      return url
    } finally {
      clearTimeout(watchdog)
    }
  })()
  job.catch(() => films.delete(src.url)) // a failed download may be tried again on the next visit
  films.set(src.url, job)
  return job
}

export type ScrubOptions = {
  /** Object URL of the fully downloaded film, from preloadFilm(). */
  src: string
  poster: string
  /** Scroll progress at which the film reaches its last frame. The rest of the scroll holds that frame. */
  filmEnd: number
  /** Scroll progress at which the top of the frame turns from dark to pale, so the nav text flips to ink. */
  navFlip: number
}

type Band = {
  el: HTMLElement
  a: number
  b: number
  ramp: number
  first: boolean
  last: boolean
  voice: HTMLElement | null
  op: number
  k: number
  on: boolean
}

type Still = { el: HTMLElement; at: number; src: string; op: number }

const smoothstep = (p: number, e0: number, e1: number) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)

export function mountScrub(root: HTMLElement, o: ScrubOptions): () => void {
  const stage = root.querySelector<HTMLElement>('.scrub__stage')!
  const video = root.querySelector<HTMLVideoElement>('.scrub__video')!
  const posterEl = root.querySelector<HTMLElement>('.scrub__poster')!

  const bandEls = [...root.querySelectorAll<HTMLElement>('[data-band]')]
  const bands: Band[] = bandEls.map((el, i) => {
    const a = Number(el.dataset.a)
    const b = Number(el.dataset.b)
    return {
      el,
      a,
      b,
      ramp: Number(el.dataset.ramp) || Math.min(0.025, (b - a) * 0.35),
      first: i === 0,
      last: i === bandEls.length - 1,
      voice: el.querySelector<HTMLElement>('.trivoice'),
      op: -1,
      k: -1,
      on: false,
    }
  })
  const stills: Still[] = [...root.querySelectorAll<HTMLElement>('.scrub__still')].map((el) => ({
    el,
    at: Number(el.dataset.at),
    src: el.dataset.src ?? '',
    op: -1,
  }))

  let dead = false
  let failed = false
  let ready = false

  /* ---------- progress ---------- */
  let range = 1
  let navH = 68
  let overNav = true
  const measure = () => {
    range = Math.max(1, root.offsetHeight - stage.offsetHeight)
    navH = document.querySelector<HTMLElement>('.nav')?.offsetHeight ?? 68
  }

  /* The nav stays clear glass while it sits over the film. Its text tone follows the
     frame beneath it: one attribute on <html>, written only when the tone changes. */
  const html = document.documentElement
  let tone = ''
  const setTone = (next: string) => {
    if (next === tone) return
    tone = next
    if (next) html.dataset.heroTone = next
    else delete html.dataset.heroTone
  }
  const updateTone = () => setTone(!overNav ? '' : shown >= o.navFlip ? 'dark' : 'light')
  const progress = () => {
    const r = root.getBoundingClientRect()
    overNav = r.top <= navH && r.bottom > navH
    return clamp(-r.top / range, 0, 1)
  }
  const filmTime = (p: number) => {
    const d = video.duration
    if (!d || !Number.isFinite(d)) return 0
    // Stop a hair before the end: some browsers paint black on the very last timestamp.
    return Math.min(d - 0.04, Math.min(1, p / o.filmEnd) * d)
  }

  /* ---------- gated seeks ---------- */
  let seekBusy = false
  let pendingTime: number | null = null
  let lastSought = -1
  const requestSeek = (t: number) => {
    if (!ready) return
    if (Math.abs(t - lastSought) < 0.008) return // under a fifth of a frame: nothing to show
    if (seekBusy) {
      pendingTime = t // coalesce: keep only the newest
      return
    }
    seekBusy = true
    lastSought = t
    video.currentTime = t
  }
  const onSeeked = () => {
    seekBusy = false
    if (pendingTime !== null) {
      const t = pendingTime
      pendingTime = null
      requestSeek(t) // exactly one follow-up
    }
  }
  const onVideoError = () => {
    seekBusy = false
    pendingTime = null
    if (ready || video.src) failVideo()
  }

  /* ---------- captions, delta-gated ---------- */
  const loadStart = performance.now()
  let loadK = 0
  let moved = false

  const updateCaptions = (p: number) => {
    for (const band of bands) {
      const f = Math.min(0.02, (band.b - band.a) / 3)
      const fadeIn = band.first ? 1 : smoothstep(p, band.a, band.a + f)
      const fadeOut = band.last ? 1 : 1 - smoothstep(p, band.b - f, band.b)
      const op = fadeIn * fadeOut
      let k = clamp((p - band.a) / band.ramp, 0, 1)
      if (band.first) k = Math.max(k, loadK)

      if (Math.abs(op - band.op) > 0.004 || (op !== band.op && (op === 0 || op === 1))) {
        band.op = op
        band.el.style.opacity = op.toFixed(3)
      }
      if (Math.abs(k - band.k) > 0.008 || (k !== band.k && (k === 0 || k === 1))) {
        band.k = k
        band.el.style.setProperty('--k', k.toFixed(3))
      }
      const on = op > 0.02
      if (on !== band.on) {
        band.on = on
        band.el.classList.toggle('on', on)
        // The three voices settle each time their band arrives, and rewind when it leaves.
        band.voice?.dispatchEvent(new CustomEvent(on ? 'trivoice:play' : 'trivoice:reset'))
      }
    }
    const nowMoved = p > 0.012
    if (nowMoved !== moved) {
      moved = nowMoved
      root.classList.toggle('scrub--moved', moved)
    }
    if (failed) {
      for (const s of stills) {
        const op = smoothstep(p, s.at - 0.03, s.at + 0.03)
        if (Math.abs(op - s.op) > 0.004 || (op !== s.op && (op === 0 || op === 1))) {
          s.op = op
          s.el.style.opacity = op.toFixed(3)
        }
      }
    }
  }

  /* ---------- the loop: eases, then rests ---------- */
  let target = 0
  let shown = 0
  let rafId: number | null = null
  let lastTick = 0
  let onScreen = true

  const tick = (now: number) => {
    const dt = Math.min(100, now - (lastTick || now))
    lastTick = now
    const k = 0.16 // smoothing per 60fps frame, normalised below so every refresh rate feels the same
    shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667))
    if (loadK < 1) loadK = easeOutCubic((now - loadStart) / 1500)
    const converged = Math.abs(target - shown) < 0.0005
    if (converged) shown = target
    if (converged && loadK >= 1) {
      rafId = null
      lastTick = 0
    } else {
      rafId = requestAnimationFrame(tick)
    }
    requestSeek(filmTime(shown))
    updateCaptions(shown)
    updateTone()
  }
  const wake = () => {
    if (rafId === null && onScreen && !dead) rafId = requestAnimationFrame(tick)
  }
  const onScroll = () => {
    target = progress()
    updateTone() // also runs while the loop rests, so the nav is released the moment the film scrolls away
    wake()
  }
  const onResize = () => {
    measure()
    onScroll()
  }

  const io = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting
    if (onScreen) onScroll()
    else if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
      lastTick = 0
    }
  })
  io.observe(root)

  /* A caption that receives keyboard focus while faded out scrolls itself into view. */
  const onFocusIn = (e: FocusEvent) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-band]')
    const band = bands.find((b) => b.el === el)
    if (!band || band.op > 0.9) return
    const mid = band.last ? 1 : (band.a + band.b) / 2
    const top = root.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + range * mid })
  }

  /* ---------- the film is already downloaded: just attach it ---------- */
  function failVideo() {
    if (failed || dead) return
    failed = true
    ready = false
    for (const s of stills) if (s.src) s.el.style.backgroundImage = `url('${s.src}')`
    stage.classList.remove('video-ready')
    stage.classList.add('video-failed', 'video-settled')
    updateCaptions(shown)
  }

  posterEl.style.backgroundImage = `url('${o.poster}')`
  stage.classList.add('video-settled')
  video.addEventListener(
    'canplay',
    () => {
      if (dead || failed) return
      ready = true
      requestSeek(filmTime(shown))
      stage.classList.add('video-ready')
    },
    { once: true },
  )
  video.src = o.src
  video.load()

  /* ---------- wire up ---------- */
  video.addEventListener('seeked', onSeeked)
  video.addEventListener('error', onVideoError)
  root.addEventListener('focusin', onFocusIn)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  measure()
  target = shown = progress() // open on the current scroll position, no travel from zero
  updateCaptions(shown)
  updateTone()
  wake()

  return () => {
    dead = true
    setTone('')
    if (rafId !== null) cancelAnimationFrame(rafId)
    io.disconnect()
    video.removeEventListener('seeked', onSeeked)
    video.removeEventListener('error', onVideoError)
    root.removeEventListener('focusin', onFocusIn)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    // The object URL belongs to preloadFilm() and is kept for the next visit to this page.
    video.removeAttribute('src')
    video.load()
  }
}
