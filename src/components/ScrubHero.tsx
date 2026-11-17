import { useEffect, useRef, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useContent } from '../data/content'
import { useI18n } from '../i18n'
import { mountScrub, scrubAllowed, watchGates } from '../lib/scrub'
import { PrimaryCta } from './Nav'
import { StaticHero } from './StaticHero'
import { TriVoice } from './TriVoice'

/* The scroll film: one continuous 18 second shot of a golden eagle descending from
   the edge of the atmosphere to the valley, scrubbed by scroll.

   The film and its stills are swap points. Replace the files in public/media/hero/
   and, if the new film is a different size, update FILM_BYTES. */
const FILM = '/media/hero/hero-scrub.mp4'
const FILM_BYTES = 5220170
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

function Film() {
  const { t, tl, date, word, numWord } = useI18n()
  const c = useContent()
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!root.current) return
    return mountScrub(root.current, { video: FILM, bytes: FILM_BYTES, poster: POSTER, filmEnd: FILM_END, navFlip: NAV_FLIP })
  }, [])

  const seasonsN = c.pastSeasons.length
  const tally = t('hero.b4', {
    seasons: numWord(seasonsN),
    seasonsWord: word('numbers.seasons', seasonsN),
    participants: c.totalParticipants,
    participantsWord: word('numbers.participants', c.totalParticipants),
  })
  // "Two seasons. 190 participants. One valley." parts into its sentences.
  const halves = tally.match(/[^.]+\./g) ?? [tally]
  const venue = c.upcoming ? tl(c.upcoming.venue) : ''

  return (
    <section className="hero hero--scrub" ref={root} aria-label="SIFMUN">
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
        <div className="band band--settle" data-band data-a={BANDS.rest[0]} data-b={BANDS.rest[1]} data-ramp="0.05">
          <div className="settle__top">
            <TriVoice textKey="floor" as="h2" className="hero__title settle__title" hold />
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

        <div className="scrub__cue" aria-hidden="true">
          <svg className="scrub__ring" viewBox="0 0 48 48" focusable="false">
            <circle className="scrub__ring-track" cx="24" cy="24" r="20" />
            <circle className="scrub__ring-fill" cx="24" cy="24" r="20" strokeDasharray="126" />
            <path className="scrub__chevron" d="M17 21.5 24 28.5 31 21.5" />
          </svg>
          <span className="scrub__cue-label">{t('hero.scroll')}</span>
        </div>
      </div>
    </section>
  )
}

/** The home hero: the scroll film where it can be enjoyed, the composed still everywhere else.
    The choice is live: rotate a tablet or flip reduced motion and it swaps. */
export function Hero() {
  const film = useSyncExternalStore(watchGates, scrubAllowed, () => false)
  return film ? <Film /> : <StaticHero />
}
