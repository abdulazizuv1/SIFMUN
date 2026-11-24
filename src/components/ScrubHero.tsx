import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../data/content'
import { useI18n } from '../i18n'
import { chooseFilm, filmIfReady, mountScrub, preloadFilm, scrubAllowed, watchGates } from '../lib/scrub'
import { MunButton } from './Modal'
import { PrimaryCta } from './Nav'
import { StaticHero } from './StaticHero'
import { TriVoice } from './TriVoice'

/* The scroll film: one continuous 18 second shot of a golden eagle descending from
   the edge of the atmosphere to the valley, scrubbed by scroll.

   The film only appears once it has downloaded completely. Until then visitors get
   the journey's last scene as a still (EndingHero), so nobody waits on a slow link.

   The films and stills are swap points: replace the files in public/media/hero/.
   The full film is 1280px wide (about 1.9 MB), the lite one 854px (about 0.9 MB). */
const FILM_FULL = { url: '/media/hero/hero-scrub.mp4', bytes: 1899254 }
const FILM_LITE = { url: '/media/hero/hero-scrub-lite.mp4', bytes: 939844 }
const ENDING = '/media/hero/hero-ending.webp'
const POSTER = '/media/hero/hero-poster.webp'
const STILLS = [
  { at: 0.42, src: '/media/hero/hero-fog.webp' },
  { at: 0.62, src: '/media/hero/hero-valley.webp' },
  { at: 0.84, src: '/media/hero/hero-ending.webp' },
]
/* The film reaches its last frame at 90% of the scroll. The final 10% holds that
   frame, so the closing caption is read over a picture that has come to rest. */
const FILM_END = 0.9
/* At 13.9s of film the pale sky reaches the top of the frame. From there the nav
   text turns from ivory to ink. Measured on this film: re-measure for a new take. */
const NAV_FLIP = 0.695

/* Caption bands in scroll progress (0 to 1 over 900vh). Film time is progress x 20s. */
const BANDS = {
  dawn: [0, 0.15], // 0.0s to 3.0s   the edge of the atmosphere
  dive: [0.19, 0.36], // 3.8s to 7.2s   tipping into the descent
  fog: [0.4, 0.56], // 8.0s to 11.2s  inside the cloud
  break: [0.6, 0.8], // 12.0s to 16.0s the cloud tears, the valley opens
  rest: [0.86, 1], // 17.2s to the end, then the hold
} as const

const th = (v: number) => ({ '--th': v.toFixed(3) }) as CSSProperties

/** One sentence for screen readers, and a visual copy split into words that the band animates. */
function Words({ text, spread = 0.5, langs }: { text: string; spread?: number; langs?: string[] }) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <span key={i}>
            <span className="w" lang={langs?.[i]} style={th((i / words.length) * spread)}>
              {w}
            </span>{' '}
          </span>
        ))}
      </span>
    </>
  )
}

function Film({ src }: { src: string }) {
  const { t, word, numWord } = useI18n()
  const c = useContent()
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!root.current) return
    return mountScrub(root.current, { src, poster: POSTER, filmEnd: FILM_END, navFlip: NAV_FLIP })
  }, [src])

  const seasonsN = c.pastSeasons.length
  const tally = t('hero.b4', {
    seasons: numWord(seasonsN),
    seasonsWord: word('numbers.seasons', seasonsN),
    participants: c.totalParticipants,
    participantsWord: word('numbers.participants', c.totalParticipants),
  })
  // "Two seasons. 190 participants. One valley." parts into its sentences.
  const halves = tally.match(/[^.]+\./g) ?? [tally]

  return (
    <section className="hero hero--scrub hero--arrive" ref={root} aria-label="SIFMUN">
      <div className="scrub__stage">
        <div className="scrub__media" aria-hidden="true">
          <div className="scrub__poster" />
          {STILLS.map((s) => (
            <div key={s.src} className="scrub__still" data-at={s.at} data-src={s.src} />
          ))}
          <video className="scrub__video" preload="none" muted playsInline tabIndex={-1} />
          <div className="scrub__grade" />
        </div>

        {/* 1. Dawn: the line comes into focus like arriving light. */}
        <div className="band band--left band--dawn" data-band data-a={BANDS.dawn[0]} data-b={BANDS.dawn[1]} data-ramp="1">
          <div className="band__inner">
            <p className="hero__kicker band__kicker">{t('hero.kicker')}</p>
            <h1 className="band__title band__title--xl focus">
              <span className="visually-hidden">{t('hero.b1')}</span>
              <span className="focus__soft" aria-hidden="true">
                {t('hero.b1')}
              </span>
              <span className="focus__sharp" aria-hidden="true">
                {t('hero.b1')}
              </span>
            </h1>
            <MunButton className="munbtn--light band__mun" />
          </div>
        </div>

        {/* 2. The dive: words drift down with the eagle. */}
        <div className="band band--left band--dive" data-band data-a={BANDS.dive[0]} data-b={BANDS.dive[1]}>
          <div className="band__inner">
            <p className="band__title">
              <Words text={t('hero.b2')} spread={0.55} />
            </p>
          </div>
        </div>

        {/* 3. Inside the cloud: three languages surface out of the mist, one by one. */}
        <div className="band band--left band--fog" data-band data-a={BANDS.fog[0]} data-b={BANDS.fog[1]} data-ramp="0.04">
          <div className="band__inner">
            <p className="band__title band__title--stack">
              <Words text={t('hero.b3')} spread={0.9} langs={['en', 'uz', 'ru']} />
            </p>
            <p className="band__sub">{t('hero.b3sub')}</p>
          </div>
        </div>

        {/* 4. The cloud tears open: the line parts like the veil. */}
        <div className="band band--left band--break" data-band data-a={BANDS.break[0]} data-b={BANDS.break[1]} data-ramp="0.035">
          <div className="band__inner">
            <p className="band__title band__title--stack">
              <span className="visually-hidden">{tally}</span>
              <span aria-hidden="true">
                {halves.map((h, i) => (
                  <span key={i} className="half" style={{ '--dir': i % 2 ? -1 : 1 } as CSSProperties}>
                    {h.trim()}
                  </span>
                ))}
              </span>
            </p>
          </div>
        </div>

        {/* 5. At rest over the valley: the three voices, then the invitation. */}
        <Settle band />

        <div className="scrub__cue" aria-hidden="true">
          <svg className="scrub__ring" viewBox="0 0 48 48" focusable="false">
            <path className="scrub__chevron" d="M17 21.5 24 28.5 31 21.5" />
          </svg>
          <span className="scrub__cue-label">{t('hero.scroll')}</span>
        </div>
      </div>
    </section>
  )
}

