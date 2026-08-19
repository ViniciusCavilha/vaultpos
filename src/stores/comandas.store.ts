import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user.store'
import {
  getComandas,
  getComandaById,
  createComanda,
  addItemComanda,
  removeItemComanda,
  updateItemQuantidade,
  fecharComanda,
  cancelarComanda,
} from '@/firebase/collections/comandas'

export const useComandasStore = defineStore('comandas', () => {
  // State
  const comandas = ref<any[]>([])
  const comandaAtiva = ref<any | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const comandasAbertas = computed(() =>
    comandas.value.filter(c => c.status === 'aberta')
  )
  const comandasFechadas = computed(() =>
    comandas.value.filter(c => c.status === 'fechada')
  )
  const totalComandasAbertas = computed(() => comandasAbertas.value.length)

  // Buscar todas as comandas
  async function fetchComandas(status?: 'aberta' | 'fechada' | 'cancelada') {
    const userStore = useUserStore()
    if (!userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      comandas.value = await getComandas(userStore.empresaId, status)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Buscar comanda específica com itens
  async function fetchComandaById(id: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      comandaAtiva.value = await getComandaById(userStore.empresaId, id)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // Abrir nova comanda
  async function abrirComanda(dados: {
    mesa?: number
    cliente_id?: string
    observacoes?: string
  }) {
    const userStore = useUserStore()
    if (!userStore.empresaId || !userStore.usuario) return

    loading.value = true
    error.value = null
    try {
      const novaComanda = await createComanda(userStore.empresaId, {
        garcom_id: userStore.usuario.id,
        ...dados,
      })
      comandas.value.unshift(novaComanda)
      return novaComanda
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Adicionar item na comanda ativa
  async function adicionarItem(item: {
    produto_id: string
    quantidade: number
    valor_unitario: number
  }) {
    const userStore = useUserStore()
    if (!comandaAtiva.value || !userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      await addItemComanda(
        userStore.empresaId,
        comandaAtiva.value.id,
        item,
      )
      await fetchComandaById(comandaAtiva.value.id) // recarrega com totais atualizados
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Remover item da comanda ativa
  async function removerItem(itemId: string) {
    const userStore = useUserStore()
    if (!comandaAtiva.value || !userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      await removeItemComanda(userStore.empresaId, comandaAtiva.value.id, itemId)
      await fetchComandaById(comandaAtiva.value.id)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Atualizar quantidade de item
  async function atualizarQuantidade(itemId: string, quantidade: number, valorUnitario: number) {
    const userStore = useUserStore()
    if (!comandaAtiva.value || !userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      await updateItemQuantidade(
        userStore.empresaId,
        comandaAtiva.value.id,
        itemId,
        quantidade,
        valorUnitario,
      )
      await fetchComandaById(comandaAtiva.value.id)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fechar comanda
  async function fechar(id: string, desconto = 0) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      await fecharComanda(userStore.empresaId, id, desconto)
      await fetchComandas()
      comandaAtiva.value = null
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Cancelar comanda
  async function cancelar(id: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return

    loading.value = true
    error.value = null
    try {
      await cancelarComanda(userStore.empresaId, id)
      await fetchComandas()
      comandaAtiva.value = null
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    comandas,
    comandaAtiva,
    loading,
    error,
    // Getters
    comandasAbertas,
    comandasFechadas,
    totalComandasAbertas,
    // Actions
    fetchComandas,
    fetchComandaById,
    abrirComanda,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    fechar,
    cancelar,
  }
})
