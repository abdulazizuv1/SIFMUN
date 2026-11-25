import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useContent } from '../data/content'
import { firebaseReady } from '../lib/firebase'
import {
  FORM_EXTRA_UPDATE,
  SEASON3_UPDATE,
  appliedUpdates,
  applyFormExtraUpdate,
  applySeason3Update,
  checkAdmin,
  deleteFiles,
  importSeed,
  listDocs,
  readSettings,
  removeDoc,
  saveDoc,
  saveSettings,
  signIn,
  signOut,
  watchUser,
} from './api'
import type { AdminDoc } from './api'
import { Fields } from './fields'
import type { EditorCtx } from './fields'
import { Registrations } from './Registrations'
import { SECTIONS, SETTINGS_FIELDS, countEmpty } from './schema'
import type { SectionKey, SectionSpec } from './schema'
import './admin.css'

type Doc = Record<string, unknown>
type Lookup = Record<SectionKey, AdminDoc[]>

const EMPTY_LOOKUP: Lookup = { seasons: [], committees: [], team: [], awards: [], gallery: [], faq: [], roles: [] }

export default function Admin() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => watchUser(setUser), [])

  useEffect(() => {
    if (!user) {
      setAllowed(null)
      return
    }
    let alive = true
    void checkAdmin().then((ok) => alive && setAllowed(ok))
    return () => {
      alive = false
    }
  }, [user])

  if (!firebaseReady) {
    return (
      <Shell>
        <div className="adm-card">
          <h1>Админка не подключена</h1>
          <p>В файле <code>.env.local</code> нет настроек Firebase. Скопируйте <code>.env.example</code> и заполните значения.</p>
        </div>
      </Shell>
    )
  }
  if (user === undefined || (user && allowed === null)) {
    return (
      <Shell>
        <p className="adm-wait">Проверяю вход…</p>
      </Shell>
    )
  }
  if (!user) {
    return (
      <Shell>
        <Login />
      </Shell>
    )
  }
  if (!allowed) {
    return (
      <Shell>
        <NotAllowed user={user} />
      </Shell>
    )
  }
  return <Dashboard user={user} />
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm adm--center">
      <Link to="/" className="adm-back">
        ← На сайт
      </Link>
      {children}
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
    } catch {
      setError('Не получилось войти. Проверьте почту и пароль.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="adm-card adm-login" onSubmit={submit}>
      <h1>Вход в админку SIFMUN</h1>
      <label>
        <span>Почта</span>
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        <span>Пароль</span>
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="adm-error">{error}</p>}
      <button className="adm-btn adm-btn--main" disabled={busy}>
        {busy ? 'Вхожу…' : 'Войти'}
      </button>
    </form>
  )
}

function NotAllowed({ user }: { user: User }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="adm-card">
      <h1>Этот аккаунт не в списке админов</h1>
      <p>
        Вы вошли как <b>{user.email}</b>, но правила базы данных не знают этот аккаунт. Впишите UID ниже в файлы{' '}
        <code>firestore.rules</code> и <code>storage.rules</code>, задеплойте правила и обновите страницу.
      </p>
      <p className="adm-uid">
        <code>{user.uid}</code>
        <button
          type="button"
          className="adm-btn adm-btn--quiet"
          onClick={() => void navigator.clipboard.writeText(user.uid).then(() => setCopied(true))}
        >
          {copied ? 'Скопировано' : 'Скопировать UID'}
        </button>
      </p>
      <button type="button" className="adm-btn" onClick={() => void signOut()}>
        Выйти
      </button>
    </div>
  )
}

