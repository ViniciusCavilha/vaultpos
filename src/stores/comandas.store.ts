import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addItemComanda,
  cancelarComanda,
  createComanda,
  fecharComanda,
  getComandaById,
  getComandas,
  removeItemComanda,
  updateItemQuantidade,
} from '@/firebase/collections/comandas'
import { useUserStore } from '@/stores/user.store'
import type { ComandaComRelacoes, ComandaDetalhada, StatusComanda } from '@/types/database.types'

export const useComandasStore = defineStore('comandas', () => {
  const comandas = ref<ComandaComRelacoes[]>([])
  const comandaAtiva = ref<ComandaDetalhada | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const comandasAbertas = computed(() => comandas.value.filter((item) => item.status === 'aberta'))
  const comandasFechadas = computed(() => comandas.value.filter((item) => item.status === 'fechada'))
  const totalComandasAbertas = computed(() => comandasAbertas.value.length)

  function errorMessage(caught: unknown) {
    return caught instanceof Error ? caught.message : 'Erro ao acessar comandas.'
  }

  async function fetchComandas(status?: StatusComanda) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      comandas.value = await getComandas(userStore.empresaId, status)
    } catch (caught) {
      error.value = errorMessage(caught)
    } finally {
      loading.value = false
    }
  }

  async function fetchComandaById(id: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      comandaAtiva.value = await getComandaById(userStore.empresaId, id)
    } catch (caught) {
      error.value = errorMessage(caught)
    } finally {
      loading.value = false
    }
  }

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
      const order = await createComanda(userStore.empresaId, {
        garcomId: userStore.usuario.id,
        mesa: dados.mesa,
        clienteId: dados.cliente_id,
        observacoes: dados.observacoes,
      })
      await fetchComandas()
      return order
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function adicionarItem(item: {
    produto_id: string
    quantidade: number
    valor_unitario: number
  }) {
    const userStore = useUserStore()
    if (!userStore.empresaId || !comandaAtiva.value) return
    loading.value = true
    error.value = null
    try {
      await addItemComanda(userStore.empresaId, comandaAtiva.value.id, {
        produtoId: item.produto_id,
        quantidade: item.quantidade,
        valorUnitario: item.valor_unitario,
      })
      await fetchComandaById(comandaAtiva.value.id)
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function removerItem(itemId: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId || !comandaAtiva.value) return
    loading.value = true
    error.value = null
    try {
      await removeItemComanda(userStore.empresaId, comandaAtiva.value.id, itemId)
      await fetchComandaById(comandaAtiva.value.id)
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function atualizarQuantidade(itemId: string, quantidade: number, valorUnitario: number) {
    const userStore = useUserStore()
    if (!userStore.empresaId || !comandaAtiva.value) return
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
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function fechar(id: string, desconto = 0) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      await fecharComanda(userStore.empresaId, id, desconto)
      await fetchComandas()
      comandaAtiva.value = null
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function cancelar(id: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      await cancelarComanda(userStore.empresaId, id)
      await fetchComandas()
      comandaAtiva.value = null
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  return {
    comandas,
    comandaAtiva,
    loading,
    error,
    comandasAbertas,
    comandasFechadas,
    totalComandasAbertas,
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
