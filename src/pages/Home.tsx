import { Link } from 'react-router-dom'
import { Countdown } from '../components/Countdown'
import { FlightLine } from '../components/Environment'
import { Arrow, PrimaryCta } from '../components/Nav'
import { Placard } from '../components/Placard'
import { Hero } from '../components/ScrubHero'
import { CountUp, DocLabel, Picture, Reveal, Roman } from '../components/ui'
import { useContent } from '../data/content'
import { toRoman, useI18n } from '../i18n'
import type { CSSProperties } from 'react'

const i = (n: number) => ({ '--i': n }) as CSSProperties

export function Home() {
  const { t, tl, date, word, numWord, lang } = useI18n()
  const c = useContent()
  const badges = c.gallery.find((g) => g.id === 's2-badges')?.photo ?? null
  const seasonsN = c.pastSeasons.length
  const committeesN = c.committees.length

  const ran = (id: string) => {
    const nums = c.seasonsOfCommittee(id).map(toRoman)
    if (!nums.length) return ''
    if (nums.length === 1) return t('committees.ranOne', { a: nums[0] })
    if (nums.length === 2) return t('committees.ranTwo', { a: nums[0], b: nums[1] })
    return t('committees.ranMany', { list: nums.join(', ') })
  }

  const numbers = [
    { value: seasonsN, label: word('numbers.seasons', seasonsN) },
    { value: c.totalParticipants, label: word('numbers.participants', c.totalParticipants) },
    { value: committeesN, label: word('numbers.committees', committeesN) },
    { value: 3, label: word('numbers.languages', 3) },
  ]

  const status = c.settings.registrationStatus

  return (
    <>
      <Hero />

      <div className="home-flow">
        <FlightLine />

        {/* About: text left, framed photo right */}
        <Reveal as="section" className="section about" aria-labelledby="about-title">
          <div className="about__text">
            <DocLabel>{t('about.label')}</DocLabel>
            <h2 id="about-title" style={i(1)}>
              {t('about.title')}
            </h2>
            <p className="lede" style={i(2)}>
              {t('about.p1')}
            </p>
            <p style={i(3)}>{t('about.p2')}</p>
          </div>
          <div className="about__photo" style={i(2)}>
            <Picture photo={badges} alt={t('about.photoAlt')} ratio="1 / 1" sizes="(max-width: 900px) 80vw, 420px" />
          </div>
          <div className="voices" style={i(4)}>
            <ul>
              <li lang="en">
                <b>EN</b>Honourable Chair,
              </li>
              <li lang="uz">
                <b>UZ</b>Hurmatli rais,
              </li>
              <li lang="ru">
                <b>RU</b>Уважаемый председатель,
              </li>
            </ul>
            <p>{t('about.tilesCaption')}</p>
          </div>
        </Reveal>

        {/* Season III: dark band, huge outlined numeral */}
        {c.upcoming && (
          <Reveal as="section" className="s3" aria-labelledby="s3-title">
            <div className="s3__inner">
              <Roman value={toRoman(c.upcoming.number)} className="s3__roman" />
              <div className="s3__text">
                <DocLabel tone="dark">{t('s3.label')}</DocLabel>
                <h2 id="s3-title" style={i(1)}>
                  {t('s3.title')}
                </h2>
                <dl className="facts facts--dark" style={i(2)}>
                  <div>
                    <dt>{t('s3.date')}</dt>
                    <dd>{c.upcoming.date ? date(c.upcoming.date) : t('s3.dateTba')}</dd>
                  </div>
                  <div>
                    <dt>{t('s3.venue')}</dt>
                    <dd>{tl(c.upcoming.venue)}</dd>
                  </div>
                </dl>
                {c.upcoming.date && <Countdown iso={c.upcoming.date} />}
                {status === 'soon' && <p style={i(3)}>{t('s3.p')}</p>}
                <div style={i(4)}>
                  <PrimaryCta long />
                </div>
              </div>
            </div>
          </Reveal>
        )}

        {/* Numbers: one row of gold numerals */}
        <Reveal as="section" className="section numbers" aria-label={t('numbers.since')}>
          <ul>
            {numbers.map((n, k) => (
              <li key={n.label} style={i(k)}>
                <span className="numbers__n">
                  <CountUp value={n.value} />
                </span>
                <span className="numbers__l">{n.label}</span>
              </li>
            ))}
          </ul>
          <p className="numbers__since">{t('numbers.since')}</p>
        </Reveal>

        {/* Committees: uneven 3 + 2 grid */}
        <Reveal as="section" className="section committees" aria-labelledby="committees-title">
          <header className="split-head">
            <div>
              <DocLabel>{t('committees.label')}</DocLabel>
              <h2 id="committees-title" style={i(1)}>
                {t('committees.title', {
                  n: numWord(committeesN),
                  nl: numWord(committeesN).toLocaleLowerCase(lang),
                  committeesWord: word('numbers.committees', committeesN),
                })}
              </h2>
            </div>
            <p style={i(2)}>{t('committees.p')}</p>
          </header>
          <ul className="committees__grid">
            {c.committees.map((cm, k) => (
              <li key={cm.id} className="ccard" style={i(k + 2)}>
                <Picture photo={cm.photo} alt={tl(cm.name)} ratio="16 / 10" useThumb />
                <div className="ccard__body">
                  <h3>{cm.abbr}</h3>
                  <p className="ccard__name">{tl(cm.name)}</p>
                  <p>{tl(cm.blurb)}</p>
                  {ran(cm.id) && <p className="tag">{ran(cm.id)}</p>}
                </div>
              </li>
            ))}
          </ul>
          <Link to="/history" className="link">
            {t('committees.seeEvery')}
            <Arrow />
          </Link>
        </Reveal>

        {/* Past seasons: two wide offset cards */}
        {seasonsN > 0 && (
          <Reveal as="section" className="section past" aria-labelledby="past-title">
            <DocLabel>{t('past.label')}</DocLabel>
            <h2 id="past-title" style={i(1)}>
              {t('past.title', {
                n: numWord(seasonsN),
                nl: numWord(seasonsN).toLocaleLowerCase(lang),
                seasonsWord: word('numbers.seasons', seasonsN),
              })}
            </h2>
            <div className="past__list">
              {c.pastSeasons.map((s, k) => {
                const roman = toRoman(s.number)
                return (
                  <Link key={s.id} to={`/history#${s.id}`} className="pcard" style={i(k + 2)}>
                    <Picture photo={s.cover} alt={tl(s.coverAlt) || t('past.coverAlt', { roman })} ratio="4 / 3" />
                    <div className="pcard__body">
                      <Roman value={roman} className="pcard__roman" />
                      <h3>{t('past.season', { roman })}</h3>
                      <p className="pcard__meta">
                        {s.date && <span>{date(s.date)}</span>}
                        <span>{tl(s.venue)}</span>
                        {s.participants != null && (
                          <span>
                            {t('past.participants', {
                              n: s.participants,
                              participantsWord: word('numbers.participants', s.participants),
                            })}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Link to="/history" className="link">
              {t('past.readHistory')}
              <Arrow />
            </Link>
          </Reveal>
        )}
      </div>

      {/* The interactive moment and the final call to action */}
      <Reveal as="section" className="raise" aria-labelledby="raise-title">
        <div className="raise__inner">
          <div className="raise__text">
            <h2 id="raise-title">{t('placard.title')}</h2>
            <p style={i(1)}>{t('placard.p')}</p>
            <p className="raise__status" style={i(2)}>
              {t(status === 'open' ? 'placard.open' : status === 'closed' ? 'placard.closed' : 'placard.soon')}
            </p>
            <div style={i(3)}>
              <PrimaryCta long />
            </div>
          </div>
          <Placard />
        </div>
      </Reveal>
    </>
  )
}
