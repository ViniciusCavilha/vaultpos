import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, type DocumentData, type QuerySnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { compareIsoDesc, toIsoString } from '@/firebase/firestore-utils'
import type { MetodoPagamento, PagamentoComRelacoes, StatusPagamento } from '@/types/database.types'

export interface PagamentoFirebaseInput {
  comandaId: string
  metodo: MetodoPagamento
  valor: number
  recebidoPor: string
}

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'pagamentos')

async function mapPagamento(id: string, empresaId: string, data: DocumentData): Promise<PagamentoComRelacoes> {
  const [orderSnap, userSnap] = await Promise.all([
    data.comandaId ? getDoc(doc(db, 'empresas', empresaId, 'comandas', data.comandaId)) : null,
    data.recebidoPor ? getDoc(doc(db, 'empresas', empresaId, 'usuarios', data.recebidoPor)) : null,
  ])
  return {
    id,
    empresa_id: empresaId,
    comanda_id: data.comandaId ?? '',
    metodo: data.metodo as MetodoPagamento,
    valor: Number(data.valor ?? 0),
    status: (data.status ?? 'pago') as StatusPagamento,
    recebido_por: data.recebidoPor ?? null,
    data_pagamento: toIsoString(data.dataPagamento),
    comandas: orderSnap?.exists() ? { id: orderSnap.id, mesa: orderSnap.data().mesa ?? null } : null,
    usuarios: userSnap?.exists() ? { id: userSnap.id, nome: String(userSnap.data().nome ?? '') } : null,
  }
}

async function mapList(empresaId: string, snapshots: QuerySnapshot<DocumentData>) {
  const payments = await Promise.all(snapshots.docs.map((item) => mapPagamento(item.id, empresaId, item.data())))
  return payments.sort((a, b) => compareIsoDesc(a.data_pagamento, b.data_pagamento))
}

export async function getPagamentos(empresaId: string) {
  return mapList(empresaId, await getDocs(col(empresaId)))
}

export async function getPagamentosByComanda(empresaId: string, comandaId: string) {
  return mapList(empresaId, await getDocs(query(col(empresaId), where('comandaId', '==', comandaId))))
}

export async function createPagamento(empresaId: string, dados: PagamentoFirebaseInput) {
  const reference = await addDoc(col(empresaId), {
    ...dados,
    empresaId,
    status: 'pago',
    dataPagamento: serverTimestamp(),
  })
  const snap = await getDoc(reference)
  return mapPagamento(reference.id, empresaId, snap.data() ?? {})
}

export async function cancelarPagamento(empresaId: string, pagamentoId: string) {
  await updateDoc(doc(col(empresaId), pagamentoId), { status: 'cancelado' })
}
