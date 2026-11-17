import type { L } from '../i18n'

export type Photo = {
  /** Full web version, about 1920px on the long side. */
  src: string
  /** About 800px thumbnail. */
  thumb?: string
  width: number
  height: number
  /** Storage paths of uploaded files, kept so the admin can delete them. Seed photos have none. */
  path?: string
  thumbPath?: string
}

export type RegistrationStatus = 'soon' | 'open' | 'closed'

export type SiteSettings = {
  registrationStatus: RegistrationStatus
  /** Number of the season people register for. */
  upcomingSeason: number
  capacity: number | null
  fee: L
  /** Map pin for the upcoming venue. Empty until set in the admin. */
  mapLat: number | null
  mapLng: number | null
  /** A Google Maps or OpenStreetMap embed (the link, or the whole pasted iframe code). */
  mapEmbed: string
  telegramUrl: string
  telegramHandle: string
  instagramUrl: string
  instagramHandle: string
}

export type SeasonCommittee = {
  committeeId: string
  agenda: L
  /** Ids of team members who chaired it. */
  chairIds: string[]
}

export type Season = {
  id: string
  number: number
  status: 'past' | 'upcoming'
  /** ISO date, or null while it is "to be announced". */
  date: string | null
  venue: L
  participants: number | null
  committees: SeasonCommittee[]
  cover: Photo | null
  coverAlt: L
}

export type Committee = {
  id: string
  abbr: string
  name: L
  blurb: L
  photo: Photo | null
  order: number
}

export type TeamGroup = 'lead' | 'chair' | 'secretariat' | 'volunteer'

export type TeamMember = {
  id: string
  name: L
  role: L
  bio: L
  group: TeamGroup
  /** Season id for chairs, secretariat and volunteers. Null for the two leads. */
  seasonId: string | null
  photo: Photo | null
  order: number
}

export type AwardType = 'best' | 'outstanding' | 'honorable'

export type Award = {
  id: string
  seasonId: string
  committeeId: string
  type: AwardType
  recipient: string
  order: number
}

export type GalleryItem = {
  id: string
  seasonId: string
  kind: 'photo' | 'video'
  /** Photo for kind "photo". Poster frame for kind "video". */
  photo: Photo
  /** MP4 url for kind "video". */
  video?: string
  alt: L
  order: number
}

export type FaqItem = {
  id: string
  question: L
  answer: L
  order: number
}

export type QuestionType =
  | 'short'
  | 'long'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'single'
  | 'multiple'
  | 'dropdown'
  | 'committees'
  | 'link'

export type Question = {
  id: string
  type: QuestionType
  label: L
  required: boolean
  options: L[]
  order: number
}

export type RegistrationRole = {
  id: string
  name: L
  description: L
  active: boolean
  questions: Question[]
  order: number
}

export type Content = {
  settings: SiteSettings
  seasons: Season[]
  committees: Committee[]
  team: TeamMember[]
  awards: Award[]
  gallery: GalleryItem[]
  faq: FaqItem[]
  roles: RegistrationRole[]
}

export type ApplicationStatus = 'new' | 'accepted' | 'waitlist' | 'rejected'

/** One saved answer inside a registration. */
export type Answer = {
  id: string
  label: string
  type: QuestionType
  value: string
}

/** A registration as stored in Firestore. `answers` is a JSON string so the security rules can cap its size. */
export type Registration = {
  id: string
  roleId: string
  roleName: string
  seasonNumber: number
  lang: string
  answers: string
  consent: boolean
  status: ApplicationStatus
  createdAt: number
}
