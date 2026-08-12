import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc, type DocumentData } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { cleanData, toIsoString } from '@/firebase/firestore-utils'
import type { Cliente, UpdateCliente } from '@/types/database.types'

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'clientes')

function mapCliente(id: string, empresaId: string, data: DocumentData): Cliente {
  return {
    id,
    empresa_id: empresaId,
    nome: data.nome ?? '',
    telefone: data.telefone ?? null,
    observacoes: data.observacoes ?? null,
    criado_em: toIsoString(data.criadoEm),
  }
}

export async function getClientes(empresaId: string): Promise<Cliente[]> {
  const snap = await getDocs(col(empresaId))
  return snap.docs
    .map((item) => mapCliente(item.id, empresaId, item.data()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getClienteById(empresaId: string, clienteId: string): Promise<Cliente | null> {
  const snap = await getDoc(doc(col(empresaId), clienteId))
  return snap.exists() ? mapCliente(snap.id, empresaId, snap.data()) : null
}

export async function createCliente(empresaId: string, dados: {
  nome: string
  telefone?: string | null
  observacoes?: string | null
}) {
  const reference = await addDoc(col(empresaId), cleanData({
    ...dados,
    empresaId,
    criadoEm: serverTimestamp(),
  }))
  const snap = await getDoc(reference)
  return mapCliente(reference.id, empresaId, snap.data() ?? {})
}

export async function updateCliente(empresaId: string, clienteId: string, updates: UpdateCliente) {
  await updateDoc(doc(col(empresaId), clienteId), cleanData(updates))
  return getClienteById(empresaId, clienteId)
}

export async function deleteCliente(empresaId: string, clienteId: string) {
  await deleteDoc(doc(col(empresaId), clienteId))
}
