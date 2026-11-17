import { Link } from 'react-router-dom'
import { useContent } from '../data/content'
import { useI18n } from '../i18n'
import { PrimaryCta } from './Nav'
import { TriVoice } from './TriVoice'

/* The composed still hero: the first-class layout for phones, portrait tablets and
   reduced motion (the five gates in lib/scrub.ts). Everyone else gets the scroll
   film in ScrubHero.tsx.

   It uses the approved dawn still, which is the film's opening frame at full
   sharpness. The film itself is 720p, too soft to crop to a phone screen. */
const STILL_WIDE = '/media/hero/hero-dawn.webp'
const STILL_TALL = '/media/hero/hero-dawn-portrait.webp'

export function StaticHero() {
  const { t, date } = useI18n()
  const { upcoming } = useContent()
  return (
    <section className="hero hero--static hero--dark" aria-label="SIFMUN">
      <picture className="hero__still" aria-hidden="true">
        <source media="(max-width: 720px), (orientation: portrait)" srcSet={STILL_TALL} />
        <img src={STILL_WIDE} alt="" width={1920} height={1072} fetchPriority="high" decoding="async" />
      </picture>
      <div className="hero__veil" aria-hidden="true" />

      <div className="hero__top">
        <p className="hero__kicker">{t('hero.kicker')}</p>
        <TriVoice textKey="floor" className="hero__title" />
      </div>

      <div className="hero__bottom">
        <svg className="hero__line" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 18 C 260 2, 520 2, 760 12 S 1100 22, 1200 6" pathLength={1} vectorEffect="non-scaling-stroke" />
        </svg>
        <p className="hero__sub">{t('hero.staticSub')}</p>
        <div className="hero__actions">
          <PrimaryCta long />
          <Link to="/history" className="link link--light">
            {t('hero.seePast')}
          </Link>
        </div>
        {upcoming && (
          <p className="hero__meta">
            <span>{t('s3.label')}</span>
            {upcoming.date ? date(upcoming.date) : t('s3.dateTba')}
          </p>
        )}
      </div>
    </section>
  )
}
