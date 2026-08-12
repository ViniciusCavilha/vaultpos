import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { cleanData, compareIsoDesc, toIsoString } from '@/firebase/firestore-utils'
import type {
  Comanda,
  ComandaComRelacoes,
  ComandaDetalhada,
  ItemComandaComProduto,
  StatusComanda,
  UpdateComanda,
} from '@/types/database.types'

export interface ComandaFirebaseInput {
  garcomId: string
  mesa?: number
  clienteId?: string
  observacoes?: string
  taxaServico?: number
}

export interface ItemFirebaseInput {
  produtoId: string
  nomeProduto?: string
  imagemProduto?: string | null
  quantidade: number
  valorUnitario: number
}

const col = (empresaId: string) => collection(db, 'empresas', empresaId, 'comandas')
const itensCol = (empresaId: string, comandaId: string) => collection(db, 'empresas', empresaId, 'comandas', comandaId, 'itens')

function mapComanda(id: string, empresaId: string, data: DocumentData): Comanda {
  return {
    id,
    empresa_id: empresaId,
    cliente_id: data.clienteId ?? null,
    garcom_id: data.garcomId ?? null,
    mesa: data.mesa ?? null,
    observacoes: data.observacoes ?? null,
    status: (data.status ?? 'aberta') as StatusComanda,
    subtotal: Number(data.subtotal ?? 0),
    desconto: Number(data.desconto ?? 0),
    taxa_servico: Number(data.taxaServico ?? 0),
    total: Number(data.total ?? 0),
    criada_em: toIsoString(data.criadaEm),
    fechada_em: toIsoString(data.fechadaEm) || null,
  }
}

async function loadRelations(empresaId: string, data: DocumentData) {
  const [clienteSnap, usuarioSnap] = await Promise.all([
    data.clienteId ? getDoc(doc(db, 'empresas', empresaId, 'clientes', data.clienteId)) : null,
    data.garcomId ? getDoc(doc(db, 'empresas', empresaId, 'usuarios', data.garcomId)) : null,
  ])
  return {
    clientes: clienteSnap?.exists()
      ? { id: clienteSnap.id, nome: String(clienteSnap.data().nome ?? ''), telefone: clienteSnap.data().telefone ?? null }
      : null,
    usuarios: usuarioSnap?.exists()
      ? { id: usuarioSnap.id, nome: String(usuarioSnap.data().nome ?? '') }
      : null,
  }
}

async function mapComandaWithRelations(id: string, empresaId: string, data: DocumentData): Promise<ComandaComRelacoes> {
  return { ...mapComanda(id, empresaId, data), ...await loadRelations(empresaId, data) }
}

function mapItem(id: string, comandaId: string, data: DocumentData): ItemComandaComProduto {
  return {
    id,
    comanda_id: comandaId,
    produto_id: data.produtoId ?? '',
    quantidade: Number(data.quantidade ?? 0),
    valor_unitario: Number(data.valorUnitario ?? 0),
    subtotal: Number(data.subtotal ?? 0),
    produtos: data.produtoId
      ? { id: data.produtoId, nome: data.nomeProduto ?? 'Produto', imagem: data.imagemProduto ?? null }
      : null,
  }
}

export async function getComandas(empresaId: string, status?: StatusComanda): Promise<ComandaComRelacoes[]> {
  const source = status ? query(col(empresaId), where('status', '==', status)) : col(empresaId)
  const snap = await getDocs(source)
  const orders = await Promise.all(snap.docs.map((item) => mapComandaWithRelations(item.id, empresaId, item.data())))
  return orders.sort((a, b) => compareIsoDesc(a.criada_em, b.criada_em))
}

export async function getComandaById(empresaId: string, comandaId: string): Promise<ComandaDetalhada | null> {
  const [orderSnap, itemsSnap] = await Promise.all([
    getDoc(doc(col(empresaId), comandaId)),
    getDocs(itensCol(empresaId, comandaId)),
  ])
  if (!orderSnap.exists()) return null
  const order = await mapComandaWithRelations(orderSnap.id, empresaId, orderSnap.data())
  const itens = itemsSnap.docs.map((item) => mapItem(item.id, comandaId, item.data()))
  return { ...order, itens_comanda: itens }
}

