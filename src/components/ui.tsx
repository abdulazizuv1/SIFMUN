import { useEffect, useRef } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'
import logoUrl from '../assets/brand/logo.svg'
import type { Photo } from '../data/types'
import { useI18n } from '../i18n'
import { onReducedMotionChange, prefersReducedMotion, useReveal } from '../lib/motion'

/** The brand mark on an ivory seal, so it reads on light and on dark surfaces
    and so the final logo can be dropped in without touching any layout. */
export function Seal({ size = 40 }: { size?: number }) {
  return (
    <span className="seal" style={{ '--seal': `${size}px` } as CSSProperties} aria-hidden="true">
      <img src={logoUrl} alt="" width={size} height={size} />
    </span>
  )
}

/** Wrapper that gets `.in` when it first scrolls into view. Children stagger with --i. */
export function Reveal({
  as: Tag = 'div',
  className = '',
  children,
  ...rest
}: {
  as?: ElementType
  className?: string
  children: ReactNode
  [key: string]: unknown
}) {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)
  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  )
}

/** Mono label styled like a UN document symbol, followed by a hairline that draws itself. */
export function DocLabel({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <p className={`doclabel doclabel--${tone}`}>
      <span>{children}</span>
      <i aria-hidden="true" />
    </p>
  )
}

/** Designed placeholder shown wherever a photo is missing. */
export function NoPhoto({ ratio = '4 / 5', label }: { ratio?: string; label?: string }) {
  const { t } = useI18n()
  return (
    <div className="nophoto frame" style={{ aspectRatio: ratio }} role="img" aria-label={label ?? t('team.noPhoto')}>
      <img src={logoUrl} alt="" aria-hidden="true" />
      <span aria-hidden="true">{t('team.noPhoto')}</span>
    </div>
  )
}

/** A photo in the double-hairline invitation frame, or the placeholder when there is none. */
export function Picture({
  photo,
  alt,
  ratio,
  sizes = '(max-width: 720px) 92vw, 600px',
  eager = false,
  useThumb = false,
}: {
  photo: Photo | null
  alt: string
  ratio?: string
  sizes?: string
  eager?: boolean
  useThumb?: boolean
}) {
  if (!photo) return <NoPhoto ratio={ratio} label={alt || undefined} />
  const aspect = ratio ?? `${photo.width} / ${photo.height}`
  const thumbW = photo.thumb ? Math.round(photo.width >= photo.height ? 800 : (800 * photo.width) / photo.height) : 0
  return (
    <div className="picture frame" style={{ aspectRatio: aspect }}>
      <img
        src={useThumb && photo.thumb ? photo.thumb : photo.src}
        srcSet={photo.thumb && !useThumb ? `${photo.thumb} ${thumbW}w, ${photo.src} ${photo.width}w` : undefined}
        sizes={photo.thumb && !useThumb ? sizes : undefined}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}

/** Large outlined Roman numeral that draws its own stroke when it scrolls into view. */
export function Roman({ value, className = '' }: { value: string; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useReveal(ref)
  const width = Math.max(1, value.length) * 62 + 30
  return (
    <svg ref={ref} className={`roman ${className}`} viewBox={`0 0 ${width} 150`} aria-hidden="true" focusable="false">
      <text x="50%" y="118" textAnchor="middle">
        {value}
      </text>
    </svg>
  )
}

/** Counts from 0 to `value` once, when scrolled into view. Reduced motion shows the final number. */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  const raf = useRef(0)

  const run = () => {
    const el = ref.current
    if (!el || started.current) return
    started.current = true
    if (prefersReducedMotion()) {
      el.textContent = String(value)
      return
    }
    const t0 = performance.now()
    const dur = 1400
    let last = ''
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const eased = 1 - Math.pow(1 - p, 4)
      const text = String(Math.round(value * eased))
      if (text !== last) {
        last = text
        el.textContent = text
      }
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  useReveal(ref, run)

  useEffect(() => {
    // If motion gets reduced mid-count, jump to the final number and stop the drive.
    const off = onReducedMotionChange((reduced) => {
      if (reduced && ref.current) {
        cancelAnimationFrame(raf.current)
        ref.current.textContent = String(value)
      }
    })
    return () => {
      off()
      cancelAnimationFrame(raf.current)
    }
  }, [value])

  // The real number is in the markup, so it is correct without JavaScript and for screen readers.
  return <span ref={ref}>{value}</span>
}
