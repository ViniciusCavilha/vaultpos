import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createPagamento, getPagamentos } from '@/firebase/collections/pagamentos'
import { useUserStore } from '@/stores/user.store'
import type { MetodoPagamento, PagamentoComRelacoes } from '@/types/database.types'

export const useFinanceiroStore = defineStore('financeiro', () => {
  const pagamentos = ref<PagamentoComRelacoes[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const paid = computed(() => pagamentos.value.filter((item) => item.status === 'pago'))
  const totalRecebido = computed(() => paid.value.reduce((total, item) => total + item.valor, 0))
  const totalPix = computed(() => paid.value.filter((item) => item.metodo === 'pix').reduce((total, item) => total + item.valor, 0))
  const totalCartao = computed(() => paid.value.filter((item) => item.metodo === 'cartao').reduce((total, item) => total + item.valor, 0))
  const totalDinheiro = computed(() => paid.value.filter((item) => item.metodo === 'dinheiro').reduce((total, item) => total + item.valor, 0))

  function errorMessage(caught: unknown) {
    return caught instanceof Error ? caught.message : 'Erro ao acessar pagamentos.'
  }

  async function fetchPagamentos() {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      pagamentos.value = await getPagamentos(userStore.empresaId)
    } catch (caught) {
      error.value = errorMessage(caught)
    } finally {
      loading.value = false
    }
  }

  async function registrarPagamento(dados: {
    comanda_id: string
    metodo: MetodoPagamento
    valor: number
  }) {
    const userStore = useUserStore()
    if (!userStore.empresaId || !userStore.usuario) return
    loading.value = true
    error.value = null
    try {
      const payment = await createPagamento(userStore.empresaId, {
        comandaId: dados.comanda_id,
        metodo: dados.metodo,
        valor: dados.valor,
        recebidoPor: userStore.usuario.id,
      })
      pagamentos.value.unshift(payment)
      return payment
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  return {
    pagamentos,
    loading,
    error,
    totalRecebido,
    totalPix,
    totalCartao,
    totalDinheiro,
    fetchPagamentos,
    registrarPagamento,
  }
})
