import { useId, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useContent } from '../data/content'
import type { Answer, Question } from '../data/types'
import { localize, useI18n } from '../i18n'
import { CommitteeModal, LANGUAGE_NAMES, committeeText } from './Modal'
import type { CommitteeEntry } from './Modal'

type Value = string | string[]

const MAX = { short: 200, long: 2000, other: 300 }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE = /^\+?[\d\s()-]{7,20}$/

function isLink(text: string): boolean {
  try {
    const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`)
    return url.hostname.includes('.')
  } catch {
    return false
  }
}

/* The application form. Its questions come from the admin, per role.
   It is rendered only while registration is Open; the database rules enforce the same thing,
   so a form left open in an old tab cannot submit after registration closes. */
export function RegistrationForm() {
  const { t, tl, lang } = useI18n()
  const c = useContent()
  const formId = useId()
  const roles = useMemo(
    () => c.roles.filter((r) => r.active && r.questions.length > 0).sort((a, b) => a.order - b.order),
    [c.roles],
  )
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const [values, setValues] = useState<Record<string, Value>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [trap, setTrap] = useState('') // honeypot: people never see or fill this field
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const doneRef = useRef<HTMLParagraphElement>(null)
  const [about, setAbout] = useState<{ entry: CommitteeEntry; questionId: string } | null>(null)

  const role = roles.find((r) => r.id === roleId) ?? roles[0]
  if (!role) return <p className="formnote">{t('register.formClosed')}</p>

  const set = (id: string, v: Value) => {
    setValues((prev) => ({ ...prev, [id]: v }))
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }))
  }

  const check = (q: Question): string => {
    const v = values[q.id]
    const text = Array.isArray(v) ? v.filter(Boolean).join(', ') : (v ?? '').trim()
    if (!text) return q.required ? t('register.errRequired') : ''
    if (q.type === 'email' && !EMAIL.test(text)) return t('register.errEmail')
    if (q.type === 'phone' && !PHONE.test(text)) return t('register.errPhone')
    if (q.type === 'link' && !isLink(text)) return t('register.errLink')
    return ''
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    for (const q of role.questions) {
      const message = check(q)
      if (message) found[q.id] = message
    }
    setErrors(found)
    const first = Object.keys(found)[0]
    if (first) {
      document.getElementById(`${formId}-${first}`)?.focus()
      return
    }

    setState('sending')
    // A filled honeypot means a bot. Answer as if it worked and send nothing.
    if (trap) {
      setState('done')
      return
    }

    const answers: Answer[] = role.questions.flatMap((q) => {
      const v = values[q.id]
      const answer: Answer = {
        id: q.id,
        // English labels keep the export columns the same whatever language the applicant used.
        label: localize('en', q.label),
        type: q.type,
        value: (Array.isArray(v) ? v.filter(Boolean).join(', ') : (v ?? '')).trim(),
      }
      if (q.type !== 'committees') return [answer]
      // A double-delegation committee also asks for the partner's name.
      const picked = committeeEntries.find((e) => e.committee.abbr === answer.value)
      if (!pairs || !picked?.sc.double) return [answer]
      const partner = values[partnerKey(q.id)]
      return [
        answer,
        { id: partnerKey(q.id), label: 'Partner (double delegation)', type: 'short', value: (typeof partner === 'string' ? partner : '').trim() },
      ]
    })

    try {
      const [{ addDoc, collection, serverTimestamp }, { COL, db }] = await Promise.all([
        import('firebase/firestore/lite'),
        import('../lib/firebase'),
      ])
      if (!db) throw new Error('not-configured')
      await addDoc(collection(db, COL.registrations), {
        roleId: role.id,
        roleName: localize('en', role.name),
        seasonNumber: c.settings.upcomingSeason,
        lang,
        answers: JSON.stringify(answers),
        // The consent question in the form (photos and fee) is required, so a sent form always carries consent.
        consent: true,
        status: 'new',
        createdAt: serverTimestamp(),
      })
      setState('done')
      requestAnimationFrame(() => doneRef.current?.focus())
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <p ref={doneRef} tabIndex={-1} className="regform__done" role="status">
        {t('register.success')}
      </p>
    )
  }

  // The committees on offer: the upcoming season's, or every committee if the season has none listed yet.
  const committeeEntries: CommitteeEntry[] = c.upcomingCommittees.length
    ? c.upcomingCommittees
    : c.committees.map((committee) => ({
        committee,
        sc: { committeeId: committee.id, agenda: { en: '', uz: '', ru: '' }, chairIds: [], language: '', double: false, about: '' },
      }))
  const partnerKey = (questionId: string) => `${questionId}Partner`
  // Double delegation pairs delegates; a chair applies alone, so chairs get no partner field.
  const pairs = role.id !== 'chair'

  return (
    <form className="regform" onSubmit={submit} noValidate aria-labelledby={`${formId}-title`}>
      {roles.length > 1 && (
        <fieldset className="regform__roles">
          <legend id={`${formId}-title`}>{t('register.applyAs')}</legend>
          {roles.map((r) => (
            <label key={r.id} className={r.id === role.id ? 'is-on' : ''}>
              <input
                type="radio"
                name={`${formId}-role`}
                checked={r.id === role.id}
                onChange={() => {
                  setRoleId(r.id)
                  setErrors({})
                }}
              />
              <span>{tl(r.name)}</span>
            </label>
          ))}
        </fieldset>
      )}
      {roles.length === 1 && (
        <p id={`${formId}-title`} className="regform__single">
          {t('register.applyAs')}: <b>{tl(role.name)}</b>
        </p>
      )}

      {role.questions.map((q) => {
        const id = `${formId}-${q.id}`
        const error = errors[q.id]
        const label = tl(q.label)
        const describedBy = error ? `${id}-err` : undefined
        const common = { id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': describedBy, required: q.required }
        const text = typeof values[q.id] === 'string' ? (values[q.id] as string) : ''
        const many = Array.isArray(values[q.id]) ? (values[q.id] as string[]) : []
        const options = q.options.map((o) => tl(o)).filter(Boolean)
        const grouped = q.type === 'single' || q.type === 'multiple' || q.type === 'committees'

        const mark = q.required && (
          <span className="regform__req">
            <span aria-hidden="true">*</span>
            <span className="visually-hidden">{t('register.required')}</span>
          </span>
        )
        const errorLine = error && (
          <p id={`${id}-err`} className="regform__err">
            {error}
          </p>
        )

        if (grouped) {
          return (
            <fieldset key={q.id} className="regform__q">
              <legend>
                {label}
                {mark}
              </legend>
              {q.type === 'single' &&
                options.map((o, i) => (
                  <label key={o} className="regform__opt">
                    <input
                      type="radio"
                      id={i === 0 ? id : undefined}
                      name={id}
                      checked={text === o}
                      onChange={() => set(q.id, o)}
                    />
                    <span>{o}</span>
                  </label>
                ))}
              {q.type === 'multiple' &&
                options.map((o, i) => (
                  <label key={o} className="regform__opt">
                    <input
                      type="checkbox"
                      id={i === 0 ? id : undefined}
                      checked={many.includes(o)}
                      onChange={(e) => set(q.id, e.target.checked ? [...many, o] : many.filter((x) => x !== o))}
                    />
                    <span>{o}</span>
                  </label>
                ))}
              {q.type === 'committees' && (
                <>
                  <p className="regform__hint">{t('register.committeeHint')}</p>
                  <div className="regform__committees">
                    {committeeEntries.map((entry, i) => {
                      const ct = committeeText(entry, lang)
                      const value = entry.committee.abbr
                      const on = text === value
                      const working = entry.sc.language
                      return (
                        <div key={entry.committee.id} className={`cpick ${on ? 'is-on' : ''}`}>
                          <label className="cpick__main">
                            <input type="radio" id={i === 0 ? id : undefined} name={id} checked={on} onChange={() => set(q.id, value)} />
                            <span className="cpick__abbr">{value}</span>
                            <span className="cpick__name" lang={ct.lang}>
                              {ct.name}
                            </span>
                            <span className="cpick__meta">
                              {working && <span lang={working}>{LANGUAGE_NAMES[working]}</span>}
                              {entry.sc.double && <span>{t('committees.double')}</span>}
                            </span>
                          </label>
                          <button type="button" className="cpick__about" onClick={() => setAbout({ entry, questionId: q.id })}>
                            {t('committees.about')}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  {pairs && committeeEntries.find((e) => e.committee.abbr === text)?.sc.double && (
                    <div className="regform__partner">
                      <label htmlFor={`${id}-partner`}>{t('register.partner')}</label>
                      <input
                        id={`${id}-partner`}
                        type="text"
                        maxLength={MAX.short}
                        autoComplete="off"
                        value={typeof values[partnerKey(q.id)] === 'string' ? (values[partnerKey(q.id)] as string) : ''}
                        onChange={(e) => set(partnerKey(q.id), e.target.value)}
                      />
                      <p className="regform__hint">{t('register.partnerHint')}</p>
                    </div>
                  )}
                </>
              )}
              {errorLine}
            </fieldset>
          )
        }

        return (
          <div key={q.id} className="regform__q">
            <label htmlFor={id}>
              {label}
              {mark}
            </label>
            {q.type === 'long' ? (
              <textarea {...common} rows={5} maxLength={MAX.long} value={text} onChange={(e) => set(q.id, e.target.value)} />
            ) : q.type === 'dropdown' ? (
              <select {...common} value={text} onChange={(e) => set(q.id, e.target.value)}>
                <option value="">{t('register.select')}</option>
                {options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                {...common}
                type={
                  q.type === 'email' ? 'email' : q.type === 'phone' ? 'tel' : q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : q.type === 'link' ? 'url' : 'text'
                }
                inputMode={q.type === 'phone' ? 'tel' : q.type === 'number' ? 'decimal' : undefined}
                autoComplete={q.type === 'email' ? 'email' : q.type === 'phone' ? 'tel' : undefined}
                maxLength={q.type === 'short' ? MAX.short : MAX.other}
                value={text}
                onChange={(e) => set(q.id, e.target.value)}
              />
            )}
            {errorLine}
          </div>
        )
      })}

      {/* Honeypot. Hidden from people and from screen readers, tempting for bots. */}
      <div className="regform__trap" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      {state === 'error' && (
        <p className="regform__err" role="alert">
          {t('register.errGeneric')}
        </p>
      )}
      <button className="btn" disabled={state === 'sending'}>
        {state === 'sending' ? t('register.sending') : t('register.send')}
      </button>

      <CommitteeModal
        entry={about?.entry ?? null}
        seasonNumber={c.settings.upcomingSeason}
        onClose={() => setAbout(null)}
        action={
          about && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                set(about.questionId, about.entry.committee.abbr)
                setAbout(null)
              }}
            >
              {values[about.questionId] === about.entry.committee.abbr ? t('committees.chosen') : t('committees.choose')}
            </button>
          )
        }
      />
    </form>
  )
}
