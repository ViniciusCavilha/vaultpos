import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import {
  numericValue,
  optionalString,
  toDateMillis,
  toIsoString,
} from '@/firebase/utils'
import type {
  MovimentacaoComRelacoes,
  TipoMovimentacao,
} from '@/types/database.types'

function movementsCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'movimentacoes')
}

async function relation(
  empresaId: string,
  collectionName: 'produtos' | 'usuarios',
  id: string | null,
): Promise<Record<string, unknown> | null> {
  if (!id) return null
  const snapshot = await getDoc(
    doc(db, 'empresas', empresaId, collectionName, id),
  )
  return snapshot.exists() ? snapshot.data() : null
}

async function mapMovement(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): Promise<MovimentacaoComRelacoes> {
  const productId = String(data.produtoId ?? data.produto_id ?? '')
  const userId = optionalString(data.usuarioId ?? data.usuario_id)
  const [product, user] = await Promise.all([
    relation(empresaId, 'produtos', productId),
    relation(empresaId, 'usuarios', userId),
  ])

  return {
    id,
    empresa_id: empresaId,
    produto_id: productId,
    usuario_id: userId,
    tipo: (data.tipo ?? 'ajuste') as TipoMovimentacao,
    quantidade: numericValue(data.quantidade),
    motivo: optionalString(data.motivo),
    data: toIsoString(data.data),
    produtos: product
      ? { id: productId, nome: String(product.nome ?? '') }
      : null,
    usuarios:
      user && userId
        ? { id: userId, nome: String(user.nome ?? '') }
        : null,
  }
}

export async function getMovimentacoes(
  empresaId: string,
): Promise<MovimentacaoComRelacoes[]> {
  const snapshot = await getDocs(movementsCollection(empresaId))
  const movements = await Promise.all(
    snapshot.docs.map((item) =>
      mapMovement(empresaId, item.id, item.data()),
    ),
  )

  return movements.sort(
    (a, b) => toDateMillis(b.data) - toDateMillis(a.data),
  )
}

export async function movimentarEstoque(
  empresaId: string,
  dados: {
    produtoId?: string
    produto_id?: string
    usuarioId?: string
    usuario_id?: string
    tipo: TipoMovimentacao
    quantidade: number
    motivo?: string
  },
): Promise<void> {
  const productId = String(dados.produtoId ?? dados.produto_id ?? '')
  const userId = optionalString(dados.usuarioId ?? dados.usuario_id)
  if (!productId) throw new Error('Produto não informado.')
  if (dados.quantidade < 0) throw new Error('Quantidade inválida.')

  const productReference = doc(
    db,
    'empresas',
    empresaId,
    'produtos',
    productId,
  )
  const movementReference = doc(movementsCollection(empresaId))

  await runTransaction(db, async (transaction) => {
    const productSnapshot = await transaction.get(productReference)
    if (!productSnapshot.exists()) throw new Error('Produto não encontrado.')

    const currentStock = numericValue(productSnapshot.data().estoque)
    let newStock = currentStock

    if (dados.tipo === 'entrada') newStock += dados.quantidade
    else if (dados.tipo === 'saida') newStock -= dados.quantidade
    else newStock = dados.quantidade

    if (newStock < 0) throw new Error('Estoque insuficiente.')

    transaction.set(movementReference, {
      empresaId,
      produtoId: productId,
      usuarioId: userId,
      tipo: dados.tipo,
      quantidade: dados.quantidade,
      motivo: dados.motivo ?? null,
      estoqueAnterior: currentStock,
      estoqueNovo: newStock,
      data: serverTimestamp(),
    })
    transaction.update(productReference, { estoque: newStock })
  })
}