export async function createComanda(empresaId: string, dados: ComandaFirebaseInput) {
  const reference = await addDoc(col(empresaId), cleanData({
    ...dados,
    empresaId,
    status: 'aberta',
    subtotal: 0,
    desconto: 0,
    taxaServico: dados.taxaServico ?? 0,
    total: 0,
    criadaEm: serverTimestamp(),
    fechadaEm: null,
  }))
  const snap = await getDoc(reference)
  return mapComanda(reference.id, empresaId, snap.data() ?? {})
}

export async function updateComanda(empresaId: string, comandaId: string, updates: UpdateComanda) {
  await updateDoc(doc(col(empresaId), comandaId), cleanData({
    clienteId: updates.cliente_id,
    garcomId: updates.garcom_id,
    mesa: updates.mesa,
    observacoes: updates.observacoes,
    status: updates.status,
    subtotal: updates.subtotal,
    desconto: updates.desconto,
    taxaServico: updates.taxa_servico,
    total: updates.total,
    fechadaEm: updates.fechada_em,
  }))
  return getComandaById(empresaId, comandaId)
}

export async function addItemComanda(empresaId: string, comandaId: string, item: ItemFirebaseInput) {
  let nomeProduto = item.nomeProduto
  let imagemProduto = item.imagemProduto ?? null
  if (!nomeProduto) {
    const productSnap = await getDoc(doc(db, 'empresas', empresaId, 'produtos', item.produtoId))
    if (productSnap.exists()) {
      nomeProduto = String(productSnap.data().nome ?? 'Produto')
      imagemProduto = productSnap.data().imagem ?? null
    }
  }
  const subtotal = item.quantidade * item.valorUnitario
  const reference = await addDoc(itensCol(empresaId, comandaId), {
    produtoId: item.produtoId,
    nomeProduto: nomeProduto ?? 'Produto',
    imagemProduto,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    subtotal,
  })
  await recalcularTotais(empresaId, comandaId)
  return mapItem(reference.id, comandaId, { ...item, nomeProduto, imagemProduto, subtotal })
}

export async function updateItemQuantidade(
  empresaId: string,
  comandaId: string,
  itemId: string,
  quantidade: number,
  valorUnitario: number,
) {
  const subtotal = quantidade * valorUnitario
  await updateDoc(doc(itensCol(empresaId, comandaId), itemId), { quantidade, subtotal })
  await recalcularTotais(empresaId, comandaId)
}

export async function removeItemComanda(empresaId: string, comandaId: string, itemId: string) {
  await deleteDoc(doc(itensCol(empresaId, comandaId), itemId))
  await recalcularTotais(empresaId, comandaId)
}

export async function fecharComanda(empresaId: string, comandaId: string, desconto = 0) {
  const comanda = await getComandaById(empresaId, comandaId)
  if (!comanda) throw new Error('Comanda não encontrada.')
  const total = comanda.subtotal + comanda.taxa_servico - desconto
  await updateDoc(doc(col(empresaId), comandaId), {
    status: 'fechada',
    desconto,
    total,
    fechadaEm: serverTimestamp(),
  })
  return getComandaById(empresaId, comandaId)
}

export async function cancelarComanda(empresaId: string, comandaId: string) {
  await updateDoc(doc(col(empresaId), comandaId), {
    status: 'cancelada',
    fechadaEm: serverTimestamp(),
  })
  return getComandaById(empresaId, comandaId)
}

async function recalcularTotais(empresaId: string, comandaId: string) {
  const [itemsSnap, orderSnap] = await Promise.all([
    getDocs(itensCol(empresaId, comandaId)),
    getDoc(doc(col(empresaId), comandaId)),
  ])
  if (!orderSnap.exists()) throw new Error('Comanda não encontrada.')
  const subtotal = itemsSnap.docs.reduce((sum, item) => sum + Number(item.data().subtotal ?? 0), 0)
  const taxaServico = Number(orderSnap.data().taxaServico ?? 0)
  const desconto = Number(orderSnap.data().desconto ?? 0)
  await updateDoc(orderSnap.ref, { subtotal, total: subtotal + taxaServico - desconto })
}
