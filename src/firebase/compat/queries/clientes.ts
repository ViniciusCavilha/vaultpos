import {
  createCliente as createFirebaseCliente,
  deleteCliente as deleteFirebaseCliente,
  getClienteById as getFirebaseClienteById,
  getClientes,
  updateCliente as updateFirebaseCliente,
} from '@/firebase/collections/clientes'
import { getEmpresaId } from '@/firebase/compat/context'
import type { CreateCliente, UpdateCliente } from '@/types/database.types'

export { getClientes }

export async function getClienteById(id: string) {
  return getFirebaseClienteById(getEmpresaId(), id)
}

export async function createCliente(cliente: CreateCliente) {
  return createFirebaseCliente(cliente.empresa_id, cliente)
}

export async function updateCliente(id: string, updates: UpdateCliente) {
  return updateFirebaseCliente(getEmpresaId(), id, updates)
}

export async function deleteCliente(id: string) {
  return deleteFirebaseCliente(getEmpresaId(), id)
}
