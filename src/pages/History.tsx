import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import { Clip, Gallery } from '../components/Gallery'
import { PrimaryCta } from '../components/Nav'
import { TriVoice } from '../components/TriVoice'
import { DocLabel, Reveal, Roman } from '../components/ui'
import { useContent } from '../data/content'
import type { AwardType, Season } from '../data/types'
import { toRoman, useI18n } from '../i18n'

const i = (n: number) => ({ '--i': n }) as CSSProperties
const AWARD_ORDER: AwardType[] = ['best', 'outstanding', 'honorable']

export function History() {
  const { t, word, numWord, lang } = useI18n()
  const c = useContent()
  const { hash } = useLocation()
  const n = c.pastSeasons.length

  // Arriving from a season card: scroll to that season once the page has rendered.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    el?.scrollIntoView({ block: 'start' })
  }, [hash])

  return (
    <>
      <header className="pagehead">
        <DocLabel>{t('history.label')}</DocLabel>
        <TriVoice textKey="history.title" className="pagehead__title" />
        <p className="lede">
          {t('history.p', {
            n: numWord(n),
            nl: numWord(n).toLocaleLowerCase(lang),
            num: n,
            conferencesWord: word('numbers.conferences', n),
          })}
        </p>
      </header>

      <div className="timeline">
        {c.seasons.map((s) => (
          <SeasonBlock key={s.id} season={s} />
        ))}
      </div>
    </>
  )
}

function SeasonBlock({ season }: { season: Season }) {
  const { t, tl, date, word } = useI18n()
  const c = useContent()
  const roman = toRoman(season.number)
  const upcoming = season.status === 'upcoming'

  const items = c.gallery.filter((g) => g.seasonId === season.id).sort((a, b) => a.order - b.order)
  const photos = items.filter((g) => g.kind === 'photo')
  const clips = items.filter((g) => g.kind === 'video' && g.video)
  const awards = c.awards.filter((a) => a.seasonId === season.id)
  const memberById = new Map(c.team.map((m) => [m.id, m]))

  const committees = season.committees
    .map((sc) => ({ sc, committee: c.committeeById.get(sc.committeeId) }))
    .filter((x) => x.committee)

  return (
    <Reveal as="section" id={season.id} className={`season ${upcoming ? 'season--upcoming' : ''}`} aria-labelledby={`${season.id}-title`}>
      <div className="season__rail" aria-hidden="true">
        <Roman value={roman} className="season__roman" />
      </div>

      <div className="season__body">
        <h2 id={`${season.id}-title`}>
          {t('past.season', { roman })}
          {upcoming && <span className="chip">{t('history.upcoming')}</span>}
        </h2>

        <dl className="facts" style={i(1)}>
          <div>
            <dt>{t('history.date')}</dt>
            <dd>{season.date ? date(season.date) : t('s3.dateTba')}</dd>
          </div>
          <div>
            <dt>{t('history.venue')}</dt>
            <dd>{tl(season.venue)}</dd>
          </div>
          {season.participants != null && (
            <div>
              <dt>{t('history.participants')}</dt>
              <dd>
                {season.participants} <span className="visually-hidden">{word('numbers.participants', season.participants)}</span>
              </dd>
            </div>
          )}
        </dl>

        {upcoming && (
          <div style={i(2)}>
            <PrimaryCta long />
          </div>
        )}

        {committees.length > 0 && (
          <div className="season__part" style={i(2)}>
            <h3>{t('history.committees')}</h3>
            <ul className="scoms">
              {committees.map(({ sc, committee }) => {
                const agenda = tl(sc.agenda)
                const chairs = sc.chairIds.map((id) => tl(memberById.get(id)?.name)).filter(Boolean)
                return (
                  <li key={sc.committeeId}>
                    <p className="scoms__abbr">{committee!.abbr}</p>
                    <p className="scoms__name">{tl(committee!.name)}</p>
                    {agenda && (
                      <p className="scoms__line">
                        <b>{t('history.agenda')}</b> {agenda}
                      </p>
                    )}
                    {chairs.length > 0 && (
                      <p className="scoms__line">
                        <b>{t('history.chairs')}</b> {chairs.join(', ')}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {awards.length > 0 && (
          <div className="season__part" style={i(3)}>
            <h3>{t('history.awards')}</h3>
            <ul className="awards">
              {AWARD_ORDER.flatMap((type) =>
                awards
                  .filter((a) => a.type === type)
                  .sort((a, b) => a.order - b.order)
                  .map((a) => (
                    <li key={a.id}>
                      <span className="awards__type">{t(`history.${type}`)}</span>
                      <span className="awards__who">{a.recipient}</span>
                      <span className="awards__com">{c.committeeById.get(a.committeeId)?.abbr}</span>
                    </li>
                  )),
              )}
            </ul>
          </div>
        )}

        {photos.length > 0 && (
          <div className="season__part" style={i(3)}>
            <h3>{t('history.gallery')}</h3>
            <Gallery items={photos} />
          </div>
        )}

        {clips.length > 0 && (
          <div className="season__part" style={i(4)}>
            <h3>{t('history.moments')}</h3>
            <div className="clips">
              {clips.map((clip) => (
                <Clip key={clip.id} item={clip} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}
