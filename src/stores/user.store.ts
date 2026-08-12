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

  async function fetchUsuarioLogado() {
    const authStore = useAuthStore()
    if (!authStore.userEmail) return

    loading.value = true
    error.value = null
    try {
      const savedCompanyId = typeof window === 'undefined' ? null : localStorage.getItem('vaultpos_empresa_id')
      const authenticatedUserId = authStore.userId
      const membership = savedCompanyId || !authenticatedUserId
        ? null
        : await getUsuarioMembership(authenticatedUserId)
      const profile = savedCompanyId
        ? await getUsuarioByEmail(savedCompanyId, authStore.userEmail)
        : membership
          ? await getUsuarioById(membership.empresaId, authenticatedUserId as string)
          : null

      usuario.value = profile
      if (profile) {
        setEmpresaId(profile.empresa_id)
        authStore.setRole(profile.cargo)
      }
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Erro ao carregar o usuário.'
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
