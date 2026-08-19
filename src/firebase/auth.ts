import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  reauthenticateWithCredential,
  updatePassword,
  type User,
} from 'firebase/auth'
import { deleteApp, initializeApp } from 'firebase/app'
import { auth, firebaseConfig } from '@/firebase/config'

export async function login(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function register(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const credential = await signInWithPopup(auth, provider)
  return credential.user
}

export async function createManagedUser(
  email: string,
  password: string,
): Promise<User> {
  const secondaryApp = initializeApp(
    firebaseConfig,
    `vaultpos-user-${Date.now()}`,
  )
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password,
    )
    return credential.user
  } finally {
    await signOut(secondaryAuth).catch(() => undefined)
    await deleteApp(secondaryApp)
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = auth.currentUser
  if (!user?.email) throw new Error('Usuário não autenticado.')

  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export async function forgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email)
}

export function getCurrentUser(): User | null {
  return auth.currentUser
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
