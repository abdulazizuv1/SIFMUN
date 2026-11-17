import { useId, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useContent } from '../data/content'
import type { Answer, Question } from '../data/types'
import { localize, useI18n } from '../i18n'

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
  const [consent, setConsent] = useState(false)
  const [trap, setTrap] = useState('') // honeypot: people never see or fill this field
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const doneRef = useRef<HTMLParagraphElement>(null)

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
    if (!consent) found.consent = t('register.errConsent')
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

    const answers: Answer[] = role.questions.map((q) => {
      const v = values[q.id]
      return {
        id: q.id,
        // English labels keep the export columns the same whatever language the applicant used.
        label: localize('en', q.label),
        type: q.type,
        value: (Array.isArray(v) ? v.filter(Boolean).join(', ') : (v ?? '')).trim(),
      }
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

  const committeeOptions = c.committees.map((cm) => ({ value: cm.abbr, label: `${cm.abbr} · ${tl(cm.name)}` }))

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
                <div className="regform__ranks">
                  {[0, 1, 2].map((rank) => (
                    <label key={rank}>
                      <span>{t(`register.choice${rank + 1}`)}</span>
                      <select
                        id={rank === 0 ? id : undefined}
                        value={many[rank] ?? ''}
                        onChange={(e) => {
                          const next = [many[0] ?? '', many[1] ?? '', many[2] ?? '']
                          next[rank] = e.target.value
                          set(q.id, next)
                        }}
                      >
                        <option value="">{t('register.select')}</option>
                        {committeeOptions
                          // A committee already picked in another rank is not offered again.
                          .filter((o) => o.value === many[rank] || !many.includes(o.value))
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                    </label>
                  ))}
                </div>
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

      <div className="regform__consent">
        <label className="regform__opt">
          <input
            type="checkbox"
            id={`${formId}-consent`}
            checked={consent}
            aria-invalid={Boolean(errors.consent) || undefined}
            aria-describedby={errors.consent ? `${formId}-consent-err` : undefined}
            onChange={(e) => {
              setConsent(e.target.checked)
              if (errors.consent) setErrors((prev) => ({ ...prev, consent: '' }))
            }}
          />
          <span>{t('register.consent')}</span>
        </label>
        {errors.consent && (
          <p id={`${formId}-consent-err`} className="regform__err">
            {errors.consent}
          </p>
        )}
        <p className="regform__small">{t('register.under18')}</p>
      </div>

      {state === 'error' && (
        <p className="regform__err" role="alert">
          {t('register.errGeneric')}
        </p>
      )}
      <button className="btn" disabled={state === 'sending'}>
        {state === 'sending' ? t('register.sending') : t('register.send')}
      </button>
    </form>
  )
}
