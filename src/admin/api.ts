/* Everything the admin needs from Firebase: sign-in, reading and writing documents,
   and photo uploads. This file is only ever loaded inside the admin chunk. */
import {
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore/lite'
import type { Timestamp } from 'firebase/firestore/lite'
import {
  connectStorageEmulator,
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { SEASON3_COMMITTEES, SEASON3_DATE, SEASON3_FAQ, SEASON3_FEE, SEASON3_NEW_COMMITTEES, SEASON3_QUESTIONS, SEASON3_VENUE } from '../data/season3'
import { seed } from '../data/seed'
import type { ApplicationStatus, Photo, Registration } from '../data/types'
import { COL, SETTINGS_DOC, app, db, useEmulators } from '../lib/firebase'

export type AdminDoc = { id: string } & Record<string, unknown>

const auth = app ? getAuth(app) : null
const storage = app ? getStorage(app) : null

if (useEmulators) {
  if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  if (storage) connectStorageEmulator(storage, '127.0.0.1', 9199)
}

// ---------- sign-in ----------

export function watchUser(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, cb)
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!auth) throw new Error('not-configured')
  await signInWithEmailAndPassword(auth, email, password)
}

export async function signOut(): Promise<void> {
  if (auth) await fbSignOut(auth)
}

/** True only when the security rules list this account as an admin. */
export async function checkAdmin(): Promise<boolean> {
  if (!db) return false
  try {
    await getDoc(doc(db, '_admin', 'ping'))
    return true
  } catch {
    return false
  }
}

// ---------- documents ----------

export async function listDocs(name: string): Promise<AdminDoc[]> {
  const snap = await getDocs(collection(db!, name))
  const out: AdminDoc[] = []
  snap.forEach((d) => out.push({ ...(d.data() as Record<string, unknown>), id: d.id }))
  return out
}

/** Creates the document when id is null, replaces it otherwise. Returns the id. */
export async function saveDoc(name: string, id: string | null, data: Record<string, unknown>): Promise<string> {
  const clean = stripUndefined(data)
  delete clean.id
  if (id) {
    await setDoc(doc(db!, name, id), clean)
    return id
  }
  const created = await addDoc(collection(db!, name), clean)
  return created.id
}

export async function removeDoc(name: string, id: string): Promise<void> {
  await deleteDoc(doc(db!, name, id))
}

export async function readSettings(): Promise<Record<string, unknown> | null> {
  const snap = await getDoc(doc(db!, ...SETTINGS_DOC))
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null
}

export async function saveSettings(data: Record<string, unknown>): Promise<void> {
  await setDoc(doc(db!, ...SETTINGS_DOC), stripUndefined(data))
}

function stripUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

/** One-time import: writes every confirmed fact from the seed file into the database.
    Refuses to run when the database already has settings, so it can never overwrite real edits. */
export async function importSeed(): Promise<number> {
  if (await readSettings()) throw new Error('already-imported')
  const batch = writeBatch(db!)
  let count = 1
  batch.set(doc(db!, ...SETTINGS_DOC), stripUndefined(seed.settings))
  const groups: [string, { id: string }[]][] = [
    [COL.seasons, seed.seasons],
    [COL.committees, seed.committees],
    [COL.team, seed.team],
    [COL.awards, seed.awards],
    [COL.gallery, seed.gallery],
    [COL.faq, seed.faq],
    [COL.roles, seed.roles],
  ]
  for (const [name, items] of groups) {
    for (const item of items) {
      const data = stripUndefined(item as unknown as Record<string, unknown>)
      delete data.id
      batch.set(doc(db!, name, item.id), data)
      count++
    }
  }
  await batch.commit()
  return count
}

// ---------- one-time content updates ----------

/* A database that was filled before new facts arrived does not get them from the seed.
   Each update below writes those facts once, from a button in the admin, and is
   recorded in _admin/updates so the button disappears afterwards. */
const UPDATES_DOC = ['_admin', 'updates'] as const
export const SEASON3_UPDATE = 'season3Registration'

export async function appliedUpdates(): Promise<Record<string, unknown>> {
  const snap = await getDoc(doc(db!, ...UPDATES_DOC))
  return snap.exists() ? snap.data() : {}
}