/** The journey's closing scene: the three voices over the pale sky, the invitation
    over the valley. In the film it is band 5; on its own it is the hero shown while
    the film is still downloading. */
function Settle({ band = false }: { band?: boolean }) {
  const { t, tl, date } = useI18n()
  const c = useContent()
  const venue = c.upcoming ? tl(c.upcoming.venue) : ''
  const bandProps = band ? { 'data-band': true, 'data-a': BANDS.rest[0], 'data-b': BANDS.rest[1], 'data-ramp': '0.05' } : {}
  return (
    <div className={`band band--settle ${band ? '' : 'on'}`} {...bandProps}>
      <div className="settle__top">
        <TriVoice textKey="floor" as={band ? 'h2' : 'h1'} className="hero__title settle__title" hold={band} />
        <MunButton className="settle__mun" />
      </div>
      <div className="settle__bottom">
        <p className="settle__sub">{venue ? t('hero.b5sub', { venue }) : t('s3.title')}</p>
        <div className="settle__actions">
          <PrimaryCta long />
          <Link to="/history" className="link link--light">
            {t('hero.seePast')}
          </Link>
        </div>
        {c.upcoming && (
          <p className="hero__meta settle__meta">
            <span>{t('s3.label')}</span>
            {c.upcoming.date ? date(c.upcoming.date) : t('s3.dateTba')}
          </p>
        )}
      </div>
    </div>
  )
}

/** One screen: the last scene of the film as a still, with its captions settled. */
function EndingHero() {
  const root = useRef<HTMLElement>(null)

  // The nav sits over a pale sky here: dark text while the hero is under it.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    let on = false
    const apply = () => {
      const next = el.getBoundingClientRect().bottom > (document.querySelector<HTMLElement>('.nav')?.offsetHeight ?? 68)
      if (next === on) return
      on = next
      if (next) html.dataset.heroTone = 'dark'
      else delete html.dataset.heroTone
    }
    apply()
    window.addEventListener('scroll', apply, { passive: true })
    return () => {
      window.removeEventListener('scroll', apply)
      delete html.dataset.heroTone
    }
  }, [])

  return (
    <section className="hero hero--ending" ref={root} aria-label="SIFMUN">
      <div className="scrub__media" aria-hidden="true">
        <img className="hero--ending__still" src={ENDING} alt="" width={1280} height={720} fetchPriority="high" decoding="async" />
        <div className="scrub__grade" />
      </div>
      <Settle />
    </section>
  )
}

/** The home hero.
    Phones, portrait tablets and reduced motion: the composed dawn still (StaticHero).
    Everyone else: the last scene at once, then the scroll film, but only after it has
    downloaded completely and only if the visitor is still at the top of the page,
    so the page never jumps under someone who has started reading. */
export function Hero() {
  const allowed = useSyncExternalStore(watchGates, scrubAllowed, () => false)
  // Coming back to the home page in the same visit: the film is already here, show it at once.
  const [src, setSrc] = useState<string | null>(() => filmIfReady(FILM_FULL) ?? filmIfReady(FILM_LITE))

  useEffect(() => {
    if (!allowed || src) return
    const film = chooseFilm(FILM_FULL, FILM_LITE)
    if (!film) return
    let alive = true
    const started = window.scrollY
    preloadFilm(film)
      .then((url) => {
        // Swap in only while the visitor is still at the top and has not moved.
        if (alive && window.scrollY < 40 && Math.abs(window.scrollY - started) < 40) setSrc(url)
      })
      .catch(() => {
        /* no film this time: the still hero is a complete page */
      })
    return () => {
      alive = false
    }
  }, [allowed, src])

  if (!allowed) return <StaticHero />
  return src ? <Film src={src} /> : <EndingHero />
}
