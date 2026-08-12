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
import {
  numericValue,
  optionalString,
  toDateMillis,
  toIsoString,
  withoutUndefined,
} from '@/firebase/utils'
import type {
  Comanda,
  ComandaComRelacoes,
  ComandaDetalhada,
  ItemComandaComProduto,
  StatusComanda,
} from '@/types/database.types'

function ordersCollection(empresaId: string) {
  return collection(db, 'empresas', empresaId, 'comandas')
}

function itemsCollection(empresaId: string, comandaId: string) {
  return collection(
    db,
    'empresas',
    empresaId,
    'comandas',
    comandaId,
    'itens',
  )
}

async function relatedDocument(
  empresaId: string,
  collectionName: 'usuarios' | 'clientes' | 'produtos',
  id: string | null,
): Promise<Record<string, unknown> | null> {
  if (!id) return null
  const snapshot = await getDoc(
    doc(db, 'empresas', empresaId, collectionName, id),
  )
  return snapshot.exists() ? snapshot.data() : null
}

async function mapOrder(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): Promise<ComandaComRelacoes> {
  const customerId = optionalString(data.clienteId ?? data.cliente_id)
  const waiterId = optionalString(data.garcomId ?? data.garcom_id)
  const [customer, waiter] = await Promise.all([
    relatedDocument(empresaId, 'clientes', customerId),
    relatedDocument(empresaId, 'usuarios', waiterId),
  ])

  return {
    id,
    empresa_id: empresaId,
    cliente_id: customerId,
    garcom_id: waiterId,
    mesa:
      typeof data.mesa === 'number' && Number.isFinite(data.mesa)
        ? data.mesa
        : null,
    observacoes: optionalString(data.observacoes),
    status: (data.status ?? 'aberta') as StatusComanda,
    subtotal: numericValue(data.subtotal),
    desconto: numericValue(data.desconto),
    taxa_servico: numericValue(data.taxaServico ?? data.taxa_servico),
    total: numericValue(data.total),
    criada_em: toIsoString(data.criadaEm ?? data.criada_em),
    fechada_em:
      data.fechadaEm || data.fechada_em
        ? toIsoString(data.fechadaEm ?? data.fechada_em)
        : null,
    clientes:
      customer && customerId
        ? {
            id: customerId,
            nome: String(customer.nome ?? ''),
            telefone: optionalString(customer.telefone),
          }
        : null,
    usuarios:
      waiter && waiterId
        ? { id: waiterId, nome: String(waiter.nome ?? '') }
        : null,
  }
}

async function mapItem(
  empresaId: string,
  id: string,
  data: Record<string, unknown>,
): Promise<ItemComandaComProduto> {
  const productId = String(data.produtoId ?? data.produto_id ?? '')
  const product = await relatedDocument(empresaId, 'produtos', productId)
  const unitValue = numericValue(data.valorUnitario ?? data.valor_unitario)
  const quantity = numericValue(data.quantidade)

  return {
    id,
    comanda_id: String(data.comandaId ?? data.comanda_id ?? ''),
    produto_id: productId,
    quantidade: quantity,
    valor_unitario: unitValue,
    subtotal: numericValue(data.subtotal, quantity * unitValue),
    produtos: product
      ? {
          id: productId,
          nome: String(product.nome ?? data.nomeProduto ?? 'Produto'),
          imagem: optionalString(product.imagem),
        }
      : {
          id: productId,
          nome: String(data.nomeProduto ?? 'Produto'),
          imagem: null,
        },
  }
}

export async function getComandas(
  empresaId: string,
  status?: StatusComanda | string,
): Promise<ComandaComRelacoes[]> {
  const snapshot = await getDocs(ordersCollection(empresaId))
  const filtered = snapshot.docs.filter(
    (item) => !status || item.data().status === status,
  )
  const orders = await Promise.all(
    filtered.map((item) => mapOrder(empresaId, item.id, item.data())),
  )

  return orders.sort(
    (a, b) => toDateMillis(b.criada_em) - toDateMillis(a.criada_em),
  )
}

export async function getComandaById(
  empresaId: string,
  comandaId: string,
): Promise<ComandaDetalhada | null> {
  const [orderSnapshot, itemsSnapshot] = await Promise.all([
    getDoc(doc(ordersCollection(empresaId), comandaId)),
    getDocs(itemsCollection(empresaId, comandaId)),
  ])

  if (!orderSnapshot.exists()) return null

  const [order, items] = await Promise.all([
    mapOrder(empresaId, orderSnapshot.id, orderSnapshot.data()),
    Promise.all(
      itemsSnapshot.docs.map((item) =>
        mapItem(empresaId, item.id, item.data()),
      ),
    ),
  ])

  return { ...order, itens_comanda: items }
}

