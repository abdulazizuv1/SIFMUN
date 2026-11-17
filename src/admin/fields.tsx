import { useId, useRef, useState } from 'react'
import type { Photo } from '../data/types'
import type { AdminDoc } from './api'
import { uploadClip, uploadPhoto } from './api'
import { SECTIONS, isEmpty, visible } from './schema'
import type { FieldSpec, SectionKey } from './schema'

type Doc = Record<string, unknown>
type LValue = { en: string; uz: string; ru: string }

export type EditorCtx = {
  /** Documents of every section, for the pickers. */
  lookup: Record<SectionKey, AdminDoc[]>
  /** Storage folder for uploads made from this editor. */
  folder: string
  /** Files to delete from Storage once the document is saved. */
  queueDelete: (paths: (string | undefined)[]) => void
}

const LANGS: (keyof LValue)[] = ['en', 'uz', 'ru']
const asL = (v: unknown): LValue => {
  const o = (v ?? {}) as Partial<LValue>
  return { en: o.en ?? '', uz: o.uz ?? '', ru: o.ru ?? '' }
}

/** Turns typed o' and g' into the correct Uzbek letters oʻ and gʻ (U+02BB). */
export const fixUzbek = (text: string): string => text.replace(/([oOgG])['’‘`ʼ´]/g, '$1ʻ')

function EmptyMark() {
  return <span className="adm-empty">пусто</span>
}

/** One text in three languages, edited through three tabs. A dot marks a language that is still empty. */
function LField({ value, onChange, long }: { value: unknown; onChange: (v: LValue) => void; long: boolean }) {
  const v = asL(value)
  const [tab, setTab] = useState<keyof LValue>('en')
  const id = useId()
  const set = (text: string) => onChange({ ...v, [tab]: text })
  return (
    <div className="adm-l">
      <div className="adm-l__tabs" role="tablist">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={tab === l}
            aria-controls={`${id}-panel`}
            className={v[l].trim() ? '' : 'is-empty'}
            onClick={() => setTab(l)}
          >
            {l.toUpperCase()}
          </button>
        ))}
        {tab === 'uz' && (
          <button type="button" className="adm-l__fix" onClick={() => set(fixUzbek(v.uz))} title="Заменяет o' и g' на правильные oʻ и gʻ">
            исправить oʻ gʻ
          </button>
        )}
        {tab !== 'en' && !v[tab].trim() && v.en.trim() && <span className="adm-l__note">пока показывается английский</span>}
      </div>
      <div id={`${id}-panel`} role="tabpanel">
        {long ? (
          <textarea rows={3} value={v[tab]} lang={tab} onChange={(e) => set(e.target.value)} />
        ) : (
          <input type="text" value={v[tab]} lang={tab} onChange={(e) => set(e.target.value)} />
        )}
      </div>
    </div>
  )
}

function PhotoField({ value, onChange, ctx }: { value: unknown; onChange: (v: Photo | null) => void; ctx: EditorCtx }) {
  const photo = (value ?? null) as Photo | null
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const uploaded = await uploadPhoto(file, ctx.folder)
      if (photo) ctx.queueDelete([photo.path, photo.thumbPath])
      onChange(uploaded)
    } catch {
      setError('Не удалось загрузить фото. Проверьте, что это изображение и что правила Storage задеплоены.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="adm-photo">
      <div className="adm-photo__preview">
        {photo ? <img src={photo.thumb ?? photo.src} alt="" /> : <span>No photo</span>}
      </div>
      <div className="adm-photo__tools">
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
        <button type="button" className="adm-btn" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Загружаю…' : photo ? 'Заменить' : 'Загрузить фото'}
        </button>
        {photo && (
          <button
            type="button"
            className="adm-btn adm-btn--quiet"
            disabled={busy}
            onClick={() => {
              ctx.queueDelete([photo.path, photo.thumbPath])
              onChange(null)
            }}
          >
            Убрать
          </button>
        )}
        {photo && (
          <small>
            {photo.width}×{photo.height}
          </small>
        )}
        <small>Фото сжимается в браузере до 1920 px перед загрузкой.</small>
        {error && <small className="adm-error">{error}</small>}
      </div>
    </div>
  )
}

function ClipField({ value, onChange, ctx }: { value: unknown; onChange: (v: string) => void; ctx: EditorCtx }) {
  const url = typeof value === 'string' ? value : ''
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'video/mp4') {
      setError('Нужен файл MP4. Файлы .MOV с iPhone сначала сконвертируйте.')
      return
    }
    if (file.size > 40 * 1024 * 1024) {
      setError('Файл больше 40 МБ. Сократите или сожмите клип.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const done = await uploadClip(file, ctx.folder)
      onChange(done.url)
    } catch {
      setError('Не удалось загрузить клип.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="adm-clip">
      <input type="text" value={url} placeholder="Ссылка на MP4 или загрузите файл" onChange={(e) => onChange(e.target.value)} />
      <input ref={input} type="file" accept="video/mp4" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      <button type="button" className="adm-btn" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? 'Загружаю…' : 'Загрузить MP4'}
      </button>
      {error && <small className="adm-error">{error}</small>}
    </div>
  )
}

