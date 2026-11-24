/* Reads the whole public content from Firestore and repairs missing fields,
   so a half-filled document can never crash a page. */
import { collection, doc, getDoc, getDocs } from 'firebase/firestore/lite'
import type { L } from '../i18n'
import { COL, SETTINGS_DOC, db } from '../lib/firebase'
import { seed } from './seed'
import type {
  Award,
  Committee,
  Content,
  FaqItem,
  GalleryItem,
  Photo,
  Question,
  RegistrationRole,
  Season,
  SiteSettings,
  TeamMember,
} from './types'

type Raw = Record<string, unknown>

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const numOrNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const obj = (v: unknown): Raw => (v && typeof v === 'object' ? (v as Raw) : {})

export const asL = (v: unknown): L => {
  const o = obj(v)
  return { en: str(o.en), uz: str(o.uz), ru: str(o.ru) }
}

export const asPhoto = (v: unknown): Photo | null => {
  const o = obj(v)
  if (!str(o.src)) return null
  const photo: Photo = { src: str(o.src), width: num(o.width, 4), height: num(o.height, 3) }
  if (str(o.thumb)) photo.thumb = str(o.thumb)
  if (str(o.path)) photo.path = str(o.path)
  if (str(o.thumbPath)) photo.thumbPath = str(o.thumbPath)
  return photo
}

const asSettings = (o: Raw): SiteSettings => ({
  registrationStatus: o.registrationStatus === 'open' || o.registrationStatus === 'closed' ? o.registrationStatus : 'soon',
  upcomingSeason: num(o.upcomingSeason, seed.settings.upcomingSeason),
  capacity: numOrNull(o.capacity),
  fee: asL(o.fee),
  mapLat: numOrNull(o.mapLat),
  mapLng: numOrNull(o.mapLng),
  mapEmbed: str(o.mapEmbed),
  telegramUrl: str(o.telegramUrl, seed.settings.telegramUrl),
  telegramHandle: str(o.telegramHandle, seed.settings.telegramHandle),
  instagramUrl: str(o.instagramUrl, seed.settings.instagramUrl),
  instagramHandle: str(o.instagramHandle, seed.settings.instagramHandle),
})

const asSeason = (id: string, o: Raw): Season => ({
  id,
  number: num(o.number, 1),
  status: o.status === 'upcoming' ? 'upcoming' : 'past',
  date: str(o.date) || null,
  venue: asL(o.venue),
  participants: numOrNull(o.participants),
  committees: arr(o.committees)
    .map(obj)
    .filter((c) => str(c.committeeId))
    .map((c) => ({
      committeeId: str(c.committeeId),
      agenda: asL(c.agenda),
      chairIds: arr(c.chairIds).filter((x): x is string => typeof x === 'string'),
      language: c.language === 'en' || c.language === 'uz' || c.language === 'ru' ? c.language : '',
      double: c.double === true,
      about: str(c.about),
    })),
  cover: asPhoto(o.cover),
  coverAlt: asL(o.coverAlt),
})

const asCommittee = (id: string, o: Raw): Committee => ({
  id,
  abbr: str(o.abbr),
  name: asL(o.name),
  blurb: asL(o.blurb),
  photo: asPhoto(o.photo),
  order: num(o.order),
})

const asMember = (id: string, o: Raw): TeamMember => ({
  id,
  name: asL(o.name),
  role: asL(o.role),
  bio: asL(o.bio),
  group: o.group === 'chair' || o.group === 'secretariat' || o.group === 'volunteer' ? o.group : 'lead',
  seasonId: str(o.seasonId) || null,
  photo: asPhoto(o.photo),
  order: num(o.order),
})

const asAward = (id: string, o: Raw): Award => ({
  id,
  seasonId: str(o.seasonId),
  committeeId: str(o.committeeId),
  type: o.type === 'outstanding' || o.type === 'honorable' ? o.type : 'best',
  recipient: str(o.recipient),
  order: num(o.order),
})

const asGalleryItem = (id: string, o: Raw): GalleryItem | null => {
  const photo = asPhoto(o.photo)
  if (!photo) return null
  const item: GalleryItem = {
    id,
    seasonId: str(o.seasonId),
    kind: o.kind === 'video' ? 'video' : 'photo',
    photo,
    alt: asL(o.alt),
    order: num(o.order),
  }
  if (str(o.video)) item.video = str(o.video)
  return item
}

const asFaq = (id: string, o: Raw): FaqItem => ({
  id,
  question: asL(o.question),
  answer: asL(o.answer),
  order: num(o.order),
})

const QUESTION_TYPES = ['short', 'long', 'email', 'phone', 'number', 'date', 'single', 'multiple', 'dropdown', 'committees', 'link']

const asRole = (id: string, o: Raw): RegistrationRole => ({
  id,
  name: asL(o.name),
  description: asL(o.description),
  active: o.active !== false,
  order: num(o.order),
  questions: arr(o.questions)
    .map(obj)
    .map(
      (q, i): Question => ({
        id: str(q.id) || `q${i + 1}`,
        type: (QUESTION_TYPES.includes(str(q.type)) ? str(q.type) : 'short') as Question['type'],
        label: asL(q.label),
        required: q.required === true,
        options: arr(q.options).map(asL),
        order: i,
      }),
    ),
})

async function readAll<T>(name: string, map: (id: string, o: Raw) => T | null): Promise<T[]> {
  const snap = await getDocs(collection(db!, name))
  const out: T[] = []
  snap.forEach((d) => {
    const item = map(d.id, d.data() as Raw)
    if (item) out.push(item)
  })
  return out
}

/** Returns null when Firebase is not configured or the database has not been filled yet.
    The caller then keeps showing the seed data. */
export async function loadContent(): Promise<Content | null> {
  if (!db) return null
  const settingsSnap = await getDoc(doc(db, ...SETTINGS_DOC))
  if (!settingsSnap.exists()) return null
  const [seasons, committees, team, awards, gallery, faq, roles] = await Promise.all([
    readAll(COL.seasons, asSeason),
    readAll(COL.committees, asCommittee),
    readAll(COL.team, asMember),
    readAll(COL.awards, asAward),
    readAll(COL.gallery, asGalleryItem),
    readAll(COL.faq, asFaq),
    readAll(COL.roles, asRole),
  ])
  return { settings: asSettings(settingsSnap.data() as Raw), seasons, committees, team, awards, gallery, faq, roles }
}
