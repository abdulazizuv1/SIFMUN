import type { CSSProperties } from 'react'
import { PrimaryCta } from '../components/Nav'
import { RegistrationForm } from '../components/RegistrationForm'
import { TriVoice } from '../components/TriVoice'
import { DocLabel, Reveal } from '../components/ui'
import { useContent } from '../data/content'
import { useI18n } from '../i18n'
import { coordsFromEmbed, parseMapEmbed } from '../lib/map'

const i = (n: number) => ({ '--i': n }) as CSSProperties

export function Register() {
  const { t, tl, date } = useI18n()
  const c = useContent()
  const { settings, upcoming } = c
  const status = settings.registrationStatus
  const statusKey = status === 'open' ? 'Open' : status === 'closed' ? 'Closed' : 'Soon'
  const venue = upcoming ? tl(upcoming.venue) : ''
  const fee = tl(settings.fee)
  const roles = c.roles.filter((r) => r.active).sort((a, b) => a.order - b.order)
  const faq = [...c.faq].sort((a, b) => a.order - b.order).filter((f) => tl(f.question) && tl(f.answer))

  // The map: a pasted Google or OpenStreetMap embed wins; plain coordinates are the fallback.
  const pasted = parseMapEmbed(settings.mapEmbed)
  const pin =
    settings.mapLat != null && settings.mapLng != null
      ? { lat: settings.mapLat, lng: settings.mapLng }
      : coordsFromEmbed(pasted)
  const d = 0.004
  const embed =
    pasted ??
    (pin
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${pin.lng - d}%2C${pin.lat - d}%2C${pin.lng + d}%2C${pin.lat + d}&layer=mapnik&marker=${pin.lat}%2C${pin.lng}`
      : null)
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${pin ? `${pin.lat},${pin.lng}` : encodeURIComponent(`${venue}, Fergana`)}`

  return (
    <>
      <header className="pagehead">
        <DocLabel>{t('register.label')}</DocLabel>
        <TriVoice textKey="register.title" className="pagehead__title" />
        <p className="statusline">
          <span className={`chip chip--${status}`}>{t(`register.status${statusKey}`)}</span>
          <span>{t(`register.text${statusKey}`)}</span>
        </p>
        {status !== 'open' && <PrimaryCta long />}
      </header>

      {/* Venue and facts: map card left, facts right */}
      <Reveal as="section" className="section venue" aria-label={t('register.venue')}>
        <div className="venue__map frame">
          {embed ? (
            <iframe
              src={embed}
              title={t('register.mapTitle')}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="venue__nomap" aria-hidden="true">
              <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" focusable="false">
                <g fill="none">
                  <path d="M-20 70C70 40 150 90 230 70s120-50 210-20" />
                  <path d="M-20 120c100-30 170 30 260 10s110-50 190-20" />
                  <path d="M-20 175c110-20 190 30 270 15s100-45 180-25" />
                  <path d="M-20 230c120-15 200 25 280 15s90-35 170-20" />
                  <path d="M150 120c20-16 60-16 78 0s14 44-10 56-66 6-76-16-8-28 8-40z" />
                </g>
                <circle cx="190" cy="148" r="5" />
              </svg>
            </div>
          )}
        </div>
        <div className="venue__facts">
          <dl className="facts facts--stack">
            <div style={i(1)}>
              <dt>{t('register.venue')}</dt>
              <dd>
                {venue}
                <a className="link link--small" href={mapsLink} target="_blank" rel="noopener noreferrer">
                  {t('register.openInMaps')}
                </a>
              </dd>
            </div>
            <div style={i(2)}>
              <dt>{t('register.date')}</dt>
              <dd>{upcoming?.date ? date(upcoming.date) : t('s3.dateTba')}</dd>
            </div>
            {settings.capacity != null && (
              <div style={i(3)}>
                <dt>{t('register.capacity')}</dt>
                <dd>{t('register.capacityValue', { n: settings.capacity })}</dd>
              </div>
            )}
            {fee && (
              <div style={i(4)}>
                <dt>{t('register.fee')}</dt>
                <dd>{fee}</dd>
              </div>
            )}
          </dl>
        </div>
      </Reveal>

      {/* Roles */}
      {roles.length > 0 && (
        <Reveal as="section" className="section roles" aria-labelledby="roles-title">
          <h2 id="roles-title">{t('register.roles')}</h2>
          <ul>
            {roles.map((r, k) => (
              <li key={r.id} className="rcard" style={i(k + 1)}>
                <span className="rcard__n" aria-hidden="true">
                  {String(k + 1).padStart(2, '0')}
                </span>
                <h3>{tl(r.name)}</h3>
                <p>{tl(r.description)}</p>
              </li>
            ))}
          </ul>
          {/* The application form is built from the questions defined in the admin, per role.
              It exists only while registration is Open. */}
          {status === 'open' ? <RegistrationForm /> : <p className="formnote">{t('register.formClosed')}</p>}
        </Reveal>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <Reveal as="section" className="section faq" aria-labelledby="faq-title">
          <h2 id="faq-title">{t('register.faqTitle')}</h2>
          <div className="faq__list">
            {faq.map((f, k) => (
              <details key={f.id} style={i(k)}>
                <summary>
                  <span>{tl(f.question)}</span>
                  <i aria-hidden="true" />
                </summary>
                <p>{tl(f.answer)}</p>
              </details>
            ))}
          </div>
        </Reveal>
      )}
    </>
  )
}
