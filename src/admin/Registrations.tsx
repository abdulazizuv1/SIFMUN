import { useEffect, useMemo, useState } from 'react'
import type { Answer, ApplicationStatus, Registration } from '../data/types'
import { COL } from '../lib/firebase'
import { listRegistrations, removeDoc, setRegistrationStatus } from './api'

const STATUS: { value: ApplicationStatus; label: string }[] = [
  { value: 'new', label: 'Новая' },
  { value: 'accepted', label: 'Принята' },
  { value: 'waitlist', label: 'Лист ожидания' },
  { value: 'rejected', label: 'Отклонена' },
]
const statusLabel = (s: string) => STATUS.find((x) => x.value === s)?.label ?? s

function parseAnswers(raw: string): Answer[] {
  try {
    const list = JSON.parse(raw) as Answer[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

const when = (ms: number) =>
  ms ? new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Tashkent' }).format(ms) : ''

/** CSV with a UTF-8 mark and semicolons, so Excel opens it with Cyrillic and Uzbek text intact. */
function toCsv(rows: Registration[]): string {
  const parsed = rows.map((r) => ({ r, answers: parseAnswers(r.answers) }))
  const columns: string[] = []
  for (const p of parsed) for (const a of p.answers) if (!columns.includes(a.label)) columns.push(a.label)
  const cell = (v: string) => {
    // A cell starting with = or @ (or + / - followed by anything that is not a plain number or phone)
    // would be run as a formula by Excel. A quote in front makes it plain text. Phone numbers stay as typed.
    const risky = /^[=@\t\r]/.test(v) || (/^[+\-]/.test(v) && !/^[+\-]?[\d\s().-]+$/.test(v))
    const safe = risky ? `'${v}` : v
    return `"${safe.replace(/"/g, '""')}"`
  }
  const head = ['Дата', 'Роль', 'Сезон', 'Язык', 'Статус', ...columns].map(cell).join(';')
  const body = parsed.map(({ r, answers }) =>
    [when(r.createdAt), r.roleName, String(r.seasonNumber), r.lang, statusLabel(r.status), ...columns.map((c) => answers.find((a) => a.label === c)?.value ?? '')]
      .map(cell)
      .join(';'),
  )
  return '﻿' + [head, ...body].join('\r\n')
}

export function Registrations() {
  const [rows, setRows] = useState<Registration[] | null>(null)
  const [error, setError] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = () =>
    listRegistrations()
      .then((r) => {
        setRows(r)
        setError('')
      })
      .catch(() => setError('Не удалось прочитать заявки. Их видят только два аккаунта из списка админов.'))

  useEffect(() => {
    void load()
  }, [])

  const roles = useMemo(() => [...new Set((rows ?? []).map((r) => r.roleName).filter(Boolean))], [rows])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (rows ?? []).filter(
      (r) => (!role || r.roleName === role) && (!status || r.status === status) && (!q || r.answers.toLowerCase().includes(q)),
    )
  }, [rows, role, status, query])

  const download = () => {
    const blob = new Blob([toCsv(shown)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sifmun-registrations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const change = async (id: string, next: ApplicationStatus) => {
    setRows((list) => (list ?? []).map((r) => (r.id === id ? { ...r, status: next } : r)))
    try {
      await setRegistrationStatus(id, next)
    } catch {
      setError('Статус не сохранился. Обновите страницу и попробуйте ещё раз.')
      void load()
    }
  }

  const remove = async (r: Registration) => {
    if (!window.confirm('Удалить эту заявку навсегда? Это нельзя отменить.')) return
    try {
      await removeDoc(COL.registrations, r.id)
      setRows((list) => (list ?? []).filter((x) => x.id !== r.id))
    } catch {
      setError('Не удалось удалить заявку.')
    }
  }

  return (
    <>
      <header className="adm-head">
        <h1>Заявки</h1>
        <button type="button" className="adm-btn adm-btn--main" onClick={download} disabled={!shown.length}>
          Скачать CSV для Excel ({shown.length})
        </button>
      </header>
      <p className="adm-lede">Заявки видят только два админа. Не пересылайте файл с данными участников в открытые чаты.</p>
      {error && <p className="adm-error adm-banner">{error}</p>}

      <div className="adm-filters">
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Роль">
          <option value="">Все роли</option>
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
          <option value="">Все статусы</option>
          {STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <input type="search" placeholder="Поиск по ответам" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {rows === null && !error ? (
        <p className="adm-wait">Читаю заявки…</p>
      ) : shown.length === 0 ? (
        <p className="adm-lede">Заявок пока нет.</p>
      ) : (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Роль</th>
                <th>Первые ответы</th>
                <th>Статус</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const answers = parseAnswers(r.answers)
                const open = openId === r.id
                return (
                  <tr key={r.id} className={open ? 'is-open' : ''}>
                    <td>{when(r.createdAt)}</td>
                    <td>
                      {r.roleName}
                      <small>
                        сезон {r.seasonNumber} · {r.lang}
                      </small>
                    </td>
                    <td>
                      {open ? (
                        <dl className="adm-answers">
                          {answers.map((a) => (
                            <div key={a.id}>
                              <dt>{a.label}</dt>
                              <dd>{a.value || 'нет ответа'}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        answers
                          .slice(0, 3)
                          .map((a) => a.value)
                          .filter(Boolean)
                          .join(' · ')
                      )}
                    </td>
                    <td>
                      <select value={r.status} onChange={(e) => void change(r.id, e.target.value as ApplicationStatus)} aria-label="Статус заявки">
                        {STATUS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="adm-table__tools">
                      <button type="button" className="adm-btn adm-btn--quiet" onClick={() => setOpenId(open ? null : r.id)}>
                        {open ? 'Свернуть' : 'Открыть'}
                      </button>
                      {open && (
                        <button type="button" className="adm-btn adm-btn--danger" onClick={() => void remove(r)}>
                          Удалить
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