/** Season III: date, fee, six committees with their languages, the delegate form, FAQ answers, venue photos, and registration Open. */
export async function applySeason3Update(): Promise<void> {
  const batch = writeBatch(db!)
  for (const c of SEASON3_NEW_COMMITTEES) {
    const data = stripUndefined(c as unknown as Record<string, unknown>)
    delete data.id
    batch.set(doc(db!, COL.committees, c.id), data, { merge: true })
  }
  batch.set(doc(db!, COL.seasons, 'season-3'), { date: SEASON3_DATE, committees: SEASON3_COMMITTEES }, { merge: true })
  batch.set(doc(db!, COL.roles, 'delegate'), { questions: SEASON3_QUESTIONS, active: true }, { merge: true })
  for (const f of SEASON3_FAQ) batch.set(doc(db!, COL.faq, f.id), { answer: f.answer }, { merge: true })
  for (const g of SEASON3_VENUE) {
    const data = stripUndefined(g as unknown as Record<string, unknown>)
    delete data.id
    batch.set(doc(db!, COL.gallery, g.id), data, { merge: true })
  }
  batch.set(doc(db!, ...SETTINGS_DOC), { fee: SEASON3_FEE, registrationStatus: 'open', upcomingSeason: 3 }, { merge: true })
  batch.set(doc(db!, ...UPDATES_DOC), { [SEASON3_UPDATE]: serverTimestamp() }, { merge: true })
  await batch.commit()
}

// ---------- registrations ----------

export async function listRegistrations(): Promise<Registration[]> {
  const rows = await listDocs(COL.registrations)
  return rows
    .map((r): Registration => {
      const ts = r.createdAt as Timestamp | undefined
      return {
        id: r.id,
        roleId: String(r.roleId ?? ''),
        roleName: String(r.roleName ?? ''),
        seasonNumber: Number(r.seasonNumber ?? 0),
        lang: String(r.lang ?? ''),
        answers: String(r.answers ?? '[]'),
        consent: r.consent === true,
        status: (['new', 'accepted', 'waitlist', 'rejected'].includes(String(r.status)) ? r.status : 'new') as ApplicationStatus,
        createdAt: ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0,
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function setRegistrationStatus(id: string, status: ApplicationStatus): Promise<void> {
  await updateDoc(doc(db!, COL.registrations, id), { status })
}

export { serverTimestamp }

// ---------- photos ----------

const MAX_SIDE = 1920
const THUMB_SIDE = 800

async function resize(bitmap: ImageBitmap, maxSide: number): Promise<{ blob: Blob; width: number; height: number; ext: string }> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)
  const toBlob = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  // WebP where the browser can encode it, JPEG otherwise (older Safari).
  let blob = await toBlob('image/webp', 0.84)
  let ext = 'webp'
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob('image/jpeg', 0.86)
    ext = 'jpg'
  }
  if (!blob) throw new Error('encode')
  return { blob, width, height, ext }
}

/** Shrinks the picture in the browser (about 1920px, plus an 800px thumbnail) and uploads both. */
export async function uploadPhoto(file: File, folder: string): Promise<Photo> {
  if (!storage) throw new Error('not-configured')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const full = await resize(bitmap, MAX_SIDE)
  const thumb = await resize(bitmap, THUMB_SIDE)
  bitmap.close()
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const path = `media/${folder}/${stamp}.${full.ext}`
  const thumbPath = `media/${folder}/${stamp}-thumb.${thumb.ext}`
  const cache = { cacheControl: 'public, max-age=31536000, immutable' }
  const [a, b] = await Promise.all([
    uploadBytes(ref(storage, path), full.blob, { contentType: full.blob.type, ...cache }),
    uploadBytes(ref(storage, thumbPath), thumb.blob, { contentType: thumb.blob.type, ...cache }),
  ])
  const [src, thumbUrl] = await Promise.all([getDownloadURL(a.ref), getDownloadURL(b.ref)])
  return { src, thumb: thumbUrl, width: full.width, height: full.height, path, thumbPath }
}

/** Uploads a short MP4 clip as it is (no conversion in the browser). */
export async function uploadClip(file: File, folder: string): Promise<{ url: string; path: string }> {
  if (!storage) throw new Error('not-configured')
  const path = `media/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`
  const done = await uploadBytes(ref(storage, path), file, {
    contentType: 'video/mp4',
    cacheControl: 'public, max-age=31536000, immutable',
  })
  return { url: await getDownloadURL(done.ref), path }
}

/** Best effort: a file that is already gone is not an error. */
export async function deleteFiles(paths: (string | undefined)[]): Promise<void> {
  if (!storage) return
  await Promise.all(
    paths
      .filter((p): p is string => Boolean(p))
      .map((p) => deleteObject(ref(storage, p)).catch(() => undefined)),
  )
}