function Dashboard({ user }: { user: User }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const content = useContent()
  const section = pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'overview'

  const [lookup, setLookup] = useState<Lookup>(EMPTY_LOOKUP)
  const [settings, setSettings] = useState<Doc | null | undefined>(undefined)
  const [loadError, setLoadError] = useState('')

  const reload = useCallback(async () => {
    try {
      const [s, ...lists] = await Promise.all([readSettings(), ...SECTIONS.map((sec) => listDocs(sec.collection))])
      const next = { ...EMPTY_LOOKUP }
      SECTIONS.forEach((sec, i) => (next[sec.key] = lists[i]))
      setLookup(next)
      setSettings(s)
      setLoadError('')
    } catch {
      setLoadError('Не удалось прочитать базу. Проверьте интернет и что правила Firestore задеплоены.')
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  /** After any save: re-read the admin data and tell the public site to refresh too. */
  const afterSave = useCallback(async () => {
    await reload()
    content.refresh()
  }, [reload, content])

  const spec = SECTIONS.find((s) => s.key === section)
  const imported = settings !== null && settings !== undefined

  return (
    <div className="adm">
      <aside className="adm-side">
        <p className="adm-side__brand">SIFMUN · админка</p>
        <nav>
          <NavItem to="/admin" active={section === 'overview'} label="Обзор" />
          <NavItem to="/admin/settings" active={section === 'settings'} label="Настройки сайта" />
          {SECTIONS.map((s) => {
            const empties = lookup[s.key].reduce((sum, d) => sum + countEmpty(s.fields, d), 0)
            return <NavItem key={s.key} to={`/admin/${s.key}`} active={section === s.key} label={s.title} badge={empties} />
          })}
          <NavItem to="/admin/registrations" active={section === 'registrations'} label="Заявки" />
        </nav>
        <div className="adm-side__foot">
          <small>{user.email}</small>
          <button type="button" className="adm-btn adm-btn--quiet" onClick={() => void signOut()}>
            Выйти
          </button>
          <Link to="/" className="adm-back">
            ← На сайт
          </Link>
        </div>
      </aside>

      <main className="adm-main">
        {loadError && <p className="adm-error adm-banner">{loadError}</p>}
        {settings === undefined && !loadError ? (
          <p className="adm-wait">Читаю базу…</p>
        ) : !imported && section !== 'registrations' ? (
          <ImportCard onDone={afterSave} />
        ) : section === 'overview' ? (
          <Overview lookup={lookup} onOpen={(key) => navigate(`/admin/${key}`)} onSaved={afterSave} />
        ) : section === 'settings' ? (
          <SettingsEditor value={settings ?? {}} lookup={lookup} onSaved={afterSave} />
        ) : section === 'registrations' ? (
          <Registrations />
        ) : spec ? (
          <SectionEditor key={spec.key} spec={spec} lookup={lookup} onSaved={afterSave} />
        ) : (
          <p>Такого раздела нет.</p>
        )}
      </main>
    </div>
  )
}

function NavItem({ to, active, label, badge = 0 }: { to: string; active: boolean; label: string; badge?: number }) {
  return (
    <Link to={to} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>
      <span>{label}</span>
      {badge > 0 && <i title="Сколько полей ещё пусто">{badge}</i>}
    </Link>
  )
}

function ImportCard({ onDone }: { onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async () => {
    setBusy(true)
    setError('')
    try {
      await importSeed()
      await onDone()
    } catch (e) {
      setError(
        e instanceof Error && e.message === 'already-imported'
          ? 'Данные уже импортированы.'
          : 'Не получилось записать данные. Проверьте, что правила Firestore задеплоены и ваш UID в списке.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="adm-card">
      <h1>База пока пустая</h1>
      <p>
        Один раз загрузите начальные данные: два прошедших сезона, пять комитетов, двух организаторов, галерею, FAQ и две роли.
        Сайт сейчас показывает эти же данные из файла, после импорта он начнёт читать их из базы, и вы сможете всё менять здесь.
      </p>
      {error && <p className="adm-error">{error}</p>}
      <button type="button" className="adm-btn adm-btn--main" disabled={busy} onClick={() => void run()}>
        {busy ? 'Импортирую…' : 'Импортировать начальные данные'}
      </button>
    </div>
  )
}

function FormExtraCard({ onDone }: { onDone: () => Promise<void> }) {
  const [state, setState] = useState<'checking' | 'ready' | 'done' | 'busy'>('checking')
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    appliedUpdates()
      .then((u) => alive && setState(u[FORM_EXTRA_UPDATE] ? 'done' : 'ready'))
      .catch(() => alive && setState('ready'))
    return () => {
      alive = false
    }
  }, [])
  if (state === 'checking' || state === 'done') return null
  const run = async () => {
    setState('busy')
    setError('')
    try {
      await applyFormExtraUpdate()
      await onDone()
      setState('done')
    } catch {
      setError('Не получилось записать. Проверьте, что вы вошли под одним из двух админ-аккаунтов.')
      setState('ready')
    }
  }
  return (
    <div className="adm-card adm-card--update">
      <h2>Обновление: два вопроса в форме делегата</h2>
      <p>После «Место учёбы или работы» появятся два обязательных вопроса на трёх языках:</p>
      <ul>
        <li>«Из какого вы города и страны?» (короткий ответ);</li>
        <li>«Нужно ли вам общежитие на время конференции?» (Да / Нет).</li>
      </ul>
      <p>Остальные вопросы и ваши правки в них не меняются.</p>
      {error && <p className="adm-error">{error}</p>}
      <button type="button" className="adm-btn adm-btn--main" disabled={state === 'busy'} onClick={() => void run()}>
        {state === 'busy' ? 'Записываю…' : 'Добавить вопросы в форму'}
      </button>
    </div>
  )
}

function Season3Card({ onDone }: { onDone: () => Promise<void> }) {
  const [state, setState] = useState<'checking' | 'ready' | 'done' | 'busy'>('checking')
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    appliedUpdates()
      .then((u) => alive && setState(u[SEASON3_UPDATE] ? 'done' : 'ready'))
      .catch(() => alive && setState('ready'))
    return () => {
      alive = false
    }
  }, [])
  if (state === 'checking' || state === 'done') return null
  const run = async () => {
    setState('busy')
    setError('')
    try {
      await applySeason3Update()
      await onDone()
      setState('done')
    } catch {
      setError('Не получилось записать. Проверьте, что вы вошли под одним из двух админ-аккаунтов.')
      setState('ready')
    }
  }
  return (
    <div className="adm-card adm-card--update">
      <h2>Обновление: Сезон III, регистрация</h2>
      <p>Одна кнопка запишет в базу всё, что подготовлено для третьего сезона:</p>
      <ul>
        <li>дата 3 января 2027 и взнос 100 000 сум;</li>
        <li>шесть комитетов: ЕС (двойная делегация, русский), CEDAW, Security Council, General Assembly, INTERPOL (английский) и HRC (узбекский), с описаниями;</li>
        <li>11 вопросов формы делегата, как в Google-форме;</li>
        <li>новые ответы в FAQ про языки, дату и регистрацию;</li>
        <li>пять фото площадки Fergana Digital Hub;</li>
        <li>статус регистрации: открыта.</li>
      </ul>
      <p>Вопросы роли «Делегат» будут заменены. Всё остальное потом можно править в разделах слева.</p>
      {error && <p className="adm-error">{error}</p>}
      <button type="button" className="adm-btn adm-btn--main" disabled={state === 'busy'} onClick={() => void run()}>
        {state === 'busy' ? 'Записываю…' : 'Применить и открыть регистрацию'}
      </button>
    </div>
  )
}

function Overview({ lookup, onOpen, onSaved }: { lookup: Lookup; onOpen: (key: SectionKey) => void; onSaved: () => Promise<void> }) {
  return (
    <>
      <Season3Card onDone={onSaved} />
      <FormExtraCard onDone={onSaved} />
      <h1>Обзор</h1>
      <p className="adm-lede">Оранжевое число показывает, сколько полей в разделе ещё пусто. Пустые секции на сайте просто не показываются.</p>
      <div className="adm-tiles">
        {SECTIONS.map((s) => {
          const docs = lookup[s.key]
          const empties = docs.reduce((sum, d) => sum + countEmpty(s.fields, d), 0)
          return (
            <button key={s.key} type="button" className="adm-tile" onClick={() => onOpen(s.key)}>
              <b>{s.title}</b>
              <span>{docs.length} записей</span>
              {empties > 0 ? <i>пусто: {empties}</i> : <em>всё заполнено</em>}
            </button>
          )
        })}
      </div>
    </>
  )
}

/** Shared save bar with status text. */
function useSaver() {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const run = async (job: () => Promise<void>) => {
    setState('saving')
    try {
      await job()
      setState('saved')
    } catch {
      setState('error')
    }
  }
  const note =
    state === 'saving' ? 'Сохраняю…' : state === 'saved' ? 'Сохранено' : state === 'error' ? 'Не удалось сохранить. Попробуйте ещё раз.' : ''
  return { state, run, note, reset: () => setState('idle') }
}

function SettingsEditor({ value, lookup, onSaved }: { value: Doc; lookup: Lookup; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<Doc>(value)
  const saver = useSaver()
  const ctx: EditorCtx = { lookup, folder: 'settings', queueDelete: () => {} }
  return (
    <>
      <h1>Настройки сайта</h1>
      <div className="adm-card">
        <Fields
          fields={SETTINGS_FIELDS}
          doc={draft}
          ctx={ctx}
          onChange={(next) => {
            setDraft(next)
            saver.reset()
          }}
        />
        <div className="adm-actions">
          <button
            type="button"
            className="adm-btn adm-btn--main"
            disabled={saver.state === 'saving'}
            onClick={() =>
              void saver.run(async () => {
                await saveSettings(draft)
                await onSaved()
              })
            }
          >
            Сохранить
          </button>
          <span className={saver.state === 'error' ? 'adm-error' : 'adm-note'} role="status">
            {saver.note}
          </span>
        </div>
      </div>
    </>
  )
}

function SectionEditor({ spec, lookup, onSaved }: { spec: SectionSpec; lookup: Lookup; onSaved: () => Promise<void> }) {
  const docs = useMemo(() => [...lookup[spec.key]].sort(spec.sort), [lookup, spec])
  // editing: null = list view, 'new' = a fresh document, otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Doc>({})
  const pendingDeletes = useRef<(string | undefined)[]>([])
  const saver = useSaver()

  const open = (doc: AdminDoc | null) => {
    pendingDeletes.current = []
    saver.reset()
    setDraft(doc ? { ...doc } : spec.blank())
    setEditing(doc ? doc.id : 'new')
  }

  const ctx: EditorCtx = {
    lookup,
    folder: spec.collection,
    queueDelete: (paths) => pendingDeletes.current.push(...paths),
  }

  if (editing === null) {
    return (
      <>
        <header className="adm-head">
          <h1>{spec.title}</h1>
          <button type="button" className="adm-btn adm-btn--main" onClick={() => open(null)}>
            + Добавить {spec.one}
          </button>
        </header>
        {docs.length === 0 ? (
          <p className="adm-lede">Здесь пока ничего нет. На сайте этот блок не показывается, пока вы что-нибудь не добавите.</p>
        ) : (
          <ul className="adm-rows">
            {docs.map((d) => {
              const empties = countEmpty(spec.fields, d)
              const photo = (d.photo ?? d.cover ?? null) as { thumb?: string; src?: string } | null
              return (
                <li key={d.id}>
                  <button type="button" onClick={() => open(d)}>
                    <span className="adm-rows__pic">{photo?.src ? <img src={photo.thumb ?? photo.src} alt="" /> : null}</span>
                    <span className="adm-rows__text">
                      <b>{spec.rowTitle(d)}</b>
                      {spec.rowMeta && <small>{spec.rowMeta(d)}</small>}
                    </span>
                    {empties > 0 ? <i>пусто: {empties}</i> : <em>заполнено</em>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </>
    )
  }

  const isNew = editing === 'new'
  return (
    <>
      <header className="adm-head">
        <h1>{isNew ? `Новая запись: ${spec.title}` : spec.rowTitle(draft)}</h1>
        <button type="button" className="adm-btn adm-btn--quiet" onClick={() => setEditing(null)}>
          ← К списку
        </button>
      </header>
      <div className="adm-card">
        <Fields
          fields={spec.fields}
          doc={draft}
          ctx={ctx}
          onChange={(next) => {
            setDraft(next)
            saver.reset()
          }}
        />
        <div className="adm-actions">
          <button
            type="button"
            className="adm-btn adm-btn--main"
            disabled={saver.state === 'saving'}
            onClick={() =>
              void saver.run(async () => {
                const id = await saveDoc(spec.collection, isNew ? null : editing, draft)
                await deleteFiles(pendingDeletes.current)
                pendingDeletes.current = []
                setEditing(id)
                await onSaved()
              })
            }
          >
            Сохранить
          </button>
          {!isNew && (
            <button
              type="button"
              className="adm-btn adm-btn--danger"
              onClick={() => {
                if (!window.confirm(`Удалить «${spec.rowTitle(draft)}»? Это нельзя отменить.`)) return
                void saver.run(async () => {
                  const photos = [draft.photo, draft.cover].filter(Boolean) as { path?: string; thumbPath?: string }[]
                  await removeDoc(spec.collection, editing)
                  await deleteFiles(photos.flatMap((p) => [p.path, p.thumbPath]))
                  setEditing(null)
                  await onSaved()
                })
              }}
            >
              Удалить
            </button>
          )}
          <span className={saver.state === 'error' ? 'adm-error' : 'adm-note'} role="status">
            {saver.note}
          </span>
        </div>
      </div>
    </>
  )
}
