import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { optionalString, toIsoString, withoutUndefined } from '@/firebase/utils'
import type { CargoUsuario, Usuario } from '@/types/database.types'

export type FirebaseUsuario = Usuario & {
  empresaId: string
  criadoEm: string
  ultimoLogin: string | null
}

function usersCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'usuarios')
}

function mapUser(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): FirebaseUsuario {
  const createdAt = toIsoString(data.criadoEm)
  const lastLogin = data.ultimoLogin ? toIsoString(data.ultimoLogin) : null

  return {
    id,
    empresa_id: empresaId,
    empresaId,
    nome: String(data.nome ?? ''),
    email: String(data.email ?? ''),
    telefone: optionalString(data.telefone),
    cargo: (data.cargo ?? 'garcom') as CargoUsuario,
    foto: optionalString(data.foto),
    ativo: data.ativo !== false,
    ultimo_login: lastLogin,
    ultimoLogin: lastLogin,
    criado_em: createdAt,
    criadoEm: createdAt,
  }
}

export async function getUsuarios(empresaId: string): Promise<FirebaseUsuario[]> {
  const snapshot = await getDocs(usersCollection(empresaId))

  return snapshot.docs
    .map((item) => mapUser(empresaId, item.id, item.data()))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function findUsuarioByAuthUid(
  authUid: string,
): Promise<FirebaseUsuario | null> {
  const snapshot = await getDocs(
    query(collectionGroup(db, 'usuarios'), where('authUid', '==', authUid)),
  )
  const match = snapshot.docs[0]
  const empresaId = match?.ref.parent.parent?.id

  return match && empresaId
    ? mapUser(empresaId, match.id, match.data())
    : null
}

export async function getUsuarioById(
  empresaId: string,
  usuarioId: string,
): Promise<FirebaseUsuario | null> {
  const snapshot = await getDoc(doc(usersCollection(empresaId), usuarioId))
  return snapshot.exists()
    ? mapUser(empresaId, snapshot.id, snapshot.data())
    : null
}

export async function getUsuarioByEmail(
  empresaId: string,
  email: string,
): Promise<FirebaseUsuario | null> {
  const snapshot = await getDocs(
    query(usersCollection(empresaId), where('email', '==', email)),
  )
  const match = snapshot.docs[0]
  return match ? mapUser(empresaId, match.id, match.data()) : null
}

export async function createUsuario(
  empresaId: string,
  dados: {
    nome: string
    email: string
    telefone?: string | null
    cargo: CargoUsuario
    foto?: string | null
    authUid?: string
  },
): Promise<FirebaseUsuario> {
  const reference = dados.authUid
    ? doc(usersCollection(empresaId), dados.authUid)
    : doc(usersCollection(empresaId))
  await setDoc(
    reference,
    withoutUndefined({
      ...dados,
      empresaId,
      ativo: true,
      ultimoLogin: null,
      criadoEm: serverTimestamp(),
    }),
  )

  const created = await getUsuarioById(empresaId, reference.id)
  if (!created) throw new Error('Não foi possível carregar o usuário criado.')
  return created
}

export async function updateUsuario(
  empresaId: string,
  usuarioId: string,
  updates: Partial<{
    nome: string
    email: string
    telefone: string | null
    cargo: CargoUsuario
    foto: string | null
    ativo: boolean
  }>,
): Promise<FirebaseUsuario | null> {
  await updateDoc(
    doc(usersCollection(empresaId), usuarioId),
    withoutUndefined(updates),
  )
  return getUsuarioById(empresaId, usuarioId)
}

export async function updateUltimoLogin(
  empresaId: string,
  usuarioId: string,
): Promise<void> {
  await updateDoc(doc(usersCollection(empresaId), usuarioId), {
    ultimoLogin: serverTimestamp(),
  })
}

export async function deleteUsuario(
  empresaId: string,
  usuarioId: string,
): Promise<void> {
  await updateDoc(doc(usersCollection(empresaId), usuarioId), { ativo: false })
}
