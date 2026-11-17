import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useContent } from '../data/content'
import { LANGS, useI18n } from '../i18n'
import { Seal } from './ui'

/** Language switcher drawn as a delegate's placard with three faces. */
export function LangSwitch() {
  const { lang, setLang, t } = useI18n()
  return (
    <div className="langs" role="group" aria-label={t('nav.language')}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          className="langs__btn"
          aria-pressed={l === lang}
          lang={l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

/** The single call to action: Register when open, Telegram otherwise. */
export function PrimaryCta({ long = false, className = '' }: { long?: boolean; className?: string }) {
  const { t } = useI18n()
  const { settings } = useContent()
  if (settings.registrationStatus === 'open') {
    return (
      <Link to="/register" className={`btn ${className}`}>
        {t('cta.register')}
        <Arrow />
      </Link>
    )
  }
  return (
    <a href={settings.telegramUrl} className={`btn ${className}`} target="_blank" rel="noopener noreferrer">
      {long ? t('cta.joinOurTelegram') : t('nav.joinTelegram')}
      <Arrow />
    </a>
  )
}

export function Arrow() {
  return (
    <svg className="btn__arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function Nav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const header = useRef<HTMLElement>(null)

  // Close the mobile sheet on navigation.
  useEffect(() => setOpen(false), [pathname])

  // Solid background once the page has scrolled. One class toggle, only on change.
  useEffect(() => {
    const el = header.current
    if (!el) return
    let scrolled = false
    const apply = () => {
      const next = window.scrollY > 24
      if (next !== scrolled) {
        scrolled = next
        el.classList.toggle('nav--scrolled', next)
      }
    }
    apply()
    window.addEventListener('scroll', apply, { passive: true })
    return () => window.removeEventListener('scroll', apply)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const links = (
    <>
      <NavLink to="/history">{t('nav.history')}</NavLink>
      <NavLink to="/team">{t('nav.team')}</NavLink>
      <NavLink to="/register">{t('nav.register')}</NavLink>
    </>
  )

  return (
    <header ref={header} className="nav">
      <a className="skip" href="#main">
        {t('nav.skip')}
      </a>
      <nav className="nav__bar" aria-label="SIFMUN">
        <Link to="/" className="nav__brand" aria-label={t('nav.home')}>
          <Seal size={38} />
          <span>SIFMUN</span>
        </Link>
        <div className="nav__links">{links}</div>
        <div className="nav__tools">
          <LangSwitch />
          <PrimaryCta className="btn--sm nav__cta" />
          <button
            type="button"
            className="nav__burger"
            aria-expanded={open}
            aria-controls="nav-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="visually-hidden">{open ? t('nav.close') : t('nav.menu')}</span>
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </button>
        </div>
      </nav>
      <div id="nav-sheet" className="nav__sheet" hidden={!open}>
        <div className="nav__sheetlinks">{links}</div>
        <PrimaryCta long />
      </div>
    </header>
  )
}