export async function createComanda(
  empresaId: string,
  dados: {
    garcomId?: string
    garcom_id?: string
    mesa?: number
    clienteId?: string
    cliente_id?: string
    observacoes?: string
    taxaServico?: number
    taxa_servico?: number
  },
): Promise<Comanda> {
  const reference = await addDoc(
    ordersCollection(empresaId),
    withoutUndefined({
      empresaId,
      garcomId: dados.garcomId ?? dados.garcom_id ?? null,
      mesa: dados.mesa,
      clienteId: dados.clienteId ?? dados.cliente_id ?? null,
      observacoes: dados.observacoes ?? null,
      status: 'aberta',
      subtotal: 0,
      desconto: 0,
      taxaServico: numericValue(
        dados.taxaServico ?? dados.taxa_servico,
      ),
      total: 0,
      criadaEm: serverTimestamp(),
      fechadaEm: null,
    }),
  )

  const created = await getComandaById(empresaId, reference.id)
  if (!created) throw new Error('Não foi possível carregar a comanda criada.')
  return created
}

export async function addItemComanda(
  empresaId: string,
  comandaId: string,
  item: {
    produtoId?: string
    produto_id?: string
    nomeProduto?: string
    quantidade: number
    valorUnitario?: number
    valor_unitario?: number
  },
): Promise<ItemComandaComProduto> {
  const productId = String(item.produtoId ?? item.produto_id ?? '')
  if (!productId) throw new Error('Produto não informado.')

  const product = await relatedDocument(empresaId, 'produtos', productId)
  if (!product) throw new Error('Produto não encontrado.')

  const unitValue = numericValue(item.valorUnitario ?? item.valor_unitario)
  const subtotal = item.quantidade * unitValue
  const reference = await addDoc(itemsCollection(empresaId, comandaId), {
    comandaId,
    produtoId: productId,
    nomeProduto: item.nomeProduto ?? String(product.nome ?? 'Produto'),
    quantidade: item.quantidade,
    valorUnitario: unitValue,
    subtotal,
  })

  await recalculateTotals(empresaId, comandaId)
  return mapItem(empresaId, reference.id, {
    comandaId,
    produtoId: productId,
    nomeProduto: item.nomeProduto ?? product.nome,
    quantidade: item.quantidade,
    valorUnitario: unitValue,
    subtotal,
  })
}

export async function updateItemQuantidade(
  empresaId: string,
  comandaId: string,
  itemId: string,
  quantidade: number,
  valorUnitario: number,
): Promise<void> {
  await updateDoc(doc(itemsCollection(empresaId, comandaId), itemId), {
    quantidade,
    subtotal: quantidade * valorUnitario,
  })
  await recalculateTotals(empresaId, comandaId)
}

export async function removeItemComanda(
  empresaId: string,
  comandaId: string,
  itemId: string,
): Promise<void> {
  await deleteDoc(doc(itemsCollection(empresaId, comandaId), itemId))
  await recalculateTotals(empresaId, comandaId)
}

export async function fecharComanda(
  empresaId: string,
  comandaId: string,
  desconto = 0,
): Promise<void> {
  const order = await getComandaById(empresaId, comandaId)
  if (!order) throw new Error('Comanda não encontrada.')

  await updateDoc(doc(ordersCollection(empresaId), comandaId), {
    status: 'fechada',
    desconto,
    total: order.subtotal + order.taxa_servico - desconto,
    fechadaEm: serverTimestamp(),
  })
}

export async function cancelarComanda(
  empresaId: string,
  comandaId: string,
): Promise<void> {
  await updateDoc(doc(ordersCollection(empresaId), comandaId), {
    status: 'cancelada',
    fechadaEm: serverTimestamp(),
  })
}

async function recalculateTotals(
  empresaId: string,
  comandaId: string,
): Promise<void> {
  const [itemsSnapshot, orderSnapshot] = await Promise.all([
    getDocs(itemsCollection(empresaId, comandaId)),
    getDoc(doc(ordersCollection(empresaId), comandaId)),
  ])
  if (!orderSnapshot.exists()) throw new Error('Comanda não encontrada.')

  const subtotal = itemsSnapshot.docs.reduce(
    (sum, item) => sum + numericValue(item.data().subtotal),
    0,
  )
  const order = orderSnapshot.data()
  const total =
    subtotal +
    numericValue(order.taxaServico ?? order.taxa_servico) -
    numericValue(order.desconto)

  await updateDoc(doc(ordersCollection(empresaId), comandaId), {
    subtotal,
    total,
  })
}
