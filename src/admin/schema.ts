/* Describes every admin section as data: which fields a document has and how each is edited.
   One generic editor (fields.tsx) renders all of them, so adding a field is one line here. */
import { COL } from '../lib/firebase'

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'bool'
  | 'select'
  | 'ltext' // one line, three languages
  | 'llong' // paragraph, three languages
  | 'photo'
  | 'clip'
  | 'ref' // pick one document from another section
  | 'refs' // pick several
  | 'list' // repeatable group of fields
  | 'llist' // repeatable three-language line

export type Option = { value: string; label: string }

export type FieldSpec = {
  key: string
  label: string
  type: FieldType
  hint?: string
  options?: Option[]
  /** For ref / refs: the section the choices come from. */
  from?: SectionKey
  /** For list: the fields of one item. */
  fields?: FieldSpec[]
  itemLabel?: string
  /** An empty value here is normal and is not counted as "still empty". */
  optional?: boolean
  /** Show this field only when another field of the same document has one of these values. */
  when?: { key: string; in: string[] }
}

export type SectionKey = 'seasons' | 'committees' | 'team' | 'awards' | 'gallery' | 'faq' | 'roles'

export type SectionSpec = {
  key: SectionKey
  collection: string
  title: string
  one: string
  fields: FieldSpec[]
  /** Text shown for a document in lists and in pickers. */
  rowTitle: (doc: Record<string, unknown>) => string
  rowMeta?: (doc: Record<string, unknown>) => string
  sort: (a: Record<string, unknown>, b: Record<string, unknown>) => number
  blank: () => Record<string, unknown>
}

const L = () => ({ en: '', uz: '', ru: '' })
const en = (v: unknown): string => {
  const o = (v ?? {}) as Record<string, string>
  return o.en || o.ru || o.uz || ''
}
const n = (v: unknown): number => (typeof v === 'number' ? v : 0)
const byOrder = (a: Record<string, unknown>, b: Record<string, unknown>) => n(a.order) - n(b.order)

export const ROMAN = (value: unknown): string => {
  const map: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let rest = Math.max(0, Math.floor(n(value)))
  let out = ''
  for (const [v, g] of map) while (rest >= v) ((out += g), (rest -= v))
  return out
}

