import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from 'firebase/auth'
import {
  forgotPassword as firebaseForgotPassword,
  login as firebaseLogin,
  loginWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
  register as firebaseRegister,
} from '@/firebase/auth'
import { createEmpresa } from '@/firebase/collections/empresas'
import { createUsuario, getUsuarioById, getUsuarioMembership } from '@/firebase/collections/usuarios'

export type VaultAuthUser = User & {
  id?: string
  user_metadata?: {
    full_name?: string | null
    phone?: string | null
    role?: string
  }
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
  const role = ref(storedRole())
  let initPromise: Promise<void> | null = null

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

  async function init(): Promise<void> {
    if (initialized.value) return
    if (initPromise) return initPromise
    initPromise = new Promise((resolve) => {
      let firstEvent = true
      onAuthChange((firebaseUser) => {
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
      const hasProfile = await syncUserContext(firebaseUser)
      if (!hasProfile && firebaseUser.email) {
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
      const hasProfile = await syncUserContext(firebaseUser)
      if (!hasProfile && firebaseUser.email) {
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
      return firebaseUser
    } catch (caught) {
      error.value = traduzirErroFirebase(errorCode(caught))
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
      await createEmpresa(empresaId, { nome: `Empresa de ${fullName}`, email: email.trim().toLowerCase() })
      await createUsuario(empresaId, {
        id: firebaseUser.uid,
        nome: fullName,
        email: email.trim().toLowerCase(),
        telefone: typeof metadata.phone === 'string' ? metadata.phone : null,
        cargo: 'garcom',
      })
      if (typeof window !== 'undefined') localStorage.setItem('vaultpos_empresa_id', empresaId)
      setRole('garcom')
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
    isAuthenticated,
    userId,
    userEmail,
    userRole,
    isAdmin,
    init,
    login,
    loginGoogle,
    register,
    logout,
    forgotPassword,
    setRole,
  }
})
