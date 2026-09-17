import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { GoogleAuthProvider, reauthenticateWithPopup, type User } from 'firebase/auth'
import type { CargoUsuario } from '@/types/database.types'
import {
  forgotPassword as firebaseForgotPassword,
  deleteCurrentUser,
  login as firebaseLogin,
  loginWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
  register as firebaseRegister,
} from '@/firebase/auth'
import { createEmpresa } from '@/firebase/collections/empresas'
import { createUsuario, deleteUsuarioPermanent, getUsuarioById, getUsuarioMembership } from '@/firebase/collections/usuarios'

export type VaultAuthUser = User & {
  id?: string
  user_metadata?: {
    full_name?: string | null
    phone?: string | null
    role?: string
  }
}

const pendingDeletionKey = 'vaultpos_pending_account_deletion'
const recentLoginWindowMs = 4 * 60 * 1000

type PendingAccountDeletion = {
  uid: string
  empresaId: string | null
}

function compatibleUser(firebaseUser: User | null, role = 'user'): VaultAuthUser | null {
  if (!firebaseUser) return null
  return Object.assign(firebaseUser, {
    id: firebaseUser.uid,
    user_metadata: {
      full_name: firebaseUser.displayName,
      phone: firebaseUser.phoneNumber,
      role,
    },
  }) as VaultAuthUser
}

