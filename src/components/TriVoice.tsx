import { useEffect, useRef } from 'react'
import type { ElementType } from 'react'
import { LANGS, useI18n } from '../i18n'
import type { Lang } from '../i18n'
import { prefersReducedMotion } from '../lib/motion'

const HTML_LANG: Record<Lang, string> = { en: 'en', uz: 'uz', ru: 'ru' }

/* The signature element: "Three voices".
   The headline is spoken in all three working languages. It passes through the two
   other languages and settles on the visitor's language, and the other two stay
   beneath it as a thin mono line. Screen readers get only the visitor's language.

   The settle is driven by one class change per step (three in total), written
   straight to the DOM. Nothing here runs per frame. */
export function TriVoice({
  textKey,
  vars,
  as: Tag = 'h1',
  className = '',
  ghosts = true,
  hold = false,
}: {
  textKey: string
  vars?: Record<string, string | number>
  as?: ElementType
  className?: string
  ghosts?: boolean
  /** Wait for a `trivoice:play` event on the root instead of settling on mount (the scroll film uses this). */
  hold?: boolean
}) {
  const { lang, tIn } = useI18n()
  const root = useRef<HTMLDivElement>(null)
  const others = LANGS.filter((l) => l !== lang)
  // Order of the settle: the two other voices first, the visitor's voice last.
  const order: Lang[] = [...others, lang]

  useEffect(() => {
    const el = root.current
    if (!el) return
    let t1 = 0
    let t2 = 0
    const stop = () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    const play = () => {
      stop()
      if (prefersReducedMotion()) {
        el.dataset.step = '2'
        return
      }
      el.dataset.step = '0'
      t1 = window.setTimeout(() => (el.dataset.step = '1'), 620)
      t2 = window.setTimeout(() => (el.dataset.step = '2'), 1240)
    }
    if (!hold) {
      play()
      return stop
    }
    const reset = () => {
      stop()
      el.dataset.step = '0'
    }
    el.addEventListener('trivoice:play', play)
    el.addEventListener('trivoice:reset', reset)
    return () => {
      stop()
      el.removeEventListener('trivoice:play', play)
      el.removeEventListener('trivoice:reset', reset)
    }
  }, [lang, textKey, hold])

  return (
    <div ref={root} className={`trivoice ${className}`} data-step="2">
      <Tag className="trivoice__head">
        <span className="visually-hidden">{tIn(lang, textKey, vars)}</span>
        <span className="trivoice__stack" aria-hidden="true">
          {order.map((l, i) => (
            <span key={l} className="trivoice__line" data-i={i} lang={HTML_LANG[l]}>
              {tIn(l, textKey, vars)}
            </span>
          ))}
        </span>
      </Tag>
      {ghosts && (
        <p className="trivoice__ghosts" aria-hidden="true">
          {others.map((l) => (
            <span key={l} lang={HTML_LANG[l]}>
              <b>{l.toUpperCase()}</b> {tIn(l, textKey, vars)}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
