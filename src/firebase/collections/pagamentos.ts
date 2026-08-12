import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import {
  numericValue,
  optionalString,
  toDateMillis,
  toIsoString,
} from '@/firebase/utils'
import type {
  MetodoPagamento,
  Pagamento,
  PagamentoComRelacoes,
} from '@/types/database.types'
import { serverTimestamp } from 'firebase/firestore'

function paymentsCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'pagamentos')
}

async function relation(
  empresaId: string,
  collectionName: 'comandas' | 'usuarios',
  id: string | null,
): Promise<Record<string, unknown> | null> {
  if (!id) return null
  const snapshot = await getDoc(
    doc(db, 'empresas', empresaId, collectionName, id),
  )
  return snapshot.exists() ? snapshot.data() : null
}

async function mapPayment(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): Promise<PagamentoComRelacoes> {
  const orderId = String(data.comandaId ?? data.comanda_id ?? '')
  const receiverId = optionalString(data.recebidoPor ?? data.recebido_por)
  const [order, receiver] = await Promise.all([
    relation(empresaId, 'comandas', orderId),
    relation(empresaId, 'usuarios', receiverId),
  ])

  return {
    id,
    empresa_id: empresaId,
    comanda_id: orderId,
    metodo: (data.metodo ?? 'pix') as MetodoPagamento,
    valor: numericValue(data.valor),
    status: data.status === 'cancelado' ? 'cancelado' : 'pago',
    recebido_por: receiverId,
    data_pagamento: toIsoString(data.dataPagamento ?? data.data_pagamento),
    comandas: order
      ? {
          id: orderId,
          mesa:
            typeof order.mesa === 'number' && Number.isFinite(order.mesa)
              ? order.mesa
              : null,
        }
      : null,
    usuarios:
      receiver && receiverId
        ? { id: receiverId, nome: String(receiver.nome ?? '') }
        : null,
  }
}

export async function getPagamentos(
  empresaId: string,
): Promise<PagamentoComRelacoes[]> {
  const snapshot = await getDocs(paymentsCollection(empresaId))
  const payments = await Promise.all(
    snapshot.docs.map((item) =>
      mapPayment(empresaId, item.id, item.data()),
    ),
  )

  return payments.sort(
    (a, b) =>
      toDateMillis(b.data_pagamento) - toDateMillis(a.data_pagamento),
  )
}

export async function getPagamentosByComanda(
  empresaId: string,
  comandaId: string,
): Promise<PagamentoComRelacoes[]> {
  const payments = await getPagamentos(empresaId)
  return payments.filter((payment) => payment.comanda_id === comandaId)
}

export async function createPagamento(
  empresaId: string,
  dados: {
    comandaId?: string
    comanda_id?: string
    metodo: MetodoPagamento
    valor: number
    recebidoPor?: string
    recebido_por?: string
  },
): Promise<Pagamento> {
  const orderId = String(dados.comandaId ?? dados.comanda_id ?? '')
  const receiverId = optionalString(
    dados.recebidoPor ?? dados.recebido_por,
  )
  if (!orderId) throw new Error('Comanda não informada.')

  const reference = await addDoc(paymentsCollection(empresaId), {
    empresaId,
    comandaId: orderId,
    metodo: dados.metodo,
    valor: dados.valor,
    recebidoPor: receiverId,
    status: 'pago',
    dataPagamento: serverTimestamp(),
  })

  return {
    id: reference.id,
    empresa_id: empresaId,
    comanda_id: orderId,
    metodo: dados.metodo,
    valor: dados.valor,
    status: 'pago',
    recebido_por: receiverId,
    data_pagamento: new Date().toISOString(),
  }
}

export async function cancelarPagamento(
  empresaId: string,
  pagamentoId: string,
): Promise<void> {
  await updateDoc(doc(paymentsCollection(empresaId), pagamentoId), {
    status: 'cancelado',
  })
}
