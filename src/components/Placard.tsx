import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { clamp, onReducedMotionChange, prefersReducedMotion } from '../lib/motion'

/* The one interactive moment: "Raise your placard".
   Hold to raise it. Let go early and it eases back down. Raise it all the way and
   the chair recognises you. The hold progress lives in a ref and is written to one
   CSS variable; React state changes exactly once, when the placard is fully raised.
   Reduced motion gets the finished state with no hold. The call to action below it
   is always visible, so this moment never hides anything. */
export function Placard({ onRaised }: { onRaised?: () => void }) {
  const { t } = useI18n()
  const [raised, setRaised] = useState(prefersReducedMotion)
  const stage = useRef<HTMLDivElement>(null)
  const progress = useRef(0)
  const holding = useRef(false)
  const raf = useRef(0)
  const last = useRef(0)
  const written = useRef(-1)

  const write = (p: number) => {
    // Delta-gated: only touch the DOM when the value really moved.
    if (Math.abs(p - written.current) < 0.004 && p !== 0 && p !== 1) return
    written.current = p
    stage.current?.style.setProperty('--p', p.toFixed(3))
  }

  const tick = (now: number) => {
    const dt = Math.min(64, now - (last.current || now))
    last.current = now
    const speed = holding.current ? 1 / 1100 : -1 / 700 // up in 1.1s, down in 0.7s
    progress.current = clamp(progress.current + dt * speed, 0, 1)
    write(progress.current)
    if (progress.current >= 1) {
      raf.current = 0
      setRaised(true)
      onRaised?.()
      return
    }
    if (progress.current <= 0 && !holding.current) {
      raf.current = 0 // settled back down: rest
      return
    }
    raf.current = requestAnimationFrame(tick)
  }

  const start = () => {
    if (raised) return
    holding.current = true
    if (!raf.current) {
      last.current = 0
      raf.current = requestAnimationFrame(tick)
    }
  }
  const stop = () => {
    holding.current = false
  }

  useEffect(() => {
    if (raised) stage.current?.style.setProperty('--p', '1')
  }, [raised])

  useEffect(() => {
    const off = onReducedMotionChange((reduced) => {
      if (reduced) {
        cancelAnimationFrame(raf.current)
        raf.current = 0
        setRaised(true)
      }
    })
    return () => {
      off()
      cancelAnimationFrame(raf.current)
    }
  }, [])

  return (
    <div ref={stage} className={`placard ${raised ? 'placard--raised' : ''}`}>
      <button
        type="button"
        className="placard__btn"
        aria-label={t('placard.hold')}
        aria-pressed={raised}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          start()
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
            e.preventDefault()
            start()
          }
        }}
        onKeyUp={(e) => {
          if (e.key === ' ' || e.key === 'Enter') stop()
        }}
        onBlur={stop}
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="placard__arm" aria-hidden="true">
          <span className="placard__card">
            <i />
            <b>{t('placard.delegate')}</b>
          </span>
          <span className="placard__stick" />
        </span>
        <span className="placard__ring" aria-hidden="true">
          <svg viewBox="0 0 48 48" focusable="false">
            <circle cx="24" cy="24" r="20" />
            <circle className="placard__meter" cx="24" cy="24" r="20" pathLength={1} />
          </svg>
        </span>
      </button>
      <p className="placard__said" aria-live="polite">
        {raised ? t('placard.recognised') : ''}
      </p>
    </div>
  )
}
