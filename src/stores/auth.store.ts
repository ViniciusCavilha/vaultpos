import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'
import {
  forgotPassword as sendPasswordReset,
  getCurrentUser,
  login as firebaseLogin,
  loginWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
  register as firebaseRegister,
} from '@/firebase/auth'

function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Ocorreu um erro inesperado.'

  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/invalid-credential': 'E-mail ou senha inválidos.',
    'auth/invalid-email': 'Informe um e-mail válido.',
    'auth/popup-closed-by-user': 'A janela de login foi fechada.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  }
  const code = 'code' in error ? String(error.code) : ''
  return messages[code] ?? error.message
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  const error = ref<string | null>(null)
  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => Boolean(user.value))
  const userId = computed(() => user.value?.uid ?? null)
  const userEmail = computed(() => user.value?.email ?? null)

  function init(): Promise<void> {
    if (initPromise) return initPromise

    initPromise = new Promise((resolve) => {
      onAuthChange((currentUser) => {
        user.value = currentUser
        initialized.value = true
        resolve()
      })
    })
    user.value = getCurrentUser()
    return initPromise
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      user.value = await firebaseLogin(email, password)
    } catch (caught) {
      error.value = errorMessage(caught)
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function loginGoogle() {
    loading.value = true
    error.value = null
    try {
      user.value = await loginWithGoogle()
    } catch (caught) {
      error.value = errorMessage(caught)
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      user.value = await firebaseRegister(email, password)
      return user.value
    } catch (caught) {
      error.value = errorMessage(caught)
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null
    try {
      await firebaseLogout()
      user.value = null
    } catch (caught) {
      error.value = errorMessage(caught)
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email: string) {
    loading.value = true
    error.value = null
    try {
      await sendPasswordReset(email)
    } catch (caught) {
      error.value = errorMessage(caught)
      throw new Error(error.value)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    initialized,
    error,
    isAuthenticated,
    userId,
    userEmail,
    init,
    login,
    loginGoogle,
    register,
    logout,
    forgotPassword,
  }
})
