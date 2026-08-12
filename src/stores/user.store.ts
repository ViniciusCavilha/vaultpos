import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getUsuarioByEmail, getUsuarioById, getUsuarioMembership, updateUsuario } from '@/firebase/collections/usuarios'
import { useAuthStore } from '@/stores/auth.store'
import type { Usuario } from '@/types/database.types'

export const useUserStore = defineStore('user', () => {
  const usuario = ref<Usuario | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAdmin = computed(() => usuario.value?.cargo === 'admin')
  const isGarcom = computed(() => usuario.value?.cargo === 'garcom')
  const empresaId = computed(() => usuario.value?.empresa_id ?? null)
  const nomeUsuario = computed(() => usuario.value?.nome ?? '')

  function fallbackProfile() {
    const authStore = useAuthStore()
    if (!authStore.userId || !authStore.userEmail) return null
    const companyId = typeof window === 'undefined'
      ? authStore.userId
      : localStorage.getItem('vaultpos_empresa_id') || authStore.userId
    return {
      id: authStore.userId,
      empresa_id: companyId,
      nome: authStore.user?.displayName || authStore.userEmail.split('@')[0],
      email: authStore.userEmail,
      telefone: authStore.user?.phoneNumber ?? null,
      cargo: authStore.isAdmin ? 'admin' as const : 'garcom' as const,
      foto: authStore.user?.photoURL ?? null,
      ativo: true,
      ultimo_login: null,
      criado_em: '',
    }
  }

  function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Tempo limite ao carregar o perfil.')), timeoutMs)
      promise.then(resolve, reject).finally(() => window.clearTimeout(timer))
    })
  }

  async function fetchUsuarioLogado() {
    const authStore = useAuthStore()
    if (!authStore.userEmail) return

    loading.value = true
    error.value = null
    usuario.value = fallbackProfile()
    try {
      const savedCompanyId = typeof window === 'undefined' ? null : localStorage.getItem('vaultpos_empresa_id')
      const authenticatedUserId = authStore.userId
      const profile = await withTimeout((async () => {
        const membership = savedCompanyId || !authenticatedUserId
          ? null
          : await getUsuarioMembership(authenticatedUserId)
        return savedCompanyId
          ? getUsuarioByEmail(savedCompanyId, authStore.userEmail as string)
          : membership
            ? getUsuarioById(membership.empresaId, authenticatedUserId as string)
            : null
      })())

      if (profile) {
        usuario.value = profile
        setEmpresaId(profile.empresa_id)
        authStore.setRole(profile.cargo)
      }
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Erro ao carregar o usuário.'
      if (!usuario.value) usuario.value = fallbackProfile()
    } finally {
      loading.value = false
    }
  }

  async function updatePerfil(updates: Partial<Pick<Usuario, 'nome' | 'telefone' | 'foto'>>) {
    if (!usuario.value) return
    loading.value = true
    error.value = null
    try {
      const updated = await updateUsuario(usuario.value.empresa_id, usuario.value.id, updates)
      if (updated) usuario.value = updated
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Erro ao atualizar o perfil.'
      throw caught
    } finally {
      loading.value = false
    }
  }

  function setEmpresaId(id: string) {
    if (typeof window !== 'undefined') localStorage.setItem('vaultpos_empresa_id', id)
  }

  function clear() {
    usuario.value = null
    error.value = null
    if (typeof window !== 'undefined') localStorage.removeItem('vaultpos_empresa_id')
  }

  return {
    usuario,
    loading,
    error,
    isAdmin,
    isGarcom,
    empresaId,
    nomeUsuario,
    fetchUsuarioLogado,
    updatePerfil,
    setEmpresaId,
    clear,
  }
})
