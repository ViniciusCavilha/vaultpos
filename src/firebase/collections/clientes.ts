import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { optionalString, toIsoString, withoutUndefined } from '@/firebase/utils'
import type { Cliente } from '@/types/database.types'

function clientsCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'clientes')
}

function mapClient(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): Cliente {
  return {
    id,
    empresa_id: empresaId,
    nome: String(data.nome ?? ''),
    telefone: optionalString(data.telefone),
    observacoes: optionalString(data.observacoes),
    criado_em: toIsoString(data.criadoEm),
  }
}

export async function getClientes(empresaId: string): Promise<Cliente[]> {
  const snapshot = await getDocs(clientsCollection(empresaId))
  return snapshot.docs
    .map((item) => mapClient(empresaId, item.id, item.data()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getClienteById(
  empresaId: string,
  clienteId: string,
): Promise<Cliente | null> {
  const snapshot = await getDoc(doc(clientsCollection(empresaId), clienteId))
  return snapshot.exists()
    ? mapClient(empresaId, snapshot.id, snapshot.data())
    : null
}

export async function createCliente(
  empresaId: string,
  dados: {
    nome: string
    telefone?: string | null
    observacoes?: string | null
  },
): Promise<Cliente> {
  const reference = await addDoc(
    clientsCollection(empresaId),
    withoutUndefined({
      ...dados,
      empresaId,
      criadoEm: serverTimestamp(),
    }),
  )

  const created = await getClienteById(empresaId, reference.id)
  if (!created) throw new Error('Não foi possível carregar o cliente criado.')
  return created
}

export async function updateCliente(
  empresaId: string,
  clienteId: string,
  updates: Partial<{
    nome: string
    telefone: string | null
    observacoes: string | null
  }>,
): Promise<Cliente | null> {
  await updateDoc(
    doc(clientsCollection(empresaId), clienteId),
    withoutUndefined(updates),
  )
  return getClienteById(empresaId, clienteId)
}

export async function deleteCliente(
  empresaId: string,
  clienteId: string,
): Promise<void> {
  await deleteDoc(doc(clientsCollection(empresaId), clienteId))
}