function choices(from: SectionKey | undefined, ctx: EditorCtx): { id: string; label: string }[] {
  const section = SECTIONS.find((s) => s.key === from)
  if (!section) return []
  return [...(ctx.lookup[section.key] ?? [])].sort(section.sort).map((d) => ({ id: d.id, label: section.rowTitle(d) }))
}

function ListField({ spec, value, onChange, ctx }: { spec: FieldSpec; value: unknown; onChange: (v: Doc[]) => void; ctx: EditorCtx }) {
  const items = (Array.isArray(value) ? value : []) as Doc[]
  const move = (i: number, dir: number) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const blank = (): Doc => {
    const item: Doc = { id: `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}` }
    for (const f of spec.fields ?? []) {
      item[f.key] =
        f.type === 'ltext' || f.type === 'llong'
          ? { en: '', uz: '', ru: '' }
          : f.type === 'bool'
            ? false
            : f.type === 'refs' || f.type === 'list' || f.type === 'llist'
              ? []
              : f.type === 'select'
                ? (f.options?.[0]?.value ?? '')
                : ''
    }
    return item
  }
  return (
    <div className="adm-list">
      {items.map((item, i) => (
        <div key={String(item.id ?? i)} className="adm-list__item">
          <div className="adm-list__bar">
            <b>
              {spec.itemLabel} {i + 1}
            </b>
            <button type="button" className="adm-icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше">
              ↑
            </button>
            <button type="button" className="adm-icon" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Ниже">
              ↓
            </button>
            <button type="button" className="adm-icon adm-icon--danger" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Удалить">
              ×
            </button>
          </div>
          <Fields
            fields={spec.fields ?? []}
            doc={item}
            ctx={ctx}
            onChange={(next) => onChange(items.map((it, k) => (k === i ? next : it)))}
          />
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn--quiet" onClick={() => onChange([...items, blank()])}>
        + Добавить {spec.itemLabel}
      </button>
    </div>
  )
}

function LListField({ spec, value, onChange }: { spec: FieldSpec; value: unknown; onChange: (v: LValue[]) => void }) {
  const items = (Array.isArray(value) ? value : []).map(asL)
  return (
    <div className="adm-list">
      {items.map((item, i) => (
        <div key={i} className="adm-list__item adm-list__item--slim">
          <LField value={item} long={false} onChange={(next) => onChange(items.map((it, k) => (k === i ? next : it)))} />
          <button type="button" className="adm-icon adm-icon--danger" onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Удалить">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn--quiet" onClick={() => onChange([...items, { en: '', uz: '', ru: '' }])}>
        + Добавить {spec.itemLabel}
      </button>
    </div>
  )
}

function Control({ spec, value, onChange, ctx }: { spec: FieldSpec; value: unknown; onChange: (v: unknown) => void; ctx: EditorCtx }) {
  switch (spec.type) {
    case 'text':
      return <input type="text" value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
    case 'number':
      return (
        <input
          type="number"
          step="any"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      )
    case 'date':
      return <input type="date" value={String(value ?? '')} onChange={(e) => onChange(e.target.value || null)} />
    case 'bool':
      return (
        <label className="adm-check">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
          <span>{value === true ? 'Да' : 'Нет'}</span>
        </label>
      )
    case 'select':
      return (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {spec.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    case 'ltext':
      return <LField value={value} long={false} onChange={onChange} />
    case 'llong':
      return <LField value={value} long onChange={onChange} />
    case 'photo':
      return <PhotoField value={value} onChange={onChange} ctx={ctx} />
    case 'clip':
      return <ClipField value={value} onChange={onChange} ctx={ctx} />
    case 'ref':
      return (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value || (spec.optional ? null : ''))}>
          <option value="">не выбрано</option>
          {choices(spec.from, ctx).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      )
    case 'refs': {
      const picked = (Array.isArray(value) ? value : []) as string[]
      const all = choices(spec.from, ctx)
      if (!all.length) return <small>Список пуст.</small>
      return (
        <div className="adm-refs">
          {all.map((c) => (
            <label key={c.id} className="adm-check">
              <input
                type="checkbox"
                checked={picked.includes(c.id)}
                onChange={(e) => onChange(e.target.checked ? [...picked, c.id] : picked.filter((x) => x !== c.id))}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      )
    }
    case 'list':
      return <ListField spec={spec} value={value} onChange={onChange} ctx={ctx} />
    case 'llist':
      return <LListField spec={spec} value={value} onChange={onChange} />
  }
}

/** Renders every field of a document. Empty fields carry a visible mark. */
export function Fields({ fields, doc, onChange, ctx }: { fields: FieldSpec[]; doc: Doc; onChange: (next: Doc) => void; ctx: EditorCtx }) {
  return (
    <div className="adm-fields">
      {fields
        .filter((f) => visible(f, doc))
        .map((f) => (
          <div key={f.key} className={`adm-field adm-field--${f.type}`}>
            <div className="adm-field__label">
              <span>{f.label}</span>
              {!f.optional && isEmpty(f, doc[f.key]) && <EmptyMark />}
            </div>
            <Control spec={f} value={doc[f.key]} ctx={ctx} onChange={(v) => onChange({ ...doc, [f.key]: v })} />
            {f.hint && <small className="adm-hint">{f.hint}</small>}
          </div>
        ))}
    </div>
  )
}
