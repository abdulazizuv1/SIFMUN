import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import en from './en.json'
import uz from './uz.json'
import ru from './ru.json'

export type Lang = 'en' | 'uz' | 'ru'
export const LANGS: Lang[] = ['en', 'uz', 'ru']

/** Every text field in the database is stored like this. Empty falls back to English. */
export type L = { en: string; uz: string; ru: string }

const DICT: Record<Lang, unknown> = { en, uz, ru }
const LOCALE: Record<Lang, string> = { en: 'en-GB', uz: 'uz-Latn-UZ', ru: 'ru-RU' }
const STORAGE_KEY = 'sifmun.lang'

type Vars = Record<string, string | number>

function lookup(lang: Lang, key: string): unknown {
  let node: unknown = DICT[lang]
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return node
}

function fill(text: string, vars?: Vars): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m))
}

/** Translate a UI string. Falls back to English, then to the key itself. */
export function translate(lang: Lang, key: string, vars?: Vars): string {
  const hit = lookup(lang, key)
  if (typeof hit === 'string' && hit !== '') return fill(hit, vars)
  const fallback = lookup('en', key)
  return typeof fallback === 'string' ? fill(fallback, vars) : key
}

function list(lang: Lang, key: string): string[] {
  const hit = lookup(lang, key)
  if (Array.isArray(hit) && hit.length) return hit as string[]
  const fallback = lookup('en', key)
  return Array.isArray(fallback) ? (fallback as string[]) : []
}

/** Pick the right plural form. English: 2 forms. Russian: 3 forms. Uzbek: 1 form. */
export function plural(lang: Lang, n: number, forms: string[]): string {
  if (!forms.length) return ''
  if (lang === 'ru') {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return forms[0]
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1] ?? forms[0]
    return forms[2] ?? forms[forms.length - 1]
  }
  if (lang === 'en') return n === 1 ? forms[0] : (forms[1] ?? forms[0])
  return forms[0]
}

/** Read a database text field in the current language, falling back to English. */
export function localize(lang: Lang, value: L | null | undefined): string {
  if (!value) return ''
  return value[lang]?.trim() || value.en?.trim() || ''
}

export function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let out = ''
  let rest = Math.max(0, Math.floor(n))
  for (const [value, glyph] of map) {
    while (rest >= value) {
      out += glyph
      rest -= value
    }
  }
  return out
}

type I18n = {
  lang: Lang
  setLang: (lang: Lang) => void
  /** UI string in the current language. */
  t: (key: string, vars?: Vars) => string
  /** UI string in a specific language (used by the three-voices motif). */
  tIn: (lang: Lang, key: string, vars?: Vars) => string
  /** Database text field in the current language. */
  tl: (value: L | null | undefined) => string
  /** Word for a count with the right plural form, for example "seasons". */
  word: (key: string, n: number) => string
  /** Number as a capitalised word when small ("Two"), otherwise as digits. */
  numWord: (n: number) => string
  date: (iso: string) => string
}

const Ctx = createContext<I18n | null>(null)

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'uz' || stored === 'ru') return stored
  } catch {
    /* storage can be blocked; the default still works */
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = translate(lang, 'meta.title')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', translate(lang, 'meta.description'))
  }, [lang])

  const value = useMemo<I18n>(() => {
    const fmt = new Intl.DateTimeFormat(LOCALE[lang], {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Tashkent',
    })
    return {
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      tIn: (other, key, vars) => translate(other, key, vars),
      tl: (v) => localize(lang, v),
      word: (key, n) => plural(lang, n, list(lang, key)),
      numWord: (n) => list(lang, 'count')[n] ?? String(n),
      date: (iso) => {
        const d = new Date(iso)
        return Number.isNaN(d.getTime()) ? '' : fmt.format(d)
      },
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
