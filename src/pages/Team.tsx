import { useState } from 'react'
import type { CSSProperties } from 'react'
import { TriVoice } from '../components/TriVoice'
import { DocLabel, Picture, Reveal } from '../components/ui'
import { useContent } from '../data/content'
import type { TeamGroup, TeamMember } from '../data/types'
import { toRoman, useI18n } from '../i18n'

const i = (n: number) => ({ '--i': n }) as CSSProperties
const GROUPS: { group: TeamGroup; key: string }[] = [
  { group: 'chair', key: 'team.chairs' },
  { group: 'secretariat', key: 'team.secretariat' },
  { group: 'volunteer', key: 'team.volunteers' },
]

function Card({ member, lead = false }: { member: TeamMember; lead?: boolean }) {
  const { tl } = useI18n()
  const name = tl(member.name)
  const role = tl(member.role)
  const bio = tl(member.bio)
  return (
    <article className={`tcard ${lead ? 'tcard--lead' : ''}`}>
      <Picture photo={member.photo} alt={name || role} ratio="4 / 5" sizes="(max-width: 720px) 80vw, 360px" />
      <div className="tcard__body">
        {/* The role is always known. The name appears once it is added in the admin. */}
        <p className="tcard__role">{role}</p>
        {name && <h3>{name}</h3>}
        {bio && <p className="tcard__bio">{bio}</p>}
      </div>
    </article>
  )
}

export function Team() {
  const { t } = useI18n()
  const c = useContent()
  const leads = c.team.filter((m) => m.group === 'lead').sort((a, b) => a.order - b.order)

  // Only seasons that actually have people listed get a tab.
  const seasonsWithTeam = c.seasons.filter((s) => c.team.some((m) => m.seasonId === s.id))
  const [picked, setPicked] = useState<string | null>(null)
  const activeId = picked ?? seasonsWithTeam[seasonsWithTeam.length - 1]?.id ?? null

  return (
    <>
      <header className="pagehead">
        <DocLabel>{t('team.label')}</DocLabel>
        <TriVoice textKey="team.title" className="pagehead__title" />
        <p className="lede">{t('team.p')}</p>
      </header>

      <Reveal as="section" className="section leads" aria-label={t('nav.team')}>
        {leads.map((m, k) => (
          <div key={m.id} style={i(k)}>
            <Card member={m} lead />
          </div>
        ))}
      </Reveal>

      {seasonsWithTeam.length > 0 && activeId && (
        <Reveal as="section" className="section crew" aria-labelledby="crew-title">
          <h2 id="crew-title">{t('team.seasonTeams')}</h2>
          <div className="tabs" role="tablist" aria-label={t('team.seasonTeams')}>
            {seasonsWithTeam.map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                id={`tab-${s.id}`}
                aria-selected={s.id === activeId}
                aria-controls="crew-panel"
                onClick={() => setPicked(s.id)}
              >
                {t('past.season', { roman: toRoman(s.number) })}
              </button>
            ))}
          </div>
          <div id="crew-panel" role="tabpanel" aria-labelledby={`tab-${activeId}`}>
            {GROUPS.map(({ group, key }) => {
              const people = c.team
                .filter((m) => m.seasonId === activeId && m.group === group)
                .sort((a, b) => a.order - b.order)
              if (!people.length) return null
              return (
                <div key={group} className="crew__group">
                  <h3>{t(key)}</h3>
                  <div className="crew__grid">
                    {people.map((m) => (
                      <Card key={m.id} member={m} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </Reveal>
      )}
    </>
  )
}
