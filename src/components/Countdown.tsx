import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n'

/** Counts down to the conference day. Text is written only when a digit changes. */
export function Countdown({ iso }: { iso: string }) {
  const { t } = useI18n()
  const cells = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    // The stored value is a calendar day; the conference day starts at 09:00 in Fergana (UTC+5).
    const target = new Date(`${iso.slice(0, 10)}T09:00:00+05:00`).getTime()
    const lastText = ['', '', '', '']
    const update = () => {
      const left = Math.max(0, target - Date.now())
      const s = Math.floor(left / 1000)
      const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
      parts.forEach((value, i) => {
        const text = i === 0 ? String(value) : String(value).padStart(2, '0')
        if (text !== lastText[i]) {
          lastText[i] = text
          const el = cells.current[i]
          if (el) el.textContent = text
        }
      })
    }
    update()
    const id = window.setInterval(update, 1000)
    return () => clearInterval(id)
  }, [iso])

  const labels = [t('s3.days'), t('s3.hours'), t('s3.minutes'), t('s3.seconds')]
  return (
    <div className="countdown" role="timer" aria-live="off">
      {labels.map((label, i) => (
        <div key={label} className="countdown__cell">
          <span
            className="countdown__num"
            ref={(el) => {
              cells.current[i] = el
            }}
          >
            0
          </span>
          <span className="countdown__label">{label}</span>
        </div>
      ))}
    </div>
  )
}
