import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const firebaseUser = {
  uid: 'user-1',
  email: 'demo@example.com',
  displayName: 'Demo User',
  phoneNumber: null,
  photoURL: null,
  metadata: {
    lastSignInTime: new Date().toISOString(),
  },
}

vi.mock('@/firebase/auth', () => ({
  login: vi.fn(async () => firebaseUser),
  loginWithGoogle: vi.fn(async () => firebaseUser),
  logout: vi.fn(async () => undefined),
  deleteCurrentUser: vi.fn(async () => undefined),
  forgotPassword: vi.fn(async () => undefined),
  onAuthChange: vi.fn((callback: (user: typeof firebaseUser | null) => void) => {
    callback(null)
    return vi.fn()
  }),
  register: vi.fn(async () => firebaseUser),
}))

vi.mock('@/firebase/collections/empresas', () => ({
  createEmpresa: vi.fn(async () => ({ id: 'user-1' })),
}))

vi.mock('@/firebase/collections/usuarios', () => ({
  createUsuario: vi.fn(async () => ({ id: 'user-1', cargo: 'garcom' })),
  getUsuarioById: vi.fn(async () => null),
  getUsuarioMembership: vi.fn(async () => null),
  deleteUsuarioPermanent: vi.fn(async () => undefined),
}))

import { useAuthStore } from '@/stores/auth.store'

describe('auth store Firebase', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    firebaseUser.metadata.lastSignInTime = new Date().toISOString()
    setActivePinia(createPinia())
  })

  it('cria conta, mantém a API pública e encerra a sessão', async () => {
    const store = useAuthStore()

    await store.register('demo@example.com', '123456', { full_name: 'Demo User' })

    expect(store.isAuthenticated).toBe(true)
    expect(store.userId).toBe('user-1')
    expect(store.userRole).toBe('garcom')
    expect(localStorage.getItem('vaultpos_empresa_id')).toBe('user-1')

    await store.logout()

    expect(store.isAuthenticated).toBe(false)
  })

  it('exclui a conta quando a autenticação é recente', async () => {
    const store = useAuthStore()
    await store.register('demo@example.com', '123456', { full_name: 'Demo User' })

    await store.deleteAccount('user-1')

    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('vaultpos_empresa_id')).toBeNull()
    expect(sessionStorage.getItem('vaultpos_pending_account_deletion')).toBeNull()
  })

  it('não apaga dados antes de uma nova entrada quando a sessão é antiga', async () => {
    firebaseUser.metadata.lastSignInTime = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const store = useAuthStore()
    await store.register('demo@example.com', '123456', { full_name: 'Demo User' })

    await expect(store.deleteAccount('user-1')).rejects.toThrow('Entre novamente')

    expect(store.isAuthenticated).toBe(true)
    expect(store.deleteRequiresLogin).toBe(true)
    expect(sessionStorage.getItem('vaultpos_pending_account_deletion')).toContain('user-1')
  })
})
