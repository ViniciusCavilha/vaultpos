import { deleteApp, initializeApp } from 'firebase/app'
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, firebaseConfig } from '@/firebase/config'

const authTimeoutMs = 30000

function withAuthTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), authTimeoutMs)
    promise.then(resolve, reject).finally(() => window.clearTimeout(timer))
  })
}

export async function login(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const { user } = await withAuthTimeout(
    signInWithPopup(auth, provider),
    'O login com Google demorou demais. Feche a janela e tente novamente.',
  )
  return user
}

export async function register(
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  const displayName = typeof metadata.full_name === 'string' ? metadata.full_name : null
  if (displayName) await updateProfile(user, { displayName })
  return user
}

export async function createSecondaryUser(
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
) {
  const secondaryApp = initializeApp(firebaseConfig, `vaultpos-secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const { user } = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const displayName = typeof metadata.full_name === 'string' ? metadata.full_name : null
    if (displayName) await updateProfile(user, { displayName })
    return user
  } finally {
    await signOut(secondaryAuth).catch(() => undefined)
    await deleteApp(secondaryApp)
  }
}

export async function logout() {
  await signOut(auth)
}

export async function reauthenticateWithGoogle() {
  if (!auth.currentUser) throw new Error('Usuário não autenticado.')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  await withAuthTimeout(
    reauthenticateWithPopup(auth.currentUser, provider),
    'A confirmação com Google demorou demais. Tente novamente.',
  )
}

export async function deleteCurrentUser() {
  if (!auth.currentUser) throw new Error('Usuário não autenticado.')
  await deleteUser(auth.currentUser)
}

export async function forgotPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export function getCurrentUser(): User | null {
  return auth.currentUser
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function reauthenticateCurrentUser(email: string, password: string) {
  if (!auth.currentUser) throw new Error('Usuário não autenticado.')
  const credential = EmailAuthProvider.credential(email, password)
  await reauthenticateWithCredential(auth.currentUser, credential)
}

export async function updateCurrentPassword(password: string) {
  if (!auth.currentUser) throw new Error('Usuário não autenticado.')
  await updatePassword(auth.currentUser, password)
}
