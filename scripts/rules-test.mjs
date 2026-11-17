/* Checks the security rules against the LOCAL Firebase emulators. It never touches the real project.

   How to run (from the `site` folder):
     1. Put a test UID in copies of firestore.rules and storage.rules and start the emulators with them
        (auth 9099, firestore 8080, storage 9199, project demo-sifmun).
     2. ADMIN_EMAIL=... OUTSIDER_EMAIL=... TEST_PASSWORD=... node scripts/rules-test.mjs

   Every line prints PASS or FAIL. The exit code is 1 if anything failed. */
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore/lite'
import { connectStorageEmulator, getBytes, getStorage, ref, uploadBytes } from 'firebase/storage'

const { ADMIN_EMAIL, OUTSIDER_EMAIL, TEST_PASSWORD } = process.env
if (!ADMIN_EMAIL || !OUTSIDER_EMAIL || !TEST_PASSWORD) {
  console.error('Set ADMIN_EMAIL, OUTSIDER_EMAIL and TEST_PASSWORD.')
  process.exit(2)
}

const app = initializeApp({ apiKey: 'fake-key', projectId: 'demo-sifmun', storageBucket: 'demo-sifmun.appspot.com' })
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
connectStorageEmulator(storage, '127.0.0.1', 9199)

let failed = 0
async function expect(name, shouldPass, job) {
  let passed
  let detail = ''
  try {
    await job()
    passed = true
  } catch (e) {
    passed = false
    detail = e?.code ?? String(e)
  }
  const ok = passed === shouldPass
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${shouldPass ? 'allowed' : 'denied '}  ${name}${ok ? '' : `   (got ${passed ? 'allowed' : detail})`}`)
}

const asAdmin = () => signInWithEmailAndPassword(auth, ADMIN_EMAIL, TEST_PASSWORD)
const asOutsider = () => signInWithEmailAndPassword(auth, OUTSIDER_EMAIL, TEST_PASSWORD)
const asVisitor = () => signOut(auth)

const registration = (over = {}) => ({
  roleId: 'delegate',
  roleName: 'Delegate',
  seasonNumber: 3,
  lang: 'en',
  answers: JSON.stringify([{ id: 'q1', label: 'Full name', type: 'short', value: 'Test Delegate' }]),
  consent: true,
  status: 'new',
  createdAt: serverTimestamp(),
  ...over,
})
const sendRegistration = (over) => addDoc(collection(db, 'registrations'), registration(over))
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13])

// ---------- a visitor, before anything exists ----------
await asVisitor()
await expect('visitor reads seasons', true, () => getDocs(collection(db, 'seasons')))
await expect('visitor reads settings', true, () => getDoc(doc(db, 'settings', 'site')))
await expect('visitor writes a season', false, () => setDoc(doc(db, 'seasons', 'hack'), { number: 9 }))
await expect('visitor writes settings', false, () => setDoc(doc(db, 'settings', 'site'), { registrationStatus: 'open' }))
await expect('visitor reads registrations', false, () => getDocs(collection(db, 'registrations')))
await expect('visitor registers before settings exist', false, () => sendRegistration())
await expect('visitor reads the admin check document', false, () => getDoc(doc(db, '_admin', 'ping')))
await expect('visitor reads an unknown collection', false, () => getDocs(collection(db, 'secrets')))

// ---------- the admin ----------
await asAdmin()
await expect('admin passes the admin check', true, () => getDoc(doc(db, '_admin', 'ping')))
await expect('admin writes settings (status: soon)', true, () => setDoc(doc(db, 'settings', 'site'), { registrationStatus: 'soon' }))
await expect('admin writes a season', true, () => setDoc(doc(db, 'seasons', 'season-test'), { number: 1 }))
await expect('admin writes a registration role', true, () => setDoc(doc(db, 'registrationRoles', 'delegate'), { active: true }))
await expect('admin uploads an image', true, () => uploadBytes(ref(storage, 'media/test/a.png'), png, { contentType: 'image/png' }))
await expect('admin uploads a text file', false, () => uploadBytes(ref(storage, 'media/test/a.txt'), png, { contentType: 'text/plain' }))
await expect('admin uploads outside /media', false, () => uploadBytes(ref(storage, 'other/a.png'), png, { contentType: 'image/png' }))

// ---------- registration closed ----------
await asVisitor()
await expect('visitor registers while status is soon', false, () => sendRegistration())
await expect('visitor views an uploaded image', true, () => getBytes(ref(storage, 'media/test/a.png')))
await expect('visitor uploads an image', false, () => uploadBytes(ref(storage, 'media/test/b.png'), png, { contentType: 'image/png' }))

// ---------- registration open ----------
await asAdmin()
await setDoc(doc(db, 'settings', 'site'), { registrationStatus: 'open' })
await asVisitor()
let created
await expect('visitor sends a valid registration', true, async () => {
  created = await sendRegistration()
})
await expect('registration with an extra field', false, () => sendRegistration({ isAdmin: true }))
await expect('registration with status accepted', false, () => sendRegistration({ status: 'accepted' }))
await expect('registration without consent', false, () => sendRegistration({ consent: false }))
await expect('registration with answers over 20000 characters', false, () => sendRegistration({ answers: 'x'.repeat(20001) }))
await expect('registration with a made-up date', false, () => sendRegistration({ createdAt: new Date('2020-01-01') }))
await expect('registration with a wrong language', false, () => sendRegistration({ lang: 'xx' }))
await expect('registration with a role id over 64 characters', false, () => sendRegistration({ roleId: 'r'.repeat(65) }))
await expect('visitor reads back a registration', false, () => getDoc(doc(db, 'registrations', created.id)))
await expect('visitor edits a registration', false, () => updateDoc(doc(db, 'registrations', created.id), { status: 'accepted' }))
await expect('visitor deletes a registration', false, () => deleteDoc(doc(db, 'registrations', created.id)))

// ---------- a signed-in account that is not on the allowlist ----------
await asOutsider()
await expect('outsider passes the admin check', false, () => getDoc(doc(db, '_admin', 'ping')))
await expect('outsider writes a season', false, () => setDoc(doc(db, 'seasons', 'hack'), { number: 9 }))
await expect('outsider reads registrations', false, () => getDocs(collection(db, 'registrations')))
await expect('outsider uploads an image', false, () => uploadBytes(ref(storage, 'media/test/c.png'), png, { contentType: 'image/png' }))

// ---------- the admin handles registrations ----------
await asAdmin()
await expect('admin reads registrations', true, () => getDocs(collection(db, 'registrations')))
await expect('admin changes a registration status', true, () => updateDoc(doc(db, 'registrations', created.id), { status: 'accepted' }))
await expect('admin deletes a registration', true, () => deleteDoc(doc(db, 'registrations', created.id)))
await setDoc(doc(db, 'settings', 'site'), { registrationStatus: 'closed' })
await asVisitor()
await expect('visitor registers after registration closed', false, () => sendRegistration())

// leave the emulator clean for the browser test
await asAdmin()
await deleteDoc(doc(db, 'settings', 'site'))
await deleteDoc(doc(db, 'seasons', 'season-test'))
await deleteDoc(doc(db, 'registrationRoles', 'delegate'))
await asVisitor()

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed')
process.exit(failed ? 1 : 0)
