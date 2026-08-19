import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createEmpresa } from '@/firebase/collections/empresas'
import {
  createUsuario,
  findUsuarioByAuthUid,
  getUsuarioById,
  getUsuarioByEmail,
  updateUltimoLogin,
  updateUsuario,
} from '@/firebase/collections/usuarios'
import { useAuthStore } from './auth.store'
import type { CargoUsuario } from '@/types/database.types'

interface UsuarioLogado {
  id: string
  empresa_id: string
  nome: string
  email: string
  telefone: string | null
  cargo: CargoUsuario
  foto: string | null
  ativo: boolean
}

export const useUserStore = defineStore('user', () => {
  const usuario = ref<UsuarioLogado | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAdmin = computed(() => usuario.value?.cargo === 'admin')
  const isGarcom = computed(() => usuario.value?.cargo === 'garcom')
  const empresaId = computed(() => usuario.value?.empresa_id ?? null)
  const nomeUsuario = computed(() => usuario.value?.nome ?? '')

  async function fetchUsuarioLogado() {
    const authStore = useAuthStore()
    if (!authStore.userId || !authStore.userEmail) return

    loading.value = true
    error.value = null
    try {
      const savedCompany = localStorage.getItem('vaultpos:empresaId')
      let profile = savedCompany
        ? (await getUsuarioById(savedCompany, authStore.userId)) ??
          (await getUsuarioByEmail(savedCompany, authStore.userEmail))
        : null

      profile ??= await findUsuarioByAuthUid(authStore.userId)
      if (!profile) {
        const companyId = authStore.userId
        const emailName = authStore.userEmail.split('@')[0]
        const name =
          authStore.user?.displayName?.trim() || emailName || 'Administrador'
        profile = await createUsuario(companyId, {
          nome: name,
          email: authStore.userEmail,
          cargo: 'admin',
          foto: authStore.user?.photoURL,
          authUid: authStore.userId,
        })
        await createEmpresa(companyId, {
          nome: `Empresa de ${name}`,
          email: authStore.userEmail,
        })
      }

      if (!profile) throw new Error('Usuário não vinculado a uma empresa.')
      if (!profile.ativo) throw new Error('Este usuário está desativado.')

      usuario.value = profile
      localStorage.setItem('vaultpos:empresaId', profile.empresa_id)
      await updateUltimoLogin(profile.empresa_id, profile.id)
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Erro ao carregar usuário.'
      usuario.value = null
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function updatePerfil(
    updates: Partial<{ nome: string; telefone: string; foto: string }>,
  ) {
    if (!usuario.value) return

    loading.value = true
    error.value = null
    try {
      const updated = await updateUsuario(
        usuario.value.empresa_id,
        usuario.value.id,
        updates,
      )
      if (updated) usuario.value = updated
    } catch (caught) {
      error.value =
        caught instanceof Error ? caught.message : 'Erro ao atualizar perfil.'
      throw caught
    } finally {
      loading.value = false
    }
  }

  function clear() {
    usuario.value = null
    error.value = null
    localStorage.removeItem('vaultpos:empresaId')
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
    clear,
  }
})
