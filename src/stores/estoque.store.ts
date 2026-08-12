import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createCategoria, getCategorias } from '@/firebase/collections/categorias'
import { getMovimentacoes, movimentarEstoque } from '@/firebase/collections/estoque'
import { createProduto, deleteProduto, getProdutos, updateProduto, type ProdutoFirebaseInput } from '@/firebase/collections/produtos'
import { useUserStore } from '@/stores/user.store'
import type {
  Categoria,
  CreateProduto,
  MovimentacaoComRelacoes,
  ProdutoComCategoria,
  UpdateProduto,
} from '@/types/database.types'

export const useEstoqueStore = defineStore('estoque', () => {
  const produtos = ref<ProdutoComCategoria[]>([])
  const categorias = ref<Categoria[]>([])
  const movimentacoes = ref<MovimentacaoComRelacoes[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const produtosAtivos = computed(() => produtos.value.filter((item) => item.ativo))
  const produtosEstoqueBaixo = computed(() => produtos.value.filter((item) => item.estoque <= item.estoque_minimo && item.ativo))
  const totalProdutos = computed(() => produtosAtivos.value.length)
  const totalEstoqueBaixo = computed(() => produtosEstoqueBaixo.value.length)

  function errorMessage(caught: unknown) {
    return caught instanceof Error ? caught.message : 'Erro ao acessar o estoque.'
  }

  function toFirebaseProduct(dados: Partial<Omit<CreateProduto, 'empresa_id'>>): Partial<ProdutoFirebaseInput> {
    return {
      nome: dados.nome,
      categoriaId: dados.categoria_id,
      codigo: dados.codigo,
      descricao: dados.descricao,
      preco: dados.preco,
      custo: dados.custo,
      estoque: dados.estoque,
      estoqueMinimo: dados.estoque_minimo,
      unidade: dados.unidade,
      imagem: dados.imagem,
      ativo: dados.ativo,
    }
  }

  async function fetchProdutos() {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      produtos.value = await getProdutos(userStore.empresaId)
    } catch (caught) {
      error.value = errorMessage(caught)
    } finally {
      loading.value = false
    }
  }

  async function fetchCategorias() {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      categorias.value = await getCategorias(userStore.empresaId)
    } catch (caught) {
      error.value = errorMessage(caught)
    } finally {
      loading.value = false
    }
  }

  async function fetchMovimentacoes() {
    const userStore = useUserStore()
    if (!userStore.empresaId) return
    loading.value = true
    error.value = null
    try {
      movimentacoes.value = await getMovimentacoes(userStore.empresaId)
    } catch (caught) {
      error.value = errorMessage(caught)
    } finally {
      loading.value = false
    }
  }

  async function registrarMovimentacao(dados: {
    produto_id: string
    tipo: 'entrada' | 'saida' | 'ajuste'
    quantidade: number
    motivo?: string
  }) {
    const userStore = useUserStore()
    if (!userStore.empresaId || !userStore.usuario) return
    loading.value = true
    error.value = null
    try {
      const movement = await movimentarEstoque(userStore.empresaId, {
        produtoId: dados.produto_id,
        usuarioId: userStore.usuario.id,
        tipo: dados.tipo,
        quantidade: dados.quantidade,
        motivo: dados.motivo,
      })
      await Promise.all([fetchProdutos(), fetchMovimentacoes()])
      return movement
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function criarProduto(dados: Omit<CreateProduto, 'empresa_id'>) {
    const userStore = useUserStore()
    if (!userStore.empresaId) throw new Error('Empresa não encontrada.')
    loading.value = true
    error.value = null
    try {
      const product = await createProduto(userStore.empresaId, toFirebaseProduct(dados) as ProdutoFirebaseInput)
      await fetchProdutos()
      return product
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function editarProduto(id: string, dados: UpdateProduto) {
    const userStore = useUserStore()
    if (!userStore.empresaId) throw new Error('Empresa não encontrada.')
    loading.value = true
    error.value = null
    try {
      const product = await updateProduto(userStore.empresaId, id, toFirebaseProduct(dados))
      await fetchProdutos()
      return product
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function desativarProduto(id: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId) throw new Error('Empresa não encontrada.')
    loading.value = true
    error.value = null
    try {
      await deleteProduto(userStore.empresaId, id)
      await fetchProdutos()
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  async function criarCategoria(nome: string) {
    const userStore = useUserStore()
    if (!userStore.empresaId) throw new Error('Empresa não encontrada.')
    loading.value = true
    error.value = null
    try {
      const category = await createCategoria(userStore.empresaId, { nome, descricao: null })
      await fetchCategorias()
      return category
    } catch (caught) {
      error.value = errorMessage(caught)
      throw caught
    } finally {
      loading.value = false
    }
  }

  return {
    produtos,
    categorias,
    movimentacoes,
    loading,
    error,
    produtosAtivos,
    produtosEstoqueBaixo,
    totalProdutos,
    totalEstoqueBaixo,
    fetchProdutos,
    fetchCategorias,
    fetchMovimentacoes,
    registrarMovimentacao,
    criarProduto,
    editarProduto,
    desativarProduto,
    criarCategoria,
  }
})
