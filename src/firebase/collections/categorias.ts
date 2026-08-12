import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where, type DocumentData } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { cleanData } from '@/firebase/firestore-utils'
import type { Categoria, UpdateCategoria } from '@/types/database.types'

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'categorias')

function mapCategoria(id: string, empresaId: string, data: DocumentData): Categoria {
  return {
    id,
    empresa_id: empresaId,
    nome: data.nome ?? '',
    descricao: data.descricao ?? null,
    ativo: data.ativo ?? true,
  }
}

export async function getCategorias(empresaId: string): Promise<Categoria[]> {
  const snap = await getDocs(query(col(empresaId), where('ativo', '==', true)))
  return snap.docs
    .map((item) => mapCategoria(item.id, empresaId, item.data()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function createCategoria(empresaId: string, dados: {
  nome: string
  descricao?: string | null
}) {
  const reference = await addDoc(col(empresaId), cleanData({
    ...dados,
    empresaId,
    ativo: true,
  }))
  const snap = await getDoc(reference)
  return mapCategoria(reference.id, empresaId, snap.data() ?? {})
}

export async function updateCategoria(empresaId: string, categoriaId: string, updates: UpdateCategoria) {
  await updateDoc(doc(col(empresaId), categoriaId), cleanData(updates))
  const snap = await getDoc(doc(col(empresaId), categoriaId))
  return snap.exists() ? mapCategoria(snap.id, empresaId, snap.data()) : null
}

export async function deleteCategoria(empresaId: string, categoriaId: string) {
  await updateDoc(doc(col(empresaId), categoriaId), { ativo: false })
}