function storedRole() {
  return typeof window === 'undefined' ? 'user' : localStorage.getItem('vaultpos_user_role') || 'user'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<VaultAuthUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  const deleteRequiresLogin = ref(false)
  const role = ref(storedRole())
  let initPromise: Promise<void> | null = null
  const contextTimeoutMs = 5000
  const initTimeoutMs = 8000

  const session = computed(() => user.value ? { user: user.value } : null)
  const isAuthenticated = computed(() => Boolean(user.value))
  const userId = computed(() => user.value?.uid ?? null)
  const userEmail = computed(() => user.value?.email ?? null)
  const userRole = computed(() => role.value)
  const isAdmin = computed(() => role.value === 'admin' || userEmail.value === 'admin@vaultpos.com')

  function setRole(nextRole: string) {
    role.value = nextRole || 'user'
    if (typeof window !== 'undefined') localStorage.setItem('vaultpos_user_role', role.value)
    if (user.value?.user_metadata) user.value.user_metadata.role = role.value
  }

  function getPendingAccountDeletion(): PendingAccountDeletion | null {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem(pendingDeletionKey)
    if (!raw) return null
    try {
      const pending = JSON.parse(raw) as Partial<PendingAccountDeletion>
      return typeof pending.uid === 'string'
        ? { uid: pending.uid, empresaId: typeof pending.empresaId === 'string' ? pending.empresaId : null }
        : null
    } catch {
      sessionStorage.removeItem(pendingDeletionKey)
      return null
    }
  }

  function hasRecentLogin(firebaseUser: User) {
    const lastSignIn = Date.parse(firebaseUser.metadata.lastSignInTime || '')
    return Number.isFinite(lastSignIn) && Date.now() - lastSignIn <= recentLoginWindowMs
  }

  function savePendingAccountDeletion(uid: string, empresaId: string | null) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(pendingDeletionKey, JSON.stringify({ uid, empresaId }))
  }

  function clearPendingAccountDeletion() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(pendingDeletionKey)
  }

  async function syncUserContext(firebaseUser: User) {
    if (!firebaseUser.email) return false
    try {
      const membership = await getUsuarioMembership(firebaseUser.uid)
      if (!membership) return false
      const profile = await getUsuarioById(membership.empresaId, firebaseUser.uid)
      if (!profile) return false
      setRole(profile.cargo)
      if (typeof window !== 'undefined') localStorage.setItem('vaultpos_empresa_id', profile.empresa_id)
      return true
    } catch {
      setRole(storedRole())
      return false
    }
  }

  function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    return Promise.race([
      promise,
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
    ])
  }

  function applyFallbackContext(firebaseUser: User) {
    if (typeof window !== 'undefined' && !localStorage.getItem('vaultpos_empresa_id')) {
      localStorage.setItem('vaultpos_empresa_id', firebaseUser.uid)
    }
    if (role.value === 'user') setRole('garcom')
  }

  async function provisionUserContext(firebaseUser: User) {
    if (!firebaseUser.email) return
    const empresaId = firebaseUser.uid
    const name = firebaseUser.displayName || firebaseUser.email.split('@')[0]
    await createEmpresa(empresaId, { nome: `Empresa de ${name}`, email: firebaseUser.email })
    await createUsuario(empresaId, {
      id: firebaseUser.uid,
      nome: name,
      email: firebaseUser.email,
      cargo: 'garcom',
      foto: firebaseUser.photoURL,
    })
    if (typeof window !== 'undefined') localStorage.setItem('vaultpos_empresa_id', empresaId)
    setRole('garcom')
  }

  async function prepareUserContext(firebaseUser: User) {
    const syncPromise = syncUserContext(firebaseUser)
    const hasProfile = await withTimeout(syncPromise, contextTimeoutMs)
    if (hasProfile === true) return

    applyFallbackContext(firebaseUser)
    const provision = () => provisionUserContext(firebaseUser).catch((caught) => {
      console.warn('Login concluído, mas o perfil Firebase ainda não foi sincronizado:', caught)
    })

    if (hasProfile === false) {
      void provision()
      return
    }

    void syncPromise.then((profileFound) => {
      if (!profileFound) void provision()
    })
  }

  async function userHasVaultProfile(firebaseUser: User) {
    const syncPromise = syncUserContext(firebaseUser)
    const hasProfile = await withTimeout(syncPromise, contextTimeoutMs)
    if (hasProfile === null) throw new Error('Não foi possível verificar seu cadastro. Tente novamente.')
    return hasProfile
  }

  async function createVaultProfileForUser(firebaseUser: User, metadata: Record<string, unknown> = {}) {
    if (!firebaseUser.email) throw new Error('Sua conta Google não retornou um e-mail válido.')

    const empresaId = firebaseUser.uid
    const fullName = typeof metadata.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : firebaseUser.displayName || firebaseUser.email.split('@')[0]

    await createEmpresa(empresaId, { nome: `Empresa de ${fullName}`, email: firebaseUser.email.trim().toLowerCase() })
    const selectedRole = metadata.role === 'admin' ? 'admin' : 'garcom'
    await createUsuario(empresaId, {
      id: firebaseUser.uid,
      nome: fullName,
      email: firebaseUser.email.trim().toLowerCase(),
      telefone: typeof metadata.phone === 'string' ? metadata.phone.trim() || null : null,
      cargo: selectedRole,
      foto: firebaseUser.photoURL,
    })
    if (typeof window !== 'undefined') localStorage.setItem('vaultpos_empresa_id', empresaId)
    setRole(selectedRole)
    user.value = compatibleUser(firebaseUser, role.value)
    return firebaseUser
  }

  async function init(): Promise<void> {
    if (initialized.value) return
    if (initPromise) return initPromise
    initPromise = new Promise((resolve) => {
      let firstEvent = true
      const timer = window.setTimeout(() => {
        if (!firstEvent) return
        firstEvent = false
        initialized.value = true
        resolve()
      }, initTimeoutMs)
      onAuthChange((firebaseUser) => {
        window.clearTimeout(timer)
        user.value = compatibleUser(firebaseUser, role.value)
        if (firebaseUser) void syncUserContext(firebaseUser)
        if (firstEvent) {
          firstEvent = false
          initialized.value = true
          resolve()
        }
      })
    })
    return initPromise
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const firebaseUser = await firebaseLogin(email.trim(), password)
      user.value = compatibleUser(firebaseUser, role.value)
      await prepareUserContext(firebaseUser)
      return firebaseUser
    } catch (caught) {
      error.value = traduzirErroFirebase(errorCode(caught))
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function loginGoogle() {
    loading.value = true
    error.value = null
    try {
      const firebaseUser = await loginWithGoogle()
      user.value = compatibleUser(firebaseUser, role.value)
      const hasProfile = await userHasVaultProfile(firebaseUser)
      return { user: firebaseUser, needsRegistration: !hasProfile }
    } catch (caught) {
      error.value = caught instanceof Error && !errorCode(caught)
        ? caught.message
        : traduzirErroFirebase(errorCode(caught))
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function completeGoogleRegistration(metadata: Record<string, unknown> = {}) {
    loading.value = true
    error.value = null
    try {
      if (!user.value) throw new Error('Entre com Google novamente para concluir o cadastro.')
      const firebaseUser = await createVaultProfileForUser(user.value, metadata)
      return firebaseUser
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Não foi possível concluir o cadastro.'
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, metadata: Record<string, unknown> = {}) {
    loading.value = true
    error.value = null
    try {
      const firebaseUser = await firebaseRegister(email.trim(), password, metadata)
      const empresaId = firebaseUser.uid
      const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : email.split('@')[0]
      const selectedRole: CargoUsuario = metadata.role === 'admin' ? 'admin' : 'garcom'
      await createEmpresa(empresaId, { nome: `Empresa de ${fullName}`, email: email.trim().toLowerCase() })
      await createUsuario(empresaId, {
        id: firebaseUser.uid,
        nome: fullName,
        email: email.trim().toLowerCase(),
        telefone: typeof metadata.phone === 'string' ? metadata.phone : null,
        cargo: selectedRole,
      })
      if (typeof window !== 'undefined') localStorage.setItem('vaultpos_empresa_id', empresaId)
      setRole(selectedRole)
      user.value = compatibleUser(firebaseUser, role.value)
      return firebaseUser
    } catch (caught) {
      error.value = traduzirErroFirebase(errorCode(caught))
      throw caught
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
      setRole('user')
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Erro ao sair.'
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function deleteAccount(empresaId?: string | null) {
    loading.value = true
    error.value = null
    deleteRequiresLogin.value = false
    try {
      if (!user.value?.uid) throw new Error('Usuário não autenticado.')
      const userToDelete = user.value
      const companyId = empresaId || (typeof window === 'undefined' ? null : localStorage.getItem('vaultpos_empresa_id'))
      const usesGoogle = userToDelete.providerData?.some((provider) => provider.providerId === 'google.com') ?? false

      if (!hasRecentLogin(userToDelete)) {
        if (usesGoogle) {
          await reauthenticateWithPopup(userToDelete, new GoogleAuthProvider())
        } else {
          savePendingAccountDeletion(userToDelete.uid, companyId)
          deleteRequiresLogin.value = true
          const recentLoginError = new Error('Entre novamente para confirmar a exclusão da conta.')
          Object.assign(recentLoginError, { code: 'auth/requires-recent-login' })
          throw recentLoginError
        }
      }

      if (companyId) await deleteUsuarioPermanent(companyId, userToDelete.uid)
      await deleteCurrentUser()

      clearPendingAccountDeletion()
      user.value = null
      setRole('user')
      if (typeof window !== 'undefined') localStorage.removeItem('vaultpos_empresa_id')
    } catch (caught) {
      const code = errorCode(caught)
      if (code === 'auth/requires-recent-login' && user.value?.uid) {
        const companyId = empresaId || (typeof window === 'undefined' ? null : localStorage.getItem('vaultpos_empresa_id'))
        savePendingAccountDeletion(user.value.uid, companyId)
        deleteRequiresLogin.value = true
      }
      error.value = code === 'auth/requires-recent-login'
        ? 'Entre novamente para confirmar a exclusão da conta.'
        : caught instanceof Error ? caught.message : 'Erro ao excluir conta.'
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function finishPendingAccountDeletion() {
    const pending = getPendingAccountDeletion()
    if (!pending || !user.value) return false
    if (pending.uid !== user.value.uid) {
      clearPendingAccountDeletion()
      return false
    }
    await deleteAccount(pending.empresaId)
    return true
  }

  async function forgotPassword(email: string) {
    loading.value = true
    error.value = null
    try {
      await firebaseForgotPassword(email.trim())
    } catch (caught) {
      error.value = traduzirErroFirebase(errorCode(caught))
      throw caught
    } finally {
      loading.value = false
    }
  }

  function errorCode(caught: unknown) {
    return typeof caught === 'object' && caught && 'code' in caught ? String(caught.code) : ''
  }

  function traduzirErroFirebase(code: string): string {
    const errors: Record<string, string> = {
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-credential': 'E-mail ou senha incorretos.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-disabled': 'Usuário desativado.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/email-already-in-use': 'E-mail já cadastrado.',
      'auth/weak-password': 'Senha muito fraca. Mínimo 6 caracteres.',
      'auth/popup-closed-by-user': 'Login cancelado.',
      'auth/popup-blocked': 'O navegador bloqueou a janela do Google.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
    }
    return errors[code] ?? 'Erro ao autenticar. Tente novamente.'
  }

  return {
    user,
    session,
    loading,
    error,
    initialized,
    deleteRequiresLogin,
    isAuthenticated,
    userId,
    userEmail,
    userRole,
    isAdmin,
    init,
    login,
    loginGoogle,
    completeGoogleRegistration,
    register,
    logout,
    deleteAccount,
    finishPendingAccountDeletion,
    forgotPassword,
    setRole,
  }
})
