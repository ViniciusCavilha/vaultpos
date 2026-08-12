import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, type DocumentData, type QuerySnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { cleanData, toIsoString } from '@/firebase/firestore-utils'
import type { ProdutoComCategoria } from '@/types/database.types'

export interface ProdutoFirebaseInput {
  nome: string
  categoriaId?: string | null
  codigo?: string | null
  descricao?: string | null
  preco: number
  custo?: number
  estoque?: number
  estoqueMinimo?: number
  unidade?: string
  imagem?: string | null
  ativo?: boolean
}

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'produtos')

function mapProduto(
  id: string,
  empresaId: string,
  data: DocumentData,
  categoria: { id: string; nome: string } | null,
): ProdutoComCategoria {
  return {
    id,
    empresa_id: empresaId,
    categoria_id: data.categoriaId ?? null,
    codigo: data.codigo ?? null,
    nome: data.nome ?? '',
    descricao: data.descricao ?? null,
    preco: Number(data.preco ?? 0),
    custo: Number(data.custo ?? 0),
    estoque: Number(data.estoque ?? 0),
    estoque_minimo: Number(data.estoqueMinimo ?? 0),
    unidade: data.unidade ?? 'un',
    imagem: data.imagem ?? null,
    ativo: data.ativo ?? true,
    criado_em: toIsoString(data.criadoEm),
    categorias: categoria,
  }
}

async function categoryMap(empresaId: string) {
  const snap = await getDocs(collection(db, 'empresas', empresaId, 'categorias'))
  return new Map(snap.docs.map((item) => [item.id, { id: item.id, nome: String(item.data().nome ?? '') }]))
}

async function mapSnapshots(empresaId: string, snapshots: QuerySnapshot<DocumentData>) {
  const categories = await categoryMap(empresaId)
  return snapshots.docs.map((item) => {
    const categoryId = item.data().categoriaId as string | undefined
    return mapProduto(item.id, empresaId, item.data(), categoryId ? categories.get(categoryId) ?? null : null)
  })
}

export async function getProdutos(empresaId: string): Promise<ProdutoComCategoria[]> {
  const snap = await getDocs(query(col(empresaId), where('ativo', '==', true)))
  const products = await mapSnapshots(empresaId, snap)
  return products.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getProdutoById(empresaId: string, produtoId: string): Promise<ProdutoComCategoria | null> {
  const snap = await getDoc(doc(col(empresaId), produtoId))
  if (!snap.exists()) return null
  const categoryId = snap.data().categoriaId as string | undefined
  const categorySnap = categoryId ? await getDoc(doc(db, 'empresas', empresaId, 'categorias', categoryId)) : null
  const category = categorySnap?.exists() ? { id: categorySnap.id, nome: String(categorySnap.data().nome ?? '') } : null
  return mapProduto(snap.id, empresaId, snap.data(), category)
}

export async function getProdutosPorCategoria(empresaId: string, categoriaId: string) {
  const snap = await getDocs(query(
    col(empresaId),
    where('categoriaId', '==', categoriaId),
    where('ativo', '==', true),
  ))
  const products = await mapSnapshots(empresaId, snap)
  return products.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function createProduto(empresaId: string, dados: ProdutoFirebaseInput) {
  const reference = await addDoc(col(empresaId), cleanData({
    ...dados,
    empresaId,
    estoque: dados.estoque ?? 0,
    estoqueMinimo: dados.estoqueMinimo ?? 0,
    unidade: dados.unidade ?? 'un',
    ativo: dados.ativo ?? true,
    criadoEm: serverTimestamp(),
  }))
  return getProdutoById(empresaId, reference.id)
}

export async function updateProduto(empresaId: string, produtoId: string, updates: Partial<ProdutoFirebaseInput>) {
  await updateDoc(doc(col(empresaId), produtoId), cleanData(updates))
  return getProdutoById(empresaId, produtoId)
}

export async function deleteProduto(empresaId: string, produtoId: string) {
  await updateDoc(doc(col(empresaId), produtoId), { ativo: false })
}
