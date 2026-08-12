import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { cleanData, toIsoString } from '@/firebase/firestore-utils'
import type { CargoUsuario, UpdateUsuario, Usuario } from '@/types/database.types'

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'usuarios')

function mapUsuario(id: string, empresaId: string, data: DocumentData): Usuario {
  return {
    id,
    empresa_id: empresaId,
    nome: data.nome ?? '',
    email: data.email ?? '',
    telefone: data.telefone ?? null,
    cargo: (data.cargo ?? 'garcom') as CargoUsuario,
    foto: data.foto ?? null,
    ativo: data.ativo ?? true,
    ultimo_login: toIsoString(data.ultimoLogin) || null,
    criado_em: toIsoString(data.criadoEm),
  }
}

function fromSnapshot(snapshot: QueryDocumentSnapshot<DocumentData>) {
  const empresaId = snapshot.ref.parent.parent?.id ?? snapshot.data().empresaId ?? ''
  return mapUsuario(snapshot.id, empresaId, snapshot.data())
}

function mapUpdates(updates: UpdateUsuario) {
  return cleanData({
    nome: updates.nome,
    email: updates.email,
    telefone: updates.telefone,
    cargo: updates.cargo,
    foto: updates.foto,
    ativo: updates.ativo,
    ultimoLogin: updates.ultimo_login,
  })
}

export async function getUsuarios(empresaId: string): Promise<Usuario[]> {
  const snap = await getDocs(query(col(empresaId), where('ativo', '==', true)))
  return snap.docs.map(fromSnapshot).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getAllUsuarios(empresaId: string): Promise<Usuario[]> {
  const snap = await getDocs(col(empresaId))
  return snap.docs.map(fromSnapshot).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export async function getUsuarioById(empresaId: string, usuarioId: string): Promise<Usuario | null> {
  const snap = await getDoc(doc(col(empresaId), usuarioId))
  return snap.exists() ? mapUsuario(snap.id, empresaId, snap.data()) : null
}

export async function getUsuarioByEmail(empresaId: string, email: string): Promise<Usuario | null> {
  const snap = await getDocs(query(col(empresaId), where('email', '==', email.trim().toLowerCase())))
  return snap.empty ? null : fromSnapshot(snap.docs[0])
}

export async function findUsuarioByEmail(email: string): Promise<Usuario | null> {
  const snap = await getDocs(query(collectionGroup(db, 'usuarios'), where('email', '==', email.trim().toLowerCase())))
  return snap.empty ? null : fromSnapshot(snap.docs[0])
}

export async function getUsuarioMembership(usuarioId: string) {
  const snap = await getDoc(doc(db, 'membros', usuarioId))
  if (!snap.exists()) return null
  return {
    empresaId: String(snap.data().empresaId ?? ''),
    cargo: (snap.data().cargo ?? 'garcom') as CargoUsuario,
  }
}

export async function createUsuario(empresaId: string, dados: {
  id?: string
  nome: string
  email: string
  telefone?: string | null
  cargo: CargoUsuario
  foto?: string | null
  ativo?: boolean
}) {
  const payload = cleanData({
    nome: dados.nome,
    email: dados.email.trim().toLowerCase(),
    telefone: dados.telefone ?? null,
    cargo: dados.cargo,
    foto: dados.foto ?? null,
    empresaId,
    ativo: dados.ativo ?? true,
    ultimoLogin: null,
    criadoEm: serverTimestamp(),
  })
  const reference = dados.id ? doc(col(empresaId), dados.id) : await addDoc(col(empresaId), payload)
  if (dados.id) {
    const batch = writeBatch(db)
    batch.set(reference, payload)
    batch.set(doc(db, 'membros', dados.id), {
      empresaId,
      cargo: dados.cargo,
      email: dados.email.trim().toLowerCase(),
    })
    await batch.commit()
  }
  const snap = await getDoc(reference)
  return mapUsuario(reference.id, empresaId, snap.data() ?? payload)
}

export async function updateUsuario(empresaId: string, usuarioId: string, updates: UpdateUsuario) {
  await updateDoc(doc(col(empresaId), usuarioId), mapUpdates(updates))
  return getUsuarioById(empresaId, usuarioId)
}

export async function updateUltimoLogin(empresaId: string, usuarioId: string) {
  await updateDoc(doc(col(empresaId), usuarioId), { ultimoLogin: serverTimestamp() })
}

export async function deleteUsuario(empresaId: string, usuarioId: string) {
  await updateDoc(doc(col(empresaId), usuarioId), { ativo: false })
}

export async function deleteUsuarioPermanent(empresaId: string, usuarioId: string) {
  const batch = writeBatch(db)
  batch.delete(doc(col(empresaId), usuarioId))
  batch.delete(doc(db, 'membros', usuarioId))
  await batch.commit()
}
