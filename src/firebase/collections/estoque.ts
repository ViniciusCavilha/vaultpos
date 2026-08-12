import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp, type DocumentData } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { compareIsoDesc, toIsoString } from '@/firebase/firestore-utils'
import type { MovimentacaoComRelacoes, TipoMovimentacao } from '@/types/database.types'

export interface MovimentacaoFirebaseInput {
  produtoId: string
  usuarioId: string
  tipo: TipoMovimentacao
  quantidade: number
  motivo?: string
}

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'movimentacoes')

async function mapMovimentacao(id: string, empresaId: string, data: DocumentData): Promise<MovimentacaoComRelacoes> {
  const [productSnap, userSnap] = await Promise.all([
    data.produtoId ? getDoc(doc(db, 'empresas', empresaId, 'produtos', data.produtoId)) : null,
    data.usuarioId ? getDoc(doc(db, 'empresas', empresaId, 'usuarios', data.usuarioId)) : null,
  ])
  return {
    id,
    empresa_id: empresaId,
    produto_id: data.produtoId ?? '',
    usuario_id: data.usuarioId ?? null,
    tipo: data.tipo as TipoMovimentacao,
    quantidade: Number(data.quantidade ?? 0),
    motivo: data.motivo ?? null,
    data: toIsoString(data.data),
    produtos: productSnap?.exists() ? { id: productSnap.id, nome: String(productSnap.data().nome ?? '') } : null,
    usuarios: userSnap?.exists() ? { id: userSnap.id, nome: String(userSnap.data().nome ?? '') } : null,
  }
}

export async function getMovimentacoes(empresaId: string) {
  const snap = await getDocs(col(empresaId))
  const movements = await Promise.all(snap.docs.map((item) => mapMovimentacao(item.id, empresaId, item.data())))
  return movements.sort((a, b) => compareIsoDesc(a.data, b.data))
}

export async function movimentarEstoque(empresaId: string, dados: MovimentacaoFirebaseInput) {
  const productRef = doc(db, 'empresas', empresaId, 'produtos', dados.produtoId)
  const movementRef = doc(col(empresaId))

  await runTransaction(db, async (transaction) => {
    const productSnap = await transaction.get(productRef)
    if (!productSnap.exists()) throw new Error('Produto não encontrado.')

    const estoqueAnterior = Number(productSnap.data().estoque ?? 0)
    let estoqueNovo = estoqueAnterior
    if (dados.tipo === 'entrada') estoqueNovo += dados.quantidade
    else if (dados.tipo === 'saida') estoqueNovo -= dados.quantidade
    else estoqueNovo = dados.quantidade
    if (estoqueNovo < 0) throw new Error('Estoque insuficiente.')

    transaction.set(movementRef, {
      ...dados,
      empresaId,
      motivo: dados.motivo ?? null,
      estoqueAnterior,
      estoqueNovo,
      data: serverTimestamp(),
    })
    transaction.update(productRef, { estoque: estoqueNovo })
  })

  const snap = await getDoc(movementRef)
  return mapMovimentacao(movementRef.id, empresaId, snap.data() ?? {})
}
