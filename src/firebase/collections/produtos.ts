import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { getCategorias } from '@/firebase/collections/categorias'
import {
  numericValue,
  optionalString,
  toIsoString,
  withoutUndefined,
} from '@/firebase/utils'
import type { ProdutoComCategoria } from '@/types/database.types'

export type ProdutoInput = {
  nome: string
  categoriaId?: string | null
  categoria_id?: string | null
  codigo?: string | null
  descricao?: string | null
  preco: number
  custo?: number
  estoque?: number
  estoqueMinimo?: number
  estoque_minimo?: number
  unidade?: string
  imagem?: string | null
}

function productsCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'produtos')
}

function mapProduct(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
  categoryName?: string,
): ProdutoComCategoria {
  const categoryId = optionalString(data.categoriaId ?? data.categoria_id)

  return {
    id,
    empresa_id: empresaId,
    categoria_id: categoryId,
    codigo: optionalString(data.codigo),
    nome: String(data.nome ?? ''),
    descricao: optionalString(data.descricao),
    preco: numericValue(data.preco),
    custo: numericValue(data.custo),
    estoque: numericValue(data.estoque),
    estoque_minimo: numericValue(data.estoqueMinimo ?? data.estoque_minimo),
    unidade: String(data.unidade ?? 'un'),
    imagem: optionalString(data.imagem),
    ativo: data.ativo !== false,
    criado_em: toIsoString(data.criadoEm),
    categorias:
      categoryId && categoryName
        ? { id: categoryId, nome: categoryName }
        : null,
  }
}

async function categoryNames(empresaId: string): Promise<Map<string, string>> {
  const categories = await getCategorias(empresaId)
  return new Map(categories.map((category) => [category.id, category.nome]))
}

export async function getProdutos(
  empresaId: string,
): Promise<ProdutoComCategoria[]> {
  const [snapshot, categories] = await Promise.all([
    getDocs(query(productsCollection(empresaId), where('ativo', '==', true))),
    categoryNames(empresaId),
  ])

  return snapshot.docs
    .map((item) => {
      const categoryId = optionalString(
        item.data().categoriaId ?? item.data().categoria_id,
      )
      return mapProduct(
        empresaId,
        item.id,
        item.data(),
        categoryId ? categories.get(categoryId) : undefined,
      )
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getProdutoById(
  empresaId: string,
  produtoId: string,
): Promise<ProdutoComCategoria | null> {
  const [snapshot, categories] = await Promise.all([
    getDoc(doc(productsCollection(empresaId), produtoId)),
    categoryNames(empresaId),
  ])

  if (!snapshot.exists()) return null
  const categoryId = optionalString(
    snapshot.data().categoriaId ?? snapshot.data().categoria_id,
  )
  return mapProduct(
    empresaId,
    snapshot.id,
    snapshot.data(),
    categoryId ? categories.get(categoryId) : undefined,
  )
}

export async function getProdutosPorCategoria(
  empresaId: string,
  categoriaId: string,
): Promise<ProdutoComCategoria[]> {
  const products = await getProdutos(empresaId)
  return products.filter((product) => product.categoria_id === categoriaId)
}

function productPayload(dados: ProdutoInput) {
  return withoutUndefined({
    nome: dados.nome,
    categoriaId: dados.categoriaId ?? dados.categoria_id ?? null,
    codigo: dados.codigo ?? null,
    descricao: dados.descricao ?? null,
    preco: numericValue(dados.preco),
    custo: numericValue(dados.custo),
    estoque: numericValue(dados.estoque),
    estoqueMinimo: numericValue(
      dados.estoqueMinimo ?? dados.estoque_minimo,
    ),
    unidade: dados.unidade ?? 'un',
    imagem: dados.imagem ?? null,
  })
}

export async function createProduto(
  empresaId: string,
  dados: ProdutoInput,
): Promise<ProdutoComCategoria> {
  const reference = await addDoc(productsCollection(empresaId), {
    ...productPayload(dados),
    empresaId,
    ativo: true,
    criadoEm: serverTimestamp(),
  })

  const created = await getProdutoById(empresaId, reference.id)
  if (!created) throw new Error('Não foi possível carregar o produto criado.')
  return created
}

export async function updateProduto(
  empresaId: string,
  produtoId: string,
  updates: Partial<ProdutoInput> & { ativo?: boolean },
): Promise<ProdutoComCategoria | null> {
  await updateDoc(
    doc(productsCollection(empresaId), produtoId),
    withoutUndefined({
      nome: updates.nome,
      categoriaId: updates.categoriaId ?? updates.categoria_id,
      codigo: updates.codigo,
      descricao: updates.descricao,
      preco: updates.preco,
      custo: updates.custo,
      estoque: updates.estoque,
      estoqueMinimo: updates.estoqueMinimo ?? updates.estoque_minimo,
      unidade: updates.unidade,
      imagem: updates.imagem,
      ativo: updates.ativo,
    }),
  )

  return getProdutoById(empresaId, produtoId)
}

export async function deleteProduto(
  empresaId: string,
  produtoId: string,
): Promise<void> {
  await updateDoc(doc(productsCollection(empresaId), produtoId), {
    ativo: false,
  })
}
