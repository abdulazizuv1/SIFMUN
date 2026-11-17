/* Firebase bootstrap, shared by the public site and the admin.
   The public site only needs to read content and send a registration, so it uses
   Firestore Lite (no realtime layer, a fraction of the size). Auth and Storage are
   loaded only inside the admin chunk (see src/admin/api.ts).

   The values come from .env.local (VITE_FIREBASE_*). Without them the site still
   works: it simply shows the seed data. */
import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite'
import type { Firestore } from 'firebase/firestore/lite'

import { firebaseConfig, firebaseReady, useEmulators } from './env'

export { firebaseReady, useEmulators }

export const app: FirebaseApp | null = firebaseReady ? initializeApp(firebaseConfig) : null
export const db: Firestore | null = app ? getFirestore(app) : null

if (db && useEmulators) connectFirestoreEmulator(db, '127.0.0.1', 8080)

/** Firestore collection names, in one place. */
export const COL = {
  seasons: 'seasons',
  committees: 'committees',
  team: 'team',
  awards: 'awards',
  gallery: 'gallery',
  faq: 'faq',
  roles: 'registrationRoles',
  registrations: 'registrations',
} as const

export const SETTINGS_DOC = ['settings', 'site'] as const
