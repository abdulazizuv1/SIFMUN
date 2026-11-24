import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useContent } from '../data/content'
import type { Committee, SeasonCommittee, WorkingLanguage } from '../data/types'
import { localize, toRoman, useI18n } from '../i18n'
import type { Lang } from '../i18n'
import { PrimaryCta } from './Nav'

/* A sheet of paper laid over the page: a native <dialog>, so focus stays inside,
   Escape closes it and screen readers announce it. A click outside the paper closes it too.
   Focus goes back to whatever opened it.
   Rendered into <body> through a portal, so it never inherits the styles of where its
   button sits (the hero's caption bands have text shadows and ignore pointer events). */
export function Modal({
  open,
  onClose,
  label,
  title,
  titleLang,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  /** The document symbol in the corner, like SIFMUN/S.III/UNSC. */
  label: string
  title: ReactNode
  titleLang?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  const { t } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<Element | null>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement
      d.showModal()
      document.documentElement.classList.add('modal-open')
    }
    if (!open && d.open) d.close()
  }, [open])

  // The dialog can also close itself (Escape). Either way, tidy up once.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onClosed = () => {
      document.documentElement.classList.remove('modal-open')
      if (opener.current instanceof HTMLElement) opener.current.focus()
      onClose()
    }
    d.addEventListener('close', onClosed)
    return () => d.removeEventListener('close', onClosed)
  }, [onClose])

  useEffect(() => () => document.documentElement.classList.remove('modal-open'), [])

  return createPortal(
    <dialog
      ref={ref}
      className={`modal ${wide ? 'modal--wide' : ''}`}
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className="modal__paper">
        <header className="modal__head">
          <span className="modal__label">{label}</span>
          <button type="button" className="modal__close" onClick={() => ref.current?.close()}>
            <span>{t('committees.close')}</span>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M3 3l10 10M13 3 3 13" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>
        <h2 id={titleId} className="modal__title" lang={titleLang}>
          {title}
        </h2>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </dialog>,
    document.body,
  )
}

export const LANGUAGE_NAMES: Record<Lang, string> = { en: 'English', uz: 'Oʻzbekcha', ru: 'Русский' }

/** Paragraphs separated by an empty line. */
function Paragraphs({ text, lang }: { text: string; lang?: string }) {
  return (
    <>
      {text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p, i) => (
          <p key={i} lang={lang}>
            {p}
          </p>
        ))}
    </>
  )
}

export type CommitteeEntry = { sc: SeasonCommittee; committee: Committee }

/** In this committee's own working language when one is set, otherwise in the visitor's. */
export function committeeText(entry: CommitteeEntry, lang: Lang) {
  const working: Lang = (entry.sc.language as WorkingLanguage) || lang
  return {
    lang: working,
    name: localize(working, entry.committee.name),
    blurb: localize(working, entry.committee.blurb),
    agenda: localize(working, entry.sc.agenda),
  }
}

/** Everything about one committee of a season, written in the committee's working language. */
export function CommitteeModal({
  entry,
  seasonNumber,
  onClose,
  action,
}: {
  entry: CommitteeEntry | null
  seasonNumber: number
  onClose: () => void
  /** What the footer offers: a button that picks this committee in the form, or nothing (then: Apply). */
  action?: ReactNode
}) {
  const { t, lang } = useI18n()
  const { settings } = useContent()
  // Keep the last entry after closing, so the dialog stays mounted and can hand focus back.
  const [shown, setShown] = useState<CommitteeEntry | null>(entry)
  if (entry && entry !== shown) setShown(entry)
  if (!shown) return null
  const text = committeeText(shown, lang)
  const working = shown.sc.language

  return (
    <Modal
      open={entry !== null}
      onClose={onClose}
      label={`SIFMUN/S.${toRoman(seasonNumber)}/${shown.committee.abbr}`}
      titleLang={text.lang}
      title={
        <>
          <span className="modal__abbr" aria-hidden="true">
            {shown.committee.abbr}
          </span>
          <span className="modal__name">{text.name}</span>
        </>
      }
      footer={
        action ??
        (settings.registrationStatus === 'open' ? (
          <Link to="/register" className="btn" onClick={onClose}>
            {t('committees.apply')}
          </Link>
        ) : null)
      }
    >
      <ul className="modal__facts">
        {working && (
          <li>
            <span>{t('committees.workingLanguage')}</span>
            <b lang={working}>{LANGUAGE_NAMES[working]}</b>
          </li>
        )}
        {shown.sc.double && (
          <li>
            <span>{t('committees.format')}</span>
            <b>{t('committees.double')}</b>
          </li>
        )}
      </ul>
      {shown.sc.about ? <Paragraphs text={shown.sc.about} lang={text.lang} /> : text.blurb && <p lang={text.lang}>{text.blurb}</p>}
      {text.agenda && (
        <div className="modal__agenda">
          <span>{t('committees.agenda')}</span>
          <p lang={text.lang}>{text.agenda}</p>
        </div>
      )}
    </Modal>
  )
}

/** "What is MUN?": the day of a delegate, step by step, in the visitor's language. */
export function MunModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const steps = [1, 2, 3, 4, 5, 6, 7]
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      label="SIFMUN/MUN"
      title={t('mun.title')}
      footer={
        <>
          <p className="modal__note">{t('mun.note')}</p>
          <PrimaryCta long />
        </>
      }
    >
      <p className="modal__lede">{t('mun.lede')}</p>
      <ol className="modal__steps">
        {steps.map((n) => (
          <li key={n}>
            <span className="modal__step-n" aria-hidden="true">
              {toRoman(n)}
            </span>
            <div>
              <h3>{t(`mun.s${n}t`)}</h3>
              <p>{t(`mun.s${n}p`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  )
}

/** The "What is MUN?" button with its sheet. */
export function MunButton({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={`munbtn ${className}`} onClick={() => setOpen(true)}>
        <span className="munbtn__q" aria-hidden="true">
          ?
        </span>
        {t('mun.button')}
      </button>
      <MunModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
