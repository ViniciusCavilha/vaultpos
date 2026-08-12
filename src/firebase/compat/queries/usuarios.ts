import {
  createUsuario as createFirebaseUsuario,
  deleteUsuario as deleteFirebaseUsuario,
  getUsuarioByEmail as getFirebaseUsuarioByEmail,
  getUsuarioById as getFirebaseUsuarioById,
  getUsuarios,
  updateUltimoLogin as updateFirebaseUltimoLogin,
  updateUsuario as updateFirebaseUsuario,
} from '@/firebase/collections/usuarios'
import { getEmpresaId } from '@/firebase/compat/context'
import { consumePendingUserId } from '@/firebase/compat/pending-user'
import type { CreateUsuario, UpdateUsuario } from '@/types/database.types'

export { getUsuarios }

export async function getUsuarioById(id: string) {
  return getFirebaseUsuarioById(getEmpresaId(), id)
}

export async function getUsuarioByEmail(email: string) {
  return getFirebaseUsuarioByEmail(getEmpresaId(), email)
}

export async function createUsuario(usuario: CreateUsuario) {
  return createFirebaseUsuario(usuario.empresa_id, {
    ...usuario,
    id: consumePendingUserId(usuario.email),
  })
}

export async function updateUsuario(id: string, updates: UpdateUsuario) {
  return updateFirebaseUsuario(getEmpresaId(), id, updates)
}

export async function deleteUsuario(id: string) {
  return deleteFirebaseUsuario(getEmpresaId(), id)
}

export async function updateUltimoLogin(id: string) {
  return updateFirebaseUltimoLogin(getEmpresaId(), id)
}
