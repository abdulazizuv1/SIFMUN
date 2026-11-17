/* Shared motion plumbing. Everything here writes straight to the DOM (classes and
   style properties) and never goes through React state, so scrolling never re-renders. */
import { useEffect } from 'react'
import type { RefObject } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(REDUCED).matches
}

/** Runs the callback now and again every time the reduced-motion preference flips. */
export function onReducedMotionChange(cb: (reduced: boolean) => void): () => void {
  const mql = matchMedia(REDUCED)
  const handler = () => cb(mql.matches)
  mql.addEventListener('change', handler)
  return () => mql.removeEventListener('change', handler)
}

type Entry = { once: boolean; onEnter?: () => void }
const watched = new WeakMap<Element, Entry>()
let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target
        const cfg = watched.get(el)
        if (!cfg) continue
        // .live is on only while the element is on screen: looping animations are scoped to it.
        el.classList.toggle('live', e.isIntersecting)
        if (e.isIntersecting && !el.classList.contains('in')) {
          el.classList.add('in')
          cfg.onEnter?.()
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )
  return observer
}

/** Adds `.in` the first time the element scrolls into view, and `.live` while it is visible. */
export function useReveal(ref: RefObject<Element | null>, onEnter?: () => void): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    watched.set(el, { once: true, onEnter })
    const io = getObserver()
    io.observe(el)
    return () => {
      io.unobserve(el)
      watched.delete(el)
    }
    // onEnter is intentionally read once: it is a one-time entrance hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])
}

/** One body class pauses every looping animation while the tab is hidden. */
export function installVisibilityPause(): () => void {
  const apply = () => document.body.classList.toggle('paused', document.hidden)
  document.addEventListener('visibilitychange', apply)
  apply()
  return () => document.removeEventListener('visibilitychange', apply)
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
