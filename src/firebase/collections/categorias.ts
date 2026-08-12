import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { optionalString, withoutUndefined } from '@/firebase/utils'
import type { Categoria } from '@/types/database.types'

function categoriesCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'categorias')
}

function mapCategory(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): Categoria {
  return {
    id,
    empresa_id: empresaId,
    nome: String(data.nome ?? ''),
    descricao: optionalString(data.descricao),
    ativo: data.ativo !== false,
  }
}

async function getCategoryById(
  empresaId: string,
  categoriaId: string,
): Promise<Categoria | null> {
  const snapshot = await getDoc(
    doc(categoriesCollection(empresaId), categoriaId),
  )
  return snapshot.exists()
    ? mapCategory(empresaId, snapshot.id, snapshot.data())
    : null
}

export async function getCategorias(empresaId: string): Promise<Categoria[]> {
  const snapshot = await getDocs(
    query(categoriesCollection(empresaId), where('ativo', '==', true)),
  )

  return snapshot.docs
    .map((item) => mapCategory(empresaId, item.id, item.data()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function createCategoria(
  empresaId: string,
  dados: { nome: string; descricao?: string | null },
): Promise<Categoria> {
  const reference = await addDoc(
    categoriesCollection(empresaId),
    withoutUndefined({ ...dados, empresaId, ativo: true }),
  )

  const created = await getCategoryById(empresaId, reference.id)
  if (!created) throw new Error('Não foi possível carregar a categoria criada.')
  return created
}

export async function updateCategoria(
  empresaId: string,
  categoriaId: string,
  updates: Partial<{ nome: string; descricao: string | null; ativo: boolean }>,
): Promise<Categoria | null> {
  await updateDoc(
    doc(categoriesCollection(empresaId), categoriaId),
    withoutUndefined(updates),
  )
  return getCategoryById(empresaId, categoriaId)
}

export async function deleteCategoria(
  empresaId: string,
  categoriaId: string,
): Promise<void> {
  await updateDoc(doc(categoriesCollection(empresaId), categoriaId), {
    ativo: false,
  })
}
