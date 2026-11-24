import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useContent } from '../data/content'
import { toRoman, useI18n } from '../i18n'
import { CommitteeModal, LANGUAGE_NAMES, committeeText } from './Modal'
import type { CommitteeEntry } from './Modal'

/* The upcoming season's committees as a row of conference placards. Each card names
   the committee in its own working language and opens the full description. */
export function CommitteeCards() {
  const { t, lang } = useI18n()
  const c = useContent()
  const [open, setOpen] = useState<CommitteeEntry | null>(null)
  const season = c.upcoming
  if (!season || !c.upcomingCommittees.length) return null

  return (
    <>
      <ul className="placards">
        {c.upcomingCommittees.map((entry, k) => {
          const text = committeeText(entry, lang)
          const working = entry.sc.language
          return (
            <li key={entry.sc.committeeId} style={{ '--i': k + 2 } as CSSProperties}>
              <button type="button" className="placard" onClick={() => setOpen(entry)}>
                <span className="placard__top">
                  <span className="placard__sym">
                    S.{toRoman(season.number)}/{String(k + 1).padStart(2, '0')}
                  </span>
                  {working && (
                    <span className="placard__lang" lang={working} title={`${t('committees.workingLanguage')}: ${LANGUAGE_NAMES[working]}`}>
                      {working.toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="placard__abbr">{entry.committee.abbr}</span>
                <span className="placard__name" lang={text.lang}>
                  {text.name}
                </span>
                {text.blurb && (
                  <span className="placard__blurb" lang={text.lang}>
                    {text.blurb}
                  </span>
                )}
                <span className="placard__foot">
                  {entry.sc.double ? <span className="placard__tag">{t('committees.double')}</span> : <span />}
                  <span className="placard__more">
                    {t('committees.about')}
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
                      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <CommitteeModal entry={open} seasonNumber={season.number} onClose={() => setOpen(null)} />
    </>
  )
}