export const QUESTION_TYPES: Option[] = [
  { value: 'short', label: 'Короткий текст' },
  { value: 'long', label: 'Длинный текст' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Телефон' },
  { value: 'number', label: 'Число' },
  { value: 'date', label: 'Дата' },
  { value: 'single', label: 'Один вариант' },
  { value: 'multiple', label: 'Несколько вариантов' },
  { value: 'dropdown', label: 'Выпадающий список' },
  { value: 'committees', label: 'Комитеты по приоритету (1, 2, 3)' },
  { value: 'link', label: 'Ссылка' },
]

export const SECTIONS: SectionSpec[] = [
  {
    key: 'seasons',
    collection: COL.seasons,
    title: 'Сезоны',
    one: 'сезон',
    rowTitle: (d) => `Сезон ${ROMAN(d.number)}`,
    rowMeta: (d) => [d.date || 'дата не объявлена', en(d.venue)].filter(Boolean).join(' · '),
    sort: (a, b) => n(a.number) - n(b.number),
    blank: () => ({ number: 4, status: 'upcoming', date: null, venue: L(), participants: null, committees: [], cover: null, coverAlt: L() }),
    fields: [
      { key: 'number', label: 'Номер сезона', type: 'number', hint: 'На сайте показывается римской цифрой.' },
      {
        key: 'status',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 'past', label: 'Прошёл' },
          { value: 'upcoming', label: 'Будет' },
        ],
      },
      { key: 'date', label: 'Дата', type: 'date', hint: 'Пусто: на сайте «Date to be announced». Когда дата есть, появляется обратный отсчёт.' },
      { key: 'venue', label: 'Место проведения', type: 'ltext' },
      { key: 'participants', label: 'Участников', type: 'number' },
      { key: 'cover', label: 'Обложка сезона', type: 'photo' },
      { key: 'coverAlt', label: 'Описание обложки (для незрячих)', type: 'ltext' },
      {
        key: 'committees',
        label: 'Комитеты сезона',
        type: 'list',
        itemLabel: 'комитет',
        fields: [
          { key: 'committeeId', label: 'Комитет', type: 'ref', from: 'committees' },
          { key: 'agenda', label: 'Повестка', type: 'llong' },
          { key: 'chairIds', label: 'Председатели', type: 'refs', from: 'team', hint: 'Сначала добавьте людей в разделе «Команда».' },
        ],
      },
    ],
  },
  {
    key: 'committees',
    collection: COL.committees,
    title: 'Комитеты',
    one: 'комитет',
    rowTitle: (d) => String(d.abbr || 'Без названия'),
    rowMeta: (d) => en(d.name),
    sort: byOrder,
    blank: () => ({ abbr: '', name: L(), blurb: L(), photo: null, order: 10 }),
    fields: [
      { key: 'abbr', label: 'Сокращение', type: 'text', hint: 'Например: UNODC' },
      { key: 'name', label: 'Полное название', type: 'ltext' },
      { key: 'blurb', label: 'Одна строка о комитете', type: 'llong' },
      { key: 'photo', label: 'Фото', type: 'photo' },
      { key: 'order', label: 'Порядок', type: 'number', hint: 'Меньше число, выше в списке.' },
    ],
  },
  {
    key: 'team',
    collection: COL.team,
    title: 'Команда',
    one: 'человека',
    rowTitle: (d) => en(d.name) || en(d.role) || 'Без имени',
    rowMeta: (d) => [en(d.name) ? en(d.role) : '', GROUP_LABEL[String(d.group)] ?? ''].filter(Boolean).join(' · '),
    sort: byOrder,
    blank: () => ({ name: L(), role: L(), bio: L(), group: 'chair', seasonId: null, photo: null, order: 10 }),
    fields: [
      { key: 'name', label: 'Имя', type: 'ltext', hint: 'Имя можно написать по-разному на трёх языках.' },
      { key: 'role', label: 'Роль', type: 'ltext' },
      { key: 'bio', label: 'Коротко о человеке', type: 'llong', optional: true },
      {
        key: 'group',
        label: 'Группа',
        type: 'select',
        options: [
          { value: 'lead', label: 'Организатор (верх страницы)' },
          { value: 'chair', label: 'Председатель' },
          { value: 'secretariat', label: 'Секретариат' },
          { value: 'volunteer', label: 'Волонтёр' },
        ],
      },
      { key: 'seasonId', label: 'Сезон', type: 'ref', from: 'seasons', optional: true, hint: 'Для организаторов оставьте пустым.' },
      { key: 'photo', label: 'Фото', type: 'photo' },
      { key: 'order', label: 'Порядок', type: 'number' },
    ],
  },
  {
    key: 'awards',
    collection: COL.awards,
    title: 'Награды',
    one: 'награду',
    rowTitle: (d) => String(d.recipient || 'Без имени'),
    rowMeta: (d) => AWARD_LABEL[String(d.type)] ?? '',
    sort: byOrder,
    blank: () => ({ seasonId: '', committeeId: '', type: 'best', recipient: '', order: 10 }),
    fields: [
      { key: 'seasonId', label: 'Сезон', type: 'ref', from: 'seasons' },
      { key: 'committeeId', label: 'Комитет', type: 'ref', from: 'committees' },
      {
        key: 'type',
        label: 'Награда',
        type: 'select',
        options: [
          { value: 'best', label: 'Best Delegate' },
          { value: 'outstanding', label: 'Outstanding Delegate' },
          { value: 'honorable', label: 'Honourable Mention' },
        ],
      },
      { key: 'recipient', label: 'Кто получил', type: 'text', hint: 'Имя видно всем на сайте. Убедитесь, что человек не против.' },
      { key: 'order', label: 'Порядок', type: 'number' },
    ],
  },
  {
    key: 'gallery',
    collection: COL.gallery,
    title: 'Галерея',
    one: 'фото или клип',
    rowTitle: (d) => en(d.alt) || 'Без описания',
    rowMeta: (d) => (d.kind === 'video' ? 'клип' : 'фото'),
    sort: byOrder,
    blank: () => ({ seasonId: '', kind: 'photo', photo: null, video: '', alt: L(), order: 10 }),
    fields: [
      { key: 'seasonId', label: 'Сезон', type: 'ref', from: 'seasons' },
      {
        key: 'kind',
        label: 'Тип',
        type: 'select',
        options: [
          { value: 'photo', label: 'Фото' },
          { value: 'video', label: 'Клип' },
        ],
      },
      { key: 'photo', label: 'Фото (для клипа это кадр-обложка)', type: 'photo' },
      {
        key: 'video',
        label: 'Клип MP4',
        type: 'clip',
        when: { key: 'kind', in: ['video'] },
        hint: 'Только MP4 (H.264), до 40 МБ, без звука. Файлы .MOV с iPhone сначала нужно сконвертировать.',
      },
      { key: 'alt', label: 'Описание (для незрячих и под фото)', type: 'ltext' },
      { key: 'order', label: 'Порядок', type: 'number' },
    ],
  },
  {
    key: 'faq',
    collection: COL.faq,
    title: 'FAQ',
    one: 'вопрос',
    rowTitle: (d) => en(d.question) || 'Без вопроса',
    sort: byOrder,
    blank: () => ({ question: L(), answer: L(), order: 10 }),
    fields: [
      { key: 'question', label: 'Вопрос', type: 'ltext' },
      { key: 'answer', label: 'Ответ', type: 'llong' },
      { key: 'order', label: 'Порядок', type: 'number' },
    ],
  },
  {
    key: 'roles',
    collection: COL.roles,
    title: 'Роли и форма заявки',
    one: 'роль',
    rowTitle: (d) => en(d.name) || 'Без названия',
    rowMeta: (d) => `${Array.isArray(d.questions) ? d.questions.length : 0} вопросов${d.active === false ? ' · скрыта' : ''}`,
    sort: byOrder,
    blank: () => ({ name: L(), description: L(), active: true, order: 10, questions: [] }),
    fields: [
      { key: 'name', label: 'Название роли', type: 'ltext' },
      { key: 'description', label: 'Описание роли', type: 'llong' },
      { key: 'active', label: 'Показывать на сайте и принимать заявки', type: 'bool' },
      { key: 'order', label: 'Порядок', type: 'number' },
      {
        key: 'questions',
        label: 'Вопросы формы (в этом порядке)',
        type: 'list',
        itemLabel: 'вопрос',
        fields: [
          { key: 'type', label: 'Тип ответа', type: 'select', options: QUESTION_TYPES },
          { key: 'label', label: 'Текст вопроса', type: 'ltext' },
          { key: 'required', label: 'Обязательный', type: 'bool' },
          {
            key: 'options',
            label: 'Варианты ответа',
            type: 'llist',
            itemLabel: 'вариант',
            when: { key: 'type', in: ['single', 'multiple', 'dropdown'] },
          },
        ],
      },
    ],
  },
]

const GROUP_LABEL: Record<string, string> = {
  lead: 'организатор',
  chair: 'председатель',
  secretariat: 'секретариат',
  volunteer: 'волонтёр',
}
const AWARD_LABEL: Record<string, string> = {
  best: 'Best Delegate',
  outstanding: 'Outstanding Delegate',
  honorable: 'Honourable Mention',
}

export const SETTINGS_FIELDS: FieldSpec[] = [
  {
    key: 'registrationStatus',
    label: 'Статус регистрации',
    type: 'select',
    hint: 'Форма на сайте принимает заявки только в статусе «Открыта». Это проверяют и правила базы.',
    options: [
      { value: 'soon', label: 'Скоро (Coming soon)' },
      { value: 'open', label: 'Открыта (Open)' },
      { value: 'closed', label: 'Закрыта (Closed)' },
    ],
  },
  { key: 'upcomingSeason', label: 'Номер сезона, на который идёт регистрация', type: 'number', hint: 'Дата и место берутся из этого сезона в разделе «Сезоны».' },
  { key: 'capacity', label: 'Вместимость (мест)', type: 'number', hint: 'Пусто: на сайте не показывается.' },
  { key: 'fee', label: 'Взнос', type: 'ltext', hint: 'Например: 50 000 UZS. Пусто: на сайте не показывается.' },
  {
    key: 'mapEmbed',
    label: 'Карта места: код для вставки',
    type: 'text',
    hint: 'Google Maps → Поделиться → Встраивание карт → скопируйте код и вставьте сюда целиком. Подойдёт и ссылка из него. Другие сайты в это поле не принимаются.',
  },
  { key: 'mapLat', label: 'Карта: широта (запасной вариант)', type: 'number', optional: true, hint: 'Нужна, только если код для вставки пуст. Тогда показывается карта OpenStreetMap.' },
  { key: 'mapLng', label: 'Карта: долгота (запасной вариант)', type: 'number', optional: true },
  { key: 'telegramUrl', label: 'Telegram: ссылка', type: 'text' },
  { key: 'telegramHandle', label: 'Telegram: имя канала', type: 'text' },
  { key: 'instagramUrl', label: 'Instagram: ссылка', type: 'text' },
  { key: 'instagramHandle', label: 'Instagram: имя профиля', type: 'text' },
]

/** Is this value still empty, in the sense the admin should notice? */
export function isEmpty(spec: FieldSpec, value: unknown): boolean {
  switch (spec.type) {
    case 'ltext':
    case 'llong': {
      const o = (value ?? {}) as Record<string, string>
      return !o.en?.trim() || !o.uz?.trim() || !o.ru?.trim()
    }
    case 'text':
    case 'date':
    case 'ref':
    case 'clip':
      return !value
    case 'number':
      return value === null || value === undefined || value === ''
    case 'photo':
      return !value
    case 'refs':
    case 'list':
    case 'llist':
      return !Array.isArray(value) || value.length === 0
    default:
      return false
  }
}

export function visible(spec: FieldSpec, doc: Record<string, unknown>): boolean {
  return !spec.when || spec.when.in.includes(String(doc[spec.when.key] ?? ''))
}

/** How many fields of this document are still empty (nested lists included). */
export function countEmpty(fields: FieldSpec[], doc: Record<string, unknown>): number {
  let total = 0
  for (const f of fields) {
    if (f.optional || !visible(f, doc)) continue
    const value = doc[f.key]
    if (f.type === 'list' && Array.isArray(value) && value.length) {
      for (const item of value) total += countEmpty(f.fields ?? [], item as Record<string, unknown>)
      continue
    }
    if (isEmpty(f, value)) total++
  }
  return total
}
